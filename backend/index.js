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

const { AsdaDelivery } = require("./asda-delivery-class");

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
          console.log("state is active");
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
  if (!activeCrons[job.data().userId]) {
    switch (job.data().store) {
      case "ASDA":
        console.log(
          "running switch with",
          job.data().store,
          "for id",
          job.data().userId,
          "because active crons looks like",
          activeCrons
        );
        trackCronJob(job.data().userId);
        // return activeCrons[job.data().userId].asdaCron = new AsdaCron(job);
        break;
      // return asdaCron(job);
      case "Amazon":
        trackCronJob(job.data().userId);
        return amazonCron(job);
    }
  }
};

const trackCronJob = (id) => {
  if (!activeCrons[id]) {
    activeCrons[id] = {};
  }
};

const asdaCron = cron.schedule("*/20 * * * * *", () => {
  // get asda jobs from the database
  fetchAsda("ASDA")
  .then(snapshot => {
    snapshot.forEach(job => {
      console.log(job.data()) 
      activeCrons[job.data().userId].scan = new AsdaDelivery(job.data().postcode);
    })
  })
});

// asdaCron.start();

const fetchAsda = async (store) => {
  try {
    const snapshot = await db.collection("jobs")
      .where("store", "==", store)
      .where("state", "in", ['Scheduled', 'Active'])
      .get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }
    return snapshot;
  }
  catch (err) {
    console.log("Error getting documents", err);
  }
};

// class AsdaCron {
//   constructor(job) {
//     this.job = job;
//     this.instantiateCron(job);
//   }

//   instantiateCron(job) {
//     activeCrons[this.job.data().userId].asdaDelivery = new AsdaDelivery();

//     activeCrons[job.data().userId].asdaDelivery.cron = new CronJob(
//       "*/30 * * * * *",
//       function () {
//         console.log("running every 10s for", job.data().userId);
//         activeCrons[job.data().userId].asdaDelivery.checkAsda(
//           job.data().postcode
//         );
//       }
//     );

//     activeCrons[job.data().userId].asdaDelivery.cron.start();
//   }
// }
// const asdaCron = (job) => {
//   activeCrons[job.data().userId].asdaDelivery = new AsdaDelivery();

//   activeCrons[job.data().userId].asdaDelivery.cron = new CronJob(
//     "*/30 * * * * *",
//     function () {
//       console.log("running every 10s for", job.data().userId);
//       activeCrons[job.data().userId].asdaDelivery.checkAsda(
//         job.data().postcode
//       );
//     }
//   );
//   activeCrons[job.data().userId].asdaDelivery.cron.start();

// if (!activeCrons[job.data().userId].asdaDelivery) {
//   activeCrons[job.data().userId].asdaDelivery = new AsdaDelivery();
//   activeCrons[job.data().userId].asdaDelivery.cron = cron.schedule(
//     "*/10 * * * * *",
//     function () {
//       console.log("running every 10s for", job.data().userId);
//       activeCrons[job.data().userId].asdaDelivery.checkAsda(
//         job.data().postcode
//       );
//     }
//   );
// }
// activeCrons[job.data().userId].scannerCron = cron.schedule(
//   "*/20 * * * * *",
//   function () {
//     console.log("running every 10s for", job.data().userId);
//     checkAsda(job.data().postcode);
//     verifyAvailability(job, asdaAvailabilityStatus, asdaReset);
//   }
// );
// };

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

const verifyAvailability = (
  job,
  availabilityCheckingFunction,
  resetFunction
) => {
  if (availabilityCheckingFunction()) {
    console.log("already available");
    activeCrons[job.data().userId].scannerCron.stop();
    updateJob(job.id, "Completed");
    delete activeCrons[job.data().userId];
    resetFunction();
  }
};

app.listen(3124, () => {
  console.log("listening on port 3124");
});
