const puppeteer = require('puppeteer');
const moment = require('moment');
const { send } = require('../utils/email-service');
const serviceAccount = require('../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json');
const admin = require('firebase-admin');

const db = admin
  .initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://checkout-app-uk.firebaseio.com',
    },
    'Iceland Delivery'
  )
  .firestore();

class IcelandRewrite {
  constructor(postcode, email, docId, res) {
    this.merchant = 'Iceland';
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
    this.res = res;
    this.availabilityVerified = false;
    this.slots = {};
    this.entryUrl = 'https://www.iceland.co.uk/book-delivery';
    this.selectors = {
      // Step 1 - Groceries
      postcodeInput: '#postal-code',
      postcodeSubmit: '#main form.check-postcode button',
      postcodeError: '#postal-code-error',
      deliveryStatus: '#main form.check-postcode .delivery-status',

      // Step 2 - Slots found
      slotDatesAvailability: '.delivery-range', // text content
      availableSlots: '.delivery-schedule-slot:not(.unavailable)',
      slotTime: '.delivery-schedule-slot-range > div',
      slotDate: '[data-slots-key]',
    };

    this.checkSlots();
  }

  async checkSlots() {
    try {
      this.slots = await this.retrieveAvailableTimeSlots();

      if (this.availabilityVerified) {
        await send(this.slots);
        await db.doc(`jobs/${this.docId}`).update({ state: 'Completed' });
      } else {
        console.log('No slots currently available');
      }
    } catch (error) {
      console.log(error);
    }

    return this.res.status(200).end();
  }

  async retrieveAvailableTimeSlots() {
    console.log('retrieving time slots from iceland');
    const { postcode, selectors, entryUrl } = this;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.goto(entryUrl, {
        waitUntil: 'load',
        timeout: 0,
      });

      // Populates postcode field
      await page.evaluate(this.enterPostcode, postcode, selectors);

      // Waits for delivery status to render
      await page.waitForSelector(selectors.deliveryStatus);

      // Submits the postcode field providing it's valid
      await page.evaluate(this.submitPostcode, selectors);

      // // Step 2 loaded
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
      });

      // Extracts available slots from page
      const availableSlotsObj = await page.evaluate(
        this.extractAvailableTimeSlots,
        selectors
      );

      const slots = this.returnFormattedSlots(availableSlotsObj);
      console.log('slots are', slots);

      // const htmlBody = await page.content();
      // this.res.send(htmlBody);

      await browser.close();

      return slots;
    } catch (error) {
      console.log('oh no iceland puppeteer');
      await browser.close();
      throw error;
    }
  }

  enterPostcode(postcode, selectors) {
    const postcodeInput = document.querySelector(selectors.postcodeInput);
    if (postcodeInput) {
      postcodeInput.focus();
      postcodeInput.value = postcode;
      // Triggers error message/delivery status if any.
      postcodeInput.blur();

      const postcodeError = document.querySelector(selectors.postcodeError);

      if (postcodeError) {
        // throw new Error(error.textContent);
        // Is this the only possible error?
        throw new Error('Invalid postcode');
      }
    } else {
      throw new Error(
        'Missing element - Cannot find postcodeInput on page, please amend selector'
      );
    }
  }

  submitPostcode(selectors) {
    const postcodeSubmit = document.querySelector(selectors.postcodeSubmit);
    const deliveryStatus = document.querySelector(selectors.deliveryStatus);
    const unavailableClass = 'unavailable';

    if (deliveryStatus) {
      if (deliveryStatus.classList.contains(unavailableClass)) {
        throw new Error('Iceland does not deliver to this address');
      }
    } else {
      throw new Error(
        'Missing element - Cannot find deliveryStatus on page, please amend selector'
      );
    }

    if (postcodeSubmit) {
      postcodeSubmit.click();
    } else {
      throw new Error(
        'Missing element - Cannot find postcodeSubmit on page, please amend selector'
      );
    }
  }

  extractAvailableTimeSlots(selectors) {
    const availableSlotsObj = {};
    const noDatesAvailableText = 'No dates available';
    const slotDatesAvailability = document.querySelector(
      selectors.slotDatesAvailability
    );

    if (slotDatesAvailability.textContent.includes(noDatesAvailableText)) {
      throw new Error('No dates available');
    } else {
      const availableSlots = document.querySelectorAll(
        selectors.availableSlots
      );
      Array.from(availableSlots).forEach((slot) => {
        const date = slot
          .closest(selectors.slotDate)
          .getAttribute('data-slots-key');

        if (!availableSlotsObj[date]) {
          // Init the date prop
          availableSlotsObj[date] = [];
        }

        availableSlotsObj[date].push(
          slot.querySelector(selectors.slotTime).textContent
        );
      });
    }

    return availableSlotsObj;
  }

  // Transform function
  /**
   * @returns {object} - structured in accordance with sendMail function.
   * @param {object} availableSlotsObj - An object with slots arrays assigned to date keys. E.g. {20200512: [....]}
   */
  returnFormattedSlots(availableSlotsObj) {
    console.log(availableSlotsObj);
    // return {};
    const slotsObj = {
      url: this.entryUrl,
      merchant: this.merchant,
      addresses: [this.email],
      slots: [],
    };

    const dates = Object.keys(availableSlotsObj);

    dates.forEach((dateKey) => {
      availableSlotsObj[dateKey].forEach((timeSlot) => {
        const desiredPattern = 'dddd, Do MMM';
        const parsePattern = 'YYYYMMDD HH:mm';
        const start = moment(timeSlot.split(' - ')[0], 'HH:mm').format('h:mma');
        const end = moment(timeSlot.split(' - ')[1], 'HH:mm').format('h:mma');
        const date = moment(`${dateKey} ${start}`, parsePattern);
        const formattedDate = date.format(desiredPattern);

        if (!date.isValid()) {
          throw new Error('Could not extract all data required to notify user');
        } else {
          slotsObj.slots.push({ date, formattedDate, start, end });
          this.availabilityVerified = true;
        }
      });
    });

    // K.N – Commenting this out unless we can get it to work properly. The sort isn't actually sorting by time, it seems to be jumbled.
    // I have not investigated this as commenting this out makes it work fine.The slots in availableSlotsObj are sorted chronlogically already.

    // if (this.availabilityVerified === true) {
    //   // Sort by time and date. Date is a moment object.
    //   slotsObj.slots = slotsObj.slots.sort(
    //     (a, b) => a.date.unix() - b.date.unix()
    //   );
    // }

    return slotsObj;
  }
}

module.exports = {
  IcelandRewrite,
};
