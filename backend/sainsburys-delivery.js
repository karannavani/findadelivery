require('dotenv').config();
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

const emailAvailableSlots = async (postcode) => {
  const availableSlots = await retrieveAvailableTimeSlots(postcode);

  if (availableSlots.length) {
    console.log(
      `
*===========================*
 Slots found for ${postcode}
*===========================*
    `,
      availableSlots
    );

    if (availableSlots.length) {
      // sendEmail(availableSlots);
    }
  } else {
    console.log(`
*==============================*
 No slots found for ${postcode}
*==============================*
  `);
  }
};

const retrieveAvailableTimeSlots = async (postcode) => {
  console.log('running sainsburys');
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    // Debug - Allows for console.log to work in evaluate function
    // page.on('console', (consoleObj) => console.log(consoleObj.text()));

    // Open page 1
    await page.goto(sainsburysUrl, { waitUntil: 'networkidle2' });

    // Populates postcode field and submits to navigate to next page
    await page.evaluate(submitPostcode, postcode, selectors);

    // Page 2 loaded
    await page.waitForSelector(selectors.postcodeSuccessBody);

    // Identifies the "Choose a time slot" option and clicks to navigate to next page
    await page.evaluate(navigateToSlotPage, selectors);

    // Page 3 loaded
    await page.waitForSelector(selectors.slotPageBody);

    // Extract slots from html
    const availableSlots = await page.evaluate(
      extractAvailableTimeSlots,
      selectors
    );

    browser.close();
    return availableSlots;
  } catch (error) {
    // Handle Error
    console.log({ error });
    browser.close();
  }
};

const submitPostcode = (postcode, selectors) => {
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
};

const navigateToSlotPage = (selectors) => {
  const shoppingOptions = document.querySelectorAll(selectors.shoppingOptions);
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
};

const extractAvailableTimeSlots = (selectors) => {
  const slots = document.querySelectorAll(selectors.timeSlotCells);
  const filteredSlots = Array.from(slots)
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

  return filteredSlots;
};

const formatAvailableSlotsEmail = (availableSlots) => {
  let availableSlotsEmail;
  // Do something with slots to build html email in presentable way.
  return availableSlotsEmail;
};

const sendEmail = (slots) => {
  console.log(process.env.PERSONAL_EMAIL);
  const msg = {
    to: process.env.PERSONAL_EMAIL,
    from: 'findadelivery@example.com',
    subject: `Find a delivery - Sainsburys delivery slot${
      slots.length > 1 ? 's' : ''
    } available`,
    text: `Here are the available slots we've found for your postcode:

    ${slots.join('\n\n')}
  `,
  };
  console.log('sending email');
  sgMail.send(msg);
};

emailAvailableSlots('MK45 1QS');
emailAvailableSlots('W10 6SU');

module.exports = {
  emailAvailableSlots,
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
