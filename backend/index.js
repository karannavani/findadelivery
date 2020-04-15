const cron = require("node-cron");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
// const { checkAmazonPrimeNow } = require("./amazon-prime-now");

const app = express();

const ads = [{ title: "Hello, world (again)!" }];

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

// defining an endpoint to return all ads
app.get("/", (req, res) => {
  res.send(ads);
  console.log("sup1");

  cron.schedule("* * * * * *", () => {
    console.log('sup');
  })
});

// // schedule tasks to be run on the server
// cron.schedule("* * * * * *", function() {
//   // const item = fetchQueue();
//   createCron(fetchQueue());
// });


// const fetchQueue = () => {
// // fetching what's in the queue
// return {
//   id: 123,
//   email: "kknavani@gmail.com",
//   grocery: "Amazon"
// }
// }

// const createCron = (item) => {
// item.cron = cron.schedule("*/3 * * * * *", function() {
//   console.log('hello');
// })
// }

app.listen(3124, () => {
  console.log("listening on port 3124");
});