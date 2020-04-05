const axios = require("axios");
const cheerio = require("cheerio");

const merchantId = "A2SQ1LUW1J67MC"; //needs to be checked and changed every time there is a new cart
const ref = "pn_sc_ptc_bwr";
const url =
  `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=${ref}`;


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
    const deliverySlot = $("#delivery-slot-form > div > span").text();
    console.log(
      !deliverySlot.includes(
        "No delivery windows for today or tomorrow are currently available. New delivery windows are released throughout the day."
      )
    );
  })
  .catch(console.error);
}

module.exports = {
  checkAmazonPrimeNow
};