const sgMail = require('@sendgrid/mail'); // Twilio SendGrid (https://github.com/sendgrid/sendgrid-nodejs)
const format = require('date-fns/format');
const util = require('util');

const insertMerchantId = (origContent, merchantId) => {
  // const merchantId = "A3L2WCBX4NBSPG"; // This always returns true and is useful for testing
  const url = `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=pn_sc_ptc_bwr`;
  const newContent = {
    subject: origContent.subject,
    body: origContent.body[1] + ' ' + url
  };

  return newContent;
};

const insertTimeSlot = (origContent, timeSlot) => {
  // This whole thing could be much more sophisticated and robust but it
  // should do for now, though it will modify the current email format slightly.

  let invalidFormat = false;
  timeSlot.forEach((e) => {
    if (Object.prototype.toString.call(e) !== '[object Date]') {
      invalidFormat = true;
    };
  });

  if (invalidFormat) throw { statusCode: 400, message: "Invalid timeSlot" };

  const slotDate = `${format(timeSlot[0], 'PPPP')}`;
  const startTime = `${format(timeSlot[0], 'kk:mm')}`;
  const endTime = `${format(timeSlot[1], 'kk:mm')}`;
  
  const contentToInsert = `on ${slotDate} at ${startTime}-${endTime}. `;
  const newContent = {
    subject: origContent.subject,
    body: origContent.body[1] + contentToInsert + origContent.body[2]
  };
  
  return newContent;
};

const insertDetails = (origContent, details) => {
  // I'm sure there's a better way to do this but we can properly optimise
  // later. One problem with this approach is that each option is mutually
  // exclusive (which may not be a huge problem).
  if (details.timeSlot) return insertTimeSlot(origContent, details.timeSlot); // For Asda
  if (details.merchantId) return insertMerchantId(origContent, details.merchantId); // For Amazon Prime
};

const constructMessage = (vendor, details) => {
  // This will probably become far more complex when you/we start dispatching
  // high-quality HTML emails but for now only exists to return the relevant
  // text for each vendor.

  const contentMappings = require('../data/email-text.json');
  const vendors = Object.keys(contentMappings);
  if (!vendor || !vendors.includes(vendor)) throw { statusCode: 400, message: 'No valid vendor found.' };

  // TODO: We should probably check if details is an empty object here...
  return (details ? insertDetails(contentMappings[vendor], details) : contentMappings[vendor]);
};

const sendEmail = async ({ vendor, details, addresses = [] }) => {
  try {
    // Let's quit immediately if we can't find an API key
    if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    else throw { statusCode: 400, message: 'No API key found.' };

    const primaryAddress = process.env.PERSONAL_EMAIL;
    const sender = 'checkoutapp@example.com'; 
    const subject = "Find a Delivery - We've found a slot!";

    if (primaryAddress) addresses.push(primaryAddress);
    if (!addresses || !primaryAddress && addresses.length === 0) throw { statusCode: 400, message: 'No addresses(s) found.' };

    const text = constructMessage(vendor, details);
    const message = {
      to: addresses,
      from: sender,
      subject: text.subject,
      text: text.body
    };

    await sgMail.send(message);
    return { statusCode: 200 };
  } catch (error) {
    // TODO: Find a way of handling unexpected errors.
    // TODO: We should have a logger that we can toggle on/off for debugging.
    // console.log('Error is:', JSON.stringify(error.message));
    return error;
  }
};

module.exports = sendEmail;

// This is for (sub-optimal) testing.
// sendEmail({ vendor: 'AMAZON', details: { merchantId: 'A3L2WCBX4NBSPG' }});
