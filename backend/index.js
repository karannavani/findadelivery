const cron = require("node-cron");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const admin = require("firebase-admin");
const serviceAccount = require("./checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json"); // this is generated from the Service accounts tab in Firebase, the file is hidden for security reasons
const {
  checkAmazonPrimeNow,
  availabilityStatus,
} = require("./amazon-prime-now");

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
      jobs.forEach((job) => {
        if (job.data().state === "Scheduled") {
          console.log(job.data().state === "Scheduled");
          startJob(job);
        }
      });
    })
    .catch((err) => {
      console.log("Error getting jobs", err);
    });
};

const updateJob = (id, state) => {
  db.doc(`jobs/${id}`)
    .update({ state })
    .then((item) => console.log("item is", item));
};
getJobs();

const startJob = (job) => {
  job.scannerCron = cron.schedule("*/5 * * * * *", function () {
    console.log("running every 5s for", job.data().userId);
    updateJob(job.id, "Active");
    checkAmazonPrimeNow();

    console.log("availabilityVerified is", availabilityStatus());
    if (availabilityStatus()) {
      console.log("stopping from index");
      job.scannerCron.stop();
      updateJob(job.id, 'Completed');
    }
  });

  // mock implementation of marking status active in firebase
};

app.listen(3124, () => {
  console.log("listening on port 3124");
});
