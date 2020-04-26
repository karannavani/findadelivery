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
  amazonAvailabilityStatus,
} = require("./amazon-prime-now");
const { checkAsda, asdaAvailabilityStatus } = require("./asda-delivery");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://checkout-app-uk.firebaseio.com",
});
const db = admin.firestore();
const app = express();

const activeCrons = {};
// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

app.post("/api/trigger-job-check", (req, res) => {
  console.log("req is", req.body);
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
        if (
          job.data().state === "Scheduled" &&
          !activeCrons[job.data().userId]
        ) {
          startJob(job);
        } else if (
          job.data().state === "Active" &&
          !activeCrons[job.data().userId]
        ) {
          startJob(job);
        }
      });
    })
    .catch((err) => {
      console.log("Error getting jobs", err);
    });
};

const updateJob = (id, state) => {
  db.doc(`jobs/${id}`).update({ state });
};
getJobs();

const startJob = (job) => {
  updateJob(job.id, "Active");

  trackCronJob(job.data().userId);

  switch (job.data().store) {
    case "ASDA":
      console.log("running switch with", job.data().store);
      return asdaCron(job);
    case "Amazon":
      return amazonCron(job);
  }
};

const trackCronJob = (id) => {
  if (!activeCrons[id]) {
    activeCrons[id] = {};
  }
};

const asdaCron = (job) => {
    activeCrons[job.data().userId].scannerCron = cron.schedule(
      "*/5 * * * * *",
      function () {
        console.log("running every 5s for", job.data().userId);
        checkAsda(job.data().postcode);
        verifyAvailability(job, asdaAvailabilityStatus);
      }
    );
};

const amazonCron = (job) => {
  activeCrons[job.data().userId].scannerCron = cron.schedule(
    "*/5 * * * * *",
    function () {
      console.log("running every 5s for", job.data().userId);
      checkAmazonPrimeNow();
      verifyAvailability(job, amazonAvailabilityStatus);
    }
  );
};

const verifyAvailability = (job, availabilityCheckingFunction) => {
  if (availabilityCheckingFunction()) {
    console.log("already available");
    activeCrons[job.data().userId].scannerCron.stop();
    updateJob(job.id, "Completed");
    delete activeCrons[job.data().userId];
  }
};

app.listen(3124, () => {
  console.log("listening on port 3124");
});
