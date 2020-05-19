// Set-up Twilio SendGrid (https://github.com/sendgrid/sendgrid-nodejs)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const insertDynamicContent = (origContent, timeSlot) => {
  // This whole thing could be much more sophisticated and robust but it
  // should do for now, though it will modify the current email format slightly.

  // TODO: This could be extracted into a separate function(?)
  const slotDate = timeSlot[0].toDateString();
  const startTime = `${timeSlot[0].getUTCHours()}:${timeSlot[0].getUTCMinutes()}`;
  const endTime = `${timeSlot[1].getUTCHours()}:${timeSlot[1].getUTCMinutes()}`;

  console.log('origContent is:', origContent);
  console.log('timeSlot is:', timeSlot);
  
  const contentToInsert = `on ${slotDate} at ${startTime}-${endTime}. `;
  const newContent = {
    subject: origContent.subject,
    body: origContent.body[1] + contentToInsert + origContent.body[2]
  };

  console.log('newContent is:', newContent);
  
  return true; // TODO: Delete line
  return newContent;
};

const constructMessage = (vendor, timeSlot) => {
  // This will probably become far more complex when you/we start dispatching
  // high-quality HTML emails but for now only exists to return the relevant
  // text for each vendor.

  const contentMappings = require('../data/email-text.json');
  const vendors = Object.keys(contentMappings);
  if (!vendor || !vendors.includes(vendor)) return false;

  return (timeSlot ? insertDynamicContent(contentMappings[vendor], details) : contentMappings[vendor]);
};

const sendEmail = (vendor, addresses = [], timeSlot) => {
  const primaryAddress = process.env.PERSONAL_EMAIL;
  const sender = 'checkoutapp@example.com'; 
  const subject = "Find a Delivery - We've found a slot!";

  if (primaryAddress) addresses.push(primaryAddress);
  if (!addresses || !primaryAddress && addresses.length === 0) return { statusCode: 400, message: 'No addresses(s) found.' };

  const text = constructMessage(vendor);
  if (!text) return { statusCode: 400, message: 'No valid vendor found.' };

  return { statusCode: 200 };
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
