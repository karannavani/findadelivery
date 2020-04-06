const axios = require("axios");
const cheerio = require("cheerio");
const sgMail = require("@sendgrid/mail");

const merchantId = "A2SQ1LUW1J67MC"; //needs to be checked and changed every time there is a new cart
const ref = "pn_sc_ptc_bwr";
const url = `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=${ref}`;

// using Twilio SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
  to: process.env.PERSONAL_EMAIL,
  from: "checkoutapp@example.com",
  subject: "AMAZON PRIME DELIVERY SLOT AVAILABLE",
  text: `Go to checkout - ${url}`
};

const slotAvailabilityArray = [];
let deliverySlot;

const checkAmazonPrimeNow = () => {
  axios({
    method: "get",
    url: url,
    headers: {
      Cookie: process.env.AMAZON_PRIME_NOW_COOKIE
    }
  })
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);
      deliverySlot = $("#delivery-slot-form > div > span").text();
      checkForAvailability(deliverySlot);
    })
    .catch(console.error);
};

const checkForAvailability = deliverySlot => {
  deliverySlot.includes(
    "No delivery windows for today or tomorrow are currently available. New delivery windows are released throughout the day."
  )
    ? compareToPrevious(false)
    : compareToPrevious(true);
};

const sendEmail = () => {
  sgMail.send(msg);
};

const compareToPrevious = boolean => {
  if (slotAvailabilityArray[0] !== boolean) {
    slotAvailabilityArray.pop();
    slotAvailabilityArray.push(boolean);
    console.log("array is", slotAvailabilityArray);

    if (boolean) {
      console.log("sending email");
      console.log(deliverySlot);
      // sendEmail();
    }
  }
};

module.exports = {
  checkAmazonPrimeNow
};
