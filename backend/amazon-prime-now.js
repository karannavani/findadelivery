const cron = require("node-cron");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sendEmail = require('./utils/send-email');

const merchantId = "A3L2WCBX4NBSPG"; //needs to be checked and changed every time there is a new cart

app = express();

const slotAvailabilityArray = [];
let verificationArray = [];
let deliverySlot;
let checkFalseAlarm = false;
let verificationCron;
let availabilityVerified;

const checkAmazonPrimeNow = () => {
  console.log("function running");
  axios({
    method: "get",
    url: url,
    headers: {
      Cookie: process.env.AMAZON_PRIME_NOW_COOKIE,
    },
  })
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      deliveryHeader = $(
        "#delivery-slot > div > div > div > div.a-section.a-spacing-none.pn-panel-heading-wrapper > div > h2"
      ).text();
      deliverySlot = $("#delivery-slot-form > div > span").text();
      console.log(deliveryHeader);
      checkForAvailability(deliverySlot);
    })
    .catch(console.error);
};

const checkForAvailability = (deliverySlot) => {
  deliverySlot.includes(
    "No delivery windows for today or tomorrow are currently available. New delivery windows are released throughout the day."
  )
    ? compareToPrevious(false)
    : compareToPrevious(true);
};

const compareToPrevious = (boolean) => {
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
const verifyIfFalseAlarm = async () => {
  console.log("verification array looks like", verificationArray);
  if (verificationArray.length <= 5) {
    verificationArray.filter((availability) => {
      if (!availability) {
        checkFalseAlarm = false;
        verificationArray = [];
        console.log("stopping function");
        verificationCron.stop();
        return;
      } else if (availability && verificationArray.length === 4) {
        availabilityVerified = true;
        checkFalseAlarm = false;
        verificationArray = [];

        console.log("stopping function");
        verificationCron.stop();
        return;
      }
    });
    if (availabilityVerified) {
      // TODO: We should create a logger for debugging.
      console.log("Sending email...");
      const payload = {
        vendor: 'AMAZON', // TODO: Make these constants in the future
        details: { merchantId }
      }; 
      await sendEmail(payload);
    }
  }
};

const runVerificationCron = () => {
  checkFalseAlarm = true;
  verificationCron = cron.schedule("* * * * * *", function () {
    console.log("starting from cron a");
    checkAmazonPrimeNow();
  });
};

const amazonAvailabilityStatus = () => {
  return availabilityVerified;
}

cron.schedule("*/10 * * * * *", () => {
  checkAmazonPrimeNow();
})


app.listen(3125);

module.exports = {
  checkAmazonPrimeNow,
  amazonAvailabilityStatus,
};
