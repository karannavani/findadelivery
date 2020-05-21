const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sainsburysUrl = 'https://www.sainsburys.co.uk/shop/gb/groceries';
const selectors = {
  // Page 1 - Groceries
  postcodeInput: '#checkPostCodePanel #postCode',
  postcodeSubmit: '#checkPostCodePanel .button',
  errorText: '.errorText',

  // Page 2 - Postcode Success
  postcodeSuccessBody: 'body#postcodeCheckSuccess',
  shoppingOptions: '.panel.shoppingOption',
  shoppingOptionButton: '.button',

  // Page 3 - Delivery Slots
  slotPageBody: 'body#bookDeliverySlotPage',
  timeSlotCells: 'td .access',
};

const retrieveAvailableTimeSlots = async (postcode) => {
  console.log('running sainsburys');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Debug - Allows for console.log to work in evaluate function
  // page.on('console', (consoleObj) => console.log(consoleObj.text()));

  /**
   * Open page 1
   */
  await page.goto(sainsburysUrl, { waitUntil: 'networkidle2' });

  /**
   * Populates postcode field and submits to navigate to next page
   */
  await page.evaluate(
    (postcode, selectors) => {
      const postcodeInput = document.querySelector(selectors.postcodeInput);
      const postcodeSubmit = document.querySelector(selectors.postcodeSubmit);
      if (postcodeInput) {
        postcodeInput.value = postcode;
      }

      if (postcodeSubmit) {
        postcodeSubmit.click();
        const error = document.querySelector(selectors.errorText);
        // if (error) {
        // Do something here
        // }
      }
    },
    postcode,
    selectors
  );

  /**
   * Page 2 loaded
   */
  await page.waitForSelector(selectors.postcodeSuccessBody);

  /**
   * Identifies the "Choose a time slot" option and clicks to navigate to next page
   */
  await page.evaluate((selectors) => {
    const shoppingOptions = document.querySelectorAll(
      selectors.shoppingOptions
    );
    const timeSlotButtonText = 'Choose a time slot';
    let timeSlotButton;
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
    }
    if (timeSlotButton) {
      timeSlotButton.click();
    } else {
      // No time slot button found - throw error here
    }
  }, selectors);

  /**
   * Page 3 loaded
   */
  await page.waitForSelector(selectors.slotPageBody);

  /**
   * Extract slots from html
   */
  const availableSlots = await page.evaluate((selectors) => {
    const slots = document.querySelectorAll(selectors.timeSlotCells);
    const filteredSlots = Array.from(slots)
      .map((slot) => {
        const slotWrapper = slot.parentElement;
        if (slotWrapper.tagName === 'A') {
          // It is a link to reserve a time slot
          // Could potentially email links to users
          const formatedSlotString = slotWrapper.textContent
            .replace(/\r?\n|\r/g, '')
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

    return filteredSlots;
  }, selectors);

  console.log(availableSlots, `Boom. Slots for ${postcode}`);
};

retrieveAvailableTimeSlots('MK45 1QS');
retrieveAvailableTimeSlots('W10 6SU');

// const sendEmail = (startTime, endTime) => {
//   const msg = {
//     to: process.env.PERSONAL_EMAIL,
//     from: 'findadelivery@example.com',
//     subject: 'ASDA DELIVERY SLOT AVAILABLE',
//     text: `A delivery slot has become available for ${startTime.toDateString()}, ${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0 - ${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0

//     Book your slot - https://groceries.asda.com/checkout/book-slot?tab=deliver&origin=/`,
//   };

//   console.log('sending email');
//   // sgMail.send(msg);
// };

module.exports = {
  retrieveAvailableTimeSlots,
};

// Navigate to sainsburys
// Enter postcode
// Click delivery
// - also include click and collect?
// Scrape available time slots

// Requirements
// Must allow cookies. Site doesn't work without.
// Must clear cookies every search if using the same instance of Chrome.
