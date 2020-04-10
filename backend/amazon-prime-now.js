const cron = require("node-cron");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sgMail = require("@sendgrid/mail");

const merchantId = "A2SQ1LUW1J67MC"; //needs to be checked and changed every time there is a new cart
const ref = "pn_sc_ptc_bwr";
const url = `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=${ref}`;

app = express();

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
const verificationArray = [];
let deliverySlot;
let checkFalseAlarm = false;
let verificationCron;

const checkAmazonPrimeNow = () => {
  console.log("function running");
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
  if (checkFalseAlarm) {
    console.log("verifying to prev");
    verificationArray.push(boolean);
    verifyIfFalseAlarm();
  }
  if (slotAvailabilityArray[0] !== boolean) {
    slotAvailabilityArray.pop();
    slotAvailabilityArray.push(boolean);
    console.log("array is", slotAvailabilityArray);
    if (boolean) {
      console.log(deliverySlot);
      runVerificationCron();
    }
  }
};

// starts a sub cron to check whether the slot is actually open for long enough to act on it or if it's just a 1 sec blip
const verifyIfFalseAlarm = () => {
  console.log("verification array looks like", verificationArray);
  let availabilityVerified;
  if (verificationArray.length <= 5) {
    verificationArray.filter(availability => {
      if (!availability) {
        checkFalseAlarm = false;
        console.log("stopping function");
        verificationCron.stop();
        return;
      } else if (availability && verificationArray.length === 4) {
        availabilityVerified = true;
        checkFalseAlarm = false;
        console.log("stopping function");
        verificationCron.stop();
        return;
      }
    });
    if (availabilityVerified) {
      console.log("sending email");
      sendEmail();
    }
  }
};

const runVerificationCron = () => {
  checkFalseAlarm = true;
  verificationCron = cron.schedule("* * * * * *", function() {
    console.log("starting from cron a");
    checkAmazonPrimeNow();
  });
};

// schedule tasks to be run on the server
cron.schedule("*/30 * * * * *", function() {
  checkAmazonPrimeNow();
});

app.listen(3125);

module.exports = {
  checkAmazonPrimeNow
};
