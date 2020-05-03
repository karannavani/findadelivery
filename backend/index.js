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
const { AmazonPrimeNow } = require("./amazon-prime-now-class");
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

const updateJob = (id, state) => {
  db.doc(`jobs/${id}`).update({ state });
};

// const asdaCron = cron.schedule("*/20 * * * * *", () => {
//   // get asda jobs from the database
//   getJobs("ASDA").then((snapshot) => {
//     snapshot.forEach((job) => {
//       console.log(job.data());
//       new AsdaDelivery(job.data().postcode);
//     });
//   });
// });

let observer = db
  .collection("jobs")
  // .where("store", "==", "ASDA")
  .where("state", "in", ["Scheduled", "Active"])
  .onSnapshot((querySnapshot) => {
    querySnapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "added") {
        console.log("New entry: ", change.doc.data());
        trackCronJob(change.doc);
        return new RunCron(change.doc.data().postcode);
      }
    });
  });

console.log(observer);

class RunCron {
  constructor(postcode) {
    this.scheduleCron(postcode);
  }
  scheduleCron(postcode) {
    const random = Math.floor(Math.random() * (3 - 1) + 1);
    console.log("number is", random);
    const x = cron.schedule(`${random} */1 * * * *`, () => {
      new AsdaDelivery(postcode);
    });
    x.start();
  }
}


const getJobs = async (store) => {
  try {
    const snapshot = await db
      .collection("jobs")
      .where("store", "==", store)
      .where("state", "in", ["Scheduled", "Active"])
      .get();
    if (snapshot.empty) {
      console.log("No matching documents.");
      return;
    }
    return snapshot;
  } catch (err) {
    console.log("Error getting documents", err);
  }
};

const trackCronJob = (job) => {
  if (!activeCrons[job.data().userId]) {
    updateJob(job.id, "Active");
    activeCrons[job.data().userId] = {};
  }
};

// const amazonCron = cron.schedule("*/5 * * * * *", () => {
//   // get amazon jobs from the database
//   getJobs("Amazon").then((snapshot) => {
//     if (snapshot) {
//       snapshot.forEach((job) => {
//         if (!activeCrons[job.data().userId]) {
//           trackCronJob(job);
//           console.log(job.data());
//           new AmazonPrimeNow(job, updateJob);
//         }
//       });
//     }
//   });
// });

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
