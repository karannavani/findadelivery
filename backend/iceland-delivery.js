require('dotenv').config();
const puppeteer = require('puppeteer');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const icelandUrl = 'https://www.iceland.co.uk/book-delivery';
const selectors = {
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

const emailAvailableSlots = async (postcode) => {
  console.log('running iceland');

  try {
    const availableSlotsObj = await retrieveAvailableTimeSlots(postcode);

    if (Object.keys(availableSlotsObj).length) {
      console.log(
        `
  *===========================*
   Slots found for ${postcode}
  *===========================*
      `,
        availableSlotsObj
      );
      // sendEmail(availableSlots);
    } else {
      console.log(`
      *==============================*
       No slots found for ${postcode}
      *==============================*
        `);
    }
  } catch (error) {
    console.log('Error - ', error.message);
  }
};

const retrieveAvailableTimeSlots = async (postcode) => {
  const browser = await puppeteer.launch();

  try {
    const page = await browser.newPage();

    // Debug - Allows for console.log to work in evaluate function
    // page.on('console', (consoleObj) => console.log(consoleObj.text()));

    // Open deliver slots page
    await page.goto(icelandUrl, { waitUntil: 'networkidle2' });

    // Populates postcode field
    await page.evaluate(enterPostcode, postcode, selectors);

    // Waits for delivery status to render
    await page.waitForSelector(selectors.deliveryStatus);

    // Submits the postcode field providing it's valid
    await page.evaluate(submitPostcode, selectors);

    // // Step 2 loaded
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // Extracts available slots from page
    const availableSlotsObj = await page.evaluate(
      extractAvailableTimeSlots,
      selectors
    );

    // Finish up
    browser.close();
    return availableSlotsObj;
  } catch (error) {
    browser.close();
    throw error;
  }
};

const enterPostcode = (postcode, selectors) => {
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
};

const submitPostcode = (selectors) => {
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
};

const extractAvailableTimeSlots = (selectors) => {
  const availableSlotsObj = {};
  const noDatesAvailableText = 'No dates available';
  const slotDatesAvailability = document.querySelector(
    selectors.slotDatesAvailability
  );

  if (slotDatesAvailability.textContent.includes(noDatesAvailableText)) {
    throw new Error('No dates available');
  } else {
    const availableSlots = document.querySelectorAll(selectors.availableSlots);
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

emailAvailableSlots('MK45 1Q');
emailAvailableSlots('W10 6SU');
emailAvailableSlots('MK451QS');

module.exports = {
  emailAvailableSlots,
};

// Navigate to sainsburys
// Enter postcode
// Check delivery
// Scrape available time slots
