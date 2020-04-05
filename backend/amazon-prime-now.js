const axios = require("axios");
const cheerio = require("cheerio");

const merchantId = "A3L2WCBX4NBSPG";
const ref = "pn_sc_ptc_bwr";
const url =
  `https://primenow.amazon.co.uk/checkout/enter-checkout?merchantId=${merchantId}&ref=${ref}`;


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
    console.log(deliverySlot);
  })
  .catch(console.error);
