const puppeteer = require('puppeteer');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json');
const { send } = require('../utils/email-service');
const db = admin
  .initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://checkout-app-uk.firebaseio.com',
    },
    'Iceland Delivery'
  )
  .firestore();

sgMail.setApiKey(functions.config().sendgrid.api_key);

class IcelandDelivery {
  constructor(postcode, email, docId) {
    this.merchant = 'Iceland';
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
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
        // Complete job and remove
        // await db.doc(`jobs/${this.docId}`).update({ state: 'Completed' });
        send(this.slots);
        // sendEmail(this.slots);
        console.log(this.slots);
      } else {
        console.log('Not slots currently available');
      }
    } catch (error) {
      console.log(error);
      // TODO: Need to check which error and handle front end accordingly
    }
  }

  async retrieveAvailableTimeSlots() {
    console.log('firing');
    const { postcode, selectors, entryUrl } = this;
    const browser = await puppeteer.launch();

    try {
      const page = await browser.newPage();

      // Debug - Allows for console.log to work in evaluate function
      // page.on('console', (consoleObj) => console.log(consoleObj.text()));

      // Open deliver slots page
      await page.goto(entryUrl, { waitUntil: 'networkidle2' });

      // Populates postcode field
      await page.evaluate(this.enterPostcode, postcode, selectors);

      // Waits for delivery status to render
      await page.waitForSelector(selectors.deliveryStatus);

      // Submits the postcode field providing it's valid
      await page.evaluate(this.submitPostcode, selectors);

      // // Step 2 loaded
      await page.waitForNavigation({ waitUntil: 'networkidle2' });

      // Extracts available slots from page
      const availableSlotsObj = await page.evaluate(
        this.extractAvailableTimeSlots,
        selectors
      );

      const slots = this.returnFormattedSlots(availableSlotsObj);

      // Finish up
      browser.close();
      return slots;
    } catch (error) {
      browser.close();
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

    if (this.availabilityVerified === true) {
      // Sort by time and date. Date is a moment object.
      slotsObj.slots = slotsObj.slots.sort(
        (a, b) => a.date.unix() - b.date.unix()
      );
    }

    return slotsObj;
  }
}

module.exports = {
  IcelandDelivery,
};

// Navigate to sainsburys
// Enter postcode
// Check delivery
// Scrape available time slots
