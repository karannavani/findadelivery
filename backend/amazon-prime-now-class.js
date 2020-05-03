const cron = require("node-cron");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const sgMail = require("@sendgrid/mail");
const merchantId = "A3L2WCBX4NBSPG"; //needs to be checked and changed every time there is a new cart
// const merchantId = "A3L2WCBX4NBSPG"; // leaving this here since it always returns true and is useful for testing
const ref = "pn_sc_ptc_bwr";
const url = `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=${ref}`;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const msg = {
  to: process.env.PERSONAL_EMAIL,
  from: "checkoutapp@example.com",
  subject: "AMAZON PRIME DELIVERY SLOT AVAILABLE",
  text: `Go to checkout - ${url}`,
};

class AmazonPrimeNow {
  constructor(job, updateJob) {
    this.checkFalseAlarm = false;
    this.verificationArray = [];
    this.slotAvailabilityArray = [];
    this.verificationCron;
    this.availabilityVerified;
    this.job = job;
    this.updateJob = updateJob;
    this.checkAmazonPrimeNow();
  }

  checkAmazonPrimeNow = () => {
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
        const deliveryHeader = $(
          "#delivery-slot > div > div > div > div.a-section.a-spacing-none.pn-panel-heading-wrapper > div > h2"
        ).text();
        const deliverySlot = $("#delivery-slot-form > div > span").text();
        console.log(deliveryHeader);
        this.checkForAvailability(deliverySlot);
      })
      .catch(console.error);
  };

  checkForAvailability = (deliverySlot) => {
    deliverySlot.includes(
      "No delivery windows for today or tomorrow are currently available. New delivery windows are released throughout the day."
    )
      ? this.compareToPrevious(false)
      : this.compareToPrevious(true);
  };

  compareToPrevious = (boolean) => {
    if (this.checkFalseAlarm) {
      console.log("verifying to prev");
      this.verificationArray.push(boolean);
      this.verifyIfFalseAlarm();
    }
    if (this.slotAvailabilityArray[0] !== boolean) {
      this.slotAvailabilityArray.pop();
      this.slotAvailabilityArray.push(boolean);
      console.log("array is", this.slotAvailabilityArray);
      if (boolean) {
        this.runVerificationCron();
      }
    }
  };

  // starts a sub cron to check whether the slot is actually open for long enough to act on it or if it's just a 1 sec blip
  verifyIfFalseAlarm = () => {
    console.log("verification array looks like", this.verificationArray);
    if (this.verificationArray.length <= 5) {
      this.verificationArray.filter((availability) => {
        if (!availability) {
          this.checkFalseAlarm = false;
          this.verificationArray = [];
          console.log("stopping function");
          this.verificationCron.stop();
          return;
        } else if (availability && this.verificationArray.length === 4) {
          this.availabilityVerified = true;
          this.checkFalseAlarm = false;
          this.verificationArray = [];

          console.log("stopping function");
          this.verificationCron.stop();
          return;
        }
      });
      if (this.availabilityVerified) {
        console.log("sending email");
        this.sendEmail();
        this.updateJob(this.job.id, 'Completed');
      }
    }
  };

  runVerificationCron = () => {
    this.checkFalseAlarm = true;
    this.verificationCron = cron.schedule("* * * * * *",  () => {
      console.log("verification cron running");
      this.checkAmazonPrimeNow();
    });
  };

  sendEmail = () => {
    sgMail.send(msg);
  };
}

module.exports = {
  AmazonPrimeNow,
};
