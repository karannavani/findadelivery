// Set-up Twilio SendGrid (https://github.com/sendgrid/sendgrid-nodejs)
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const constructMessage = (vendor) => {
  // This will probably become far more complex when you/we start dispatching
  // high-quality HTML emails but for now only exists to return the relevant
  // text for each vendor.

  switch(vendor) {
    case 'ASDA':
      return ('This is Asda');

    case 'AMAZON':
      return('This is Amazon');

    default:
      return false;
  }
};

const sendEmail = (vendor, recipients = []) => {
  const sender = 'checkoutapp@example.com'; 
  const subject = "Find a Delivery - We've found a slot!";
  const recipient = process.env.PERSONAL_EMAIL;

  if (recipient) recipients.push(recipient);
  if (!recipient && recipients.length === 0) return { statusCode: 400, message: 'No recipient(s) found.' };

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
