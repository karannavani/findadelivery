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
    "Sainsbury's Delivery"
  )
  .firestore();

sgMail.setApiKey(functions.config().sendgrid.api_key);

class SainsburysDelivery {
  constructor(postcode, email, docId) {
    this.merchant = "Sainsbury's";
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
    this.availabilityVerified = false;
    this.slots = {};
    this.entryUrl = 'https://www.sainsburys.co.uk/shop/gb/groceries';
    this.selectors = {
      // Page 1 - Groceries
      postcodeInput: '#checkPostCodePanel #postCode',
      postcodeSubmit: '#checkPostCodePanel .button',
      postcodeErrors: '.errorText, .errorMessage',

      // Page 2 - Postcode Success
      postcodeSuccessBody: 'body#postcodeCheckSuccess',
      shoppingOptions: '.panel.shoppingOption',
      shoppingOptionButton: '.button',

      // Page 3 - Delivery Slots
      slotPageBody: 'body#bookDeliverySlotPage',
      timeSlotCells: 'td .access',
    };

    this.checkSlots();
  }

  async checkSlots() {
    try {
      this.slots = await this.retrieveAvailableTimeSlots();

      if (this.availabilityVerified) {
        // Complete job and remove
        await db.doc(`jobs/${this.docId}`).update({ state: 'Completed' });
        send(this.slots);
        console.log(this.slots);
      } else {
        console.log('Not slots currently available');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async retrieveAvailableTimeSlots() {
    const { postcode, selectors, entryUrl } = this;

    const browser = await puppeteer.launch();

    try {
      const page = await browser.newPage();

      // Debug - Allows for console.log to work in evaluate function
      // page.on('console', (consoleObj) => console.log(consoleObj.text()));

      // Open page 1
      await page.goto(entryUrl, { waitUntil: 'networkidle2' });

      // Populates postcode field and submits to navigate to next page
      await page.evaluate(this.submitPostcode, postcode, selectors);

      // Page 2 loaded or invalid postcode
      await page.waitForSelector(
        `${selectors.postcodeSuccessBody}, ${selectors.postcodeErrors}`
      );

      // Identifies the "Choose a time slot" option and clicks to navigate to next page
      await page.evaluate(this.navigateToSlotPage, selectors);

      // Page 3 loaded
      await page.waitForSelector(selectors.slotPageBody);

      // Extract slots from html
      const availableSlotsArray = await page.evaluate(
        this.extractAvailableTimeSlots,
        selectors
      );

      const slots = this.returnFormattedSlots(availableSlotsArray);

      // Finish up
      browser.close();
      return slots;
    } catch (error) {
      browser.close();
      throw error;
    }
  }

  async submitPostcode(postcode, selectors) {
    const postcodeInput = document.querySelector(selectors.postcodeInput);
    const postcodeSubmit = document.querySelector(selectors.postcodeSubmit);
    if (postcodeInput) {
      postcodeInput.value = postcode;
    } else {
      throw new Error(
        'Missing element - Cannot find postcodeInput on page, please amend selector'
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

  async navigateToSlotPage(selectors) {
    const postcodeErrors = document.querySelectorAll(selectors.postcodeErrors);
    const shoppingOptions = document.querySelectorAll(
      selectors.shoppingOptions
    );
    const timeSlotButtonText = 'Choose a time slot';
    let timeSlotButton;

    if (postcodeErrors.length) {
      throw new Error('Invalid postcode');
    }

    if (shoppingOptions.length) {
      for (let i = 0; i < shoppingOptions.length; i++) {
        const currentButton = shoppingOptions[i].querySelector(
          selectors.shoppingOptionButton
        );

        if (currentButton) {
          const currentButtonText = currentButton.textContent.trim();
          if (currentButtonText === timeSlotButtonText) {
            timeSlotButton = currentButton;
            break;
          }
        }
      }
    } else {
      throw new Error(
        'Missing element - Cannot find shoppingOptions on page, please amend selector'
      );
    }

    if (timeSlotButton) {
      timeSlotButton.click();
    } else {
      throw new Error(
        'Missing element - Cannot find timeSlotButton on page, please amend selector'
      );
    }
  }

  async extractAvailableTimeSlots(selectors) {
    const slots = document.querySelectorAll(selectors.timeSlotCells);
    const availableSlotsArray = Array.from(slots)
      .map((slot) => {
        const slotWrapper = slot.parentElement;
        if (slotWrapper.tagName === 'A') {
          // It is a link to reserve a time slot
          // Could potentially email links to users - TODO
          const formatedSlotString = slotWrapper.textContent
            .replace(/\r?\n|\r/g, '')
            .replace('Book delivery for ', '')
            .trim();
          return formatedSlotString;
        } else {
          // No link, no slot... set to null to filter out
          return null;
        }
      })
      .filter((slotString) => {
        return slotString !== null;
      });

    // Consider formatting the slot information here - for now
    // the text content of the cells provides sufficient information

    return availableSlotsArray;
  }

  // Transform function
  /**
   * @returns {object} - structured in accordance with sendMail function.
   * @param {array} availableSlotsArray - Array of slot strings containing date, time and * price e.g. "Thursday 28 May 2020, between 6:30pm - 7:30pm, available for £2.50"
   */
  returnFormattedSlots(availableSlotsArray) {
    const slotsObj = {
      url: 'https://www.sainsburys.co.uk/gol-ui/CheckPostcode',
      merchant: this.merchant,
      addresses: [this.email],
      slots: [],
    };

    availableSlotsArray.forEach((slot) => {
      const desiredPattern = 'dddd, Do MMM';
      const parsePattern = 'dddd Do MMM YYYY h:mma';
      const slotSplit = slot.split(', ');
      const dateString = slotSplit[0];
      const timeSlot = slotSplit[1].replace('between ', '');
      const start = timeSlot.split(' - ')[0];
      const end = timeSlot.split(' - ')[1];
      // We sort by this.
      const date = moment(`${dateString} ${start}`, parsePattern);
      const formattedDate = date.format(desiredPattern);
      const price = slotSplit[2].replace('available for ', '');

      if (!dateString || !timeSlot || !price) {
        throw new Error('Could not extract all data required to notify user');
      } else {
        slotsObj.slots.push({ date, formattedDate, start, end, price });
        this.availabilityVerified = true;
      }
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
  SainsburysDelivery,
};

// Navigate to sainsburys
// Enter postcode
// Click delivery
// - also include click and collect?
// Scrape available time slots
// May also send reserve timeslot link for each slot. Email must be in html otherwise can get very busy.

// Requirements
// Must allow cookies. Site doesn't work without.
// Must clear cookies every search if using the same instance of Chrome.
