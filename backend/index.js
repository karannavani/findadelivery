const cron = require("node-cron");
const express = require("express");
const { checkAmazonPrimeNow } = require("./amazon-prime-now");

app = express();

// schedule tasks to be run on the server
cron.schedule("*/5 * * * * *", function() {
  checkAmazonPrimeNow();
});

app.listen(3128);
