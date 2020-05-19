const format = require('date-fns/format');
const util = require('util');
// Set-up Twilio SendGrid (https://github.com/sendgrid/sendgrid-nodejs)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const insertTimeSlot = (origContent, timeSlot) => {
  // This whole thing could be much more sophisticated and robust but it
  // should do for now, though it will modify the current email format slightly.

  let invalidFormat = false;
  timeSlot.forEach((e) => {
    if (Object.prototype.toString.call(e) !== '[object Date]') {
      invalidFormat = true;
    };
  });

  console.log('invalidFormat is:', invalidFormat);

  if (invalidFormat) throw { statusCode: 400, message: "Invalid timeSlot" };

  // TODO: This could be extracted into a separate function(?)
  const slotDate = `${format(timeSlot[0], 'PPPP')}`;
  const startTime = `${format(timeSlot[0], 'kk:mm')}`;
  const endTime = `${format(timeSlot[1], 'kk:mm')}`;

  console.log('origContent is:', origContent);
  
  const contentToInsert = `on ${slotDate} at ${startTime}-${endTime}. `;
  const newContent = {
    subject: origContent.subject,
    body: origContent.body[1] + contentToInsert + origContent.body[2]
  };
  
  return newContent;
};

const constructMessage = (vendor, timeSlot) => {
  // This will probably become far more complex when you/we start dispatching
  // high-quality HTML emails but for now only exists to return the relevant
  // text for each vendor.

  const contentMappings = require('../data/email-text.json');
  const vendors = Object.keys(contentMappings);
  if (!vendor || !vendors.includes(vendor)) throw { statusCode: 400, message: 'No valid vendor found.' };

  return (timeSlot ? insertTimeSlot(contentMappings[vendor], timeSlot) : contentMappings[vendor]);
};

const sendEmail = ({ vendor, timeSlot, addresses = [] }) => {
  try {

    const primaryAddress = process.env.PERSONAL_EMAIL;
    const sender = 'checkoutapp@example.com'; 
    const subject = "Find a Delivery - We've found a slot!";

    if (primaryAddress) addresses.push(primaryAddress);
    if (!addresses || !primaryAddress && addresses.length === 0) throw { statusCode: 400, message: 'No addresses(s) found.' };

    console.log('====> timeSlot is:', timeSlot);

    const text = constructMessage(vendor, timeSlot);
    console.log('text is:', text);

    return { statusCode: 200 };
  } catch (error) {
    // console.log('Error is:', JSON.stringify(error));
    return error;
  }
};

module.exports = sendEmail;


  //   ASDA
  // const sendEmail = (startTime, endTime) => {
  //   const msg = {
  //     to: process.env.PERSONAL_EMAIL,
  //     from: "findadelivery@example.com",
  //     subject: "ASDA DELIVERY SLOT AVAILABLE",
  //     text: `A delivery slot has become available for ${startTime.toDateString()}, ${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0 - ${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0

  //     Book your slot - https:groceries.asda.com/checkout/book-slot?tab=deliver&origin=/`,
  //   };

  //   console.log('sending email');
  //   // sgMail.send(msg);
  // };

  
  // AMAZON
  //
  // const msg = {
  //   to: process.env.PERSONAL_EMAIL,
  //   from: "checkoutapp@example.com",
  //   subject: "AMAZON PRIME DELIVERY SLOT AVAILABLE",
  //   text: `Go to checkout - ${url}`,
  // };
