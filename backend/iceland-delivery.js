require('dotenv').config();
const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const icelandUrl = 'https://www.iceland.co.uk/book-delivery';
const selectors = {
  // Step 1 - Groceries
  postcodeInput: '#postal-code',
  postcodeSubmit: 'form .check-postcode button',
  errorText: '#postal-code-error',
  deliveryAvailableStatus: 'form .delivery-status',

  // Step 2 - Slots found
  deliverySlotsLoaded: '.delivery-schedule-slots.active',
  deliverySlotsTabs: '.delivery-schedule-slots',
  availableDeliverySlots: '.delivery-schedule-slot:not(.unavailable)',
  slotTime: '.delivery-schedule-slot-range > div',
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
  const page = await browser.newPage();

  // Debug - Allows for console.log to work in evaluate function
  // page.on('console', (consoleObj) => console.log(consoleObj.text()));

  // Open deliver slots page
  await page.goto(icelandUrl, { waitUntil: 'networkidle2' });

  // Populates postcode field and submits to load slots
  await page.evaluate(submitPostcode, postcode, selectors);

  // Step 2 loaded
  await page.waitForSelector(selectors.deliverySlotsLoaded);

  // Identifies the "Choose a time slot" option and clicks to navigate to next page
  await page.evaluate(navigateToSlotPage, selectors);

  // Page 3 loaded
  await page.waitForSelector(selectors.slotPageBody);

  // Extract slots from html
  const availableSlots = await page.evaluate(
    extractAvailableTimeSlots,
    selectors
  );

  return availableSlots;
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
    const deliveryUnavailable = document.querySelector(
      selectors.deliveryAvailableStatus
    );
    if (error) {
      // Do something here
    } else if (deliveryUnavailable) {
      // Does not deliver to this postcode
      // Do something here
    }
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
// Check delivery
// Scrape available time slots
