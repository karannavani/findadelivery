const cron = require("node-cron");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const admin = require("firebase-admin");
const serviceAccount = require("./checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json"); // this is generated from the Service accounts tab in Firebase, the file is hidden for security reasons
// const { checkAmazonPrimeNow } = require("./amazon-prime-now");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://checkout-app-uk.firebaseio.com",
});
const db = admin.firestore();
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

app.get("/api/trigger-job-check", (req, res) => {
    res.status(200).send({
      success: "true",
      message: "Checking the database",
    });
    getJobs();
});

const getJobs = () => {
  db.collection("jobs")
    .get()
    .then((jobs) => {
      jobs.forEach(job => {
        if (job.data().state === 'Scheduled') {
          console.log(job.data().state === "Scheduled");
          console.log('jobs that are scheduled', job.data())
        } 
        })
    })
    .catch((err) => {
      console.log("Error getting jobs", err);
    });
};

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
