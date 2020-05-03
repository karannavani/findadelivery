const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { AsdaDelivery } = require("./supermarkets/asda-delivery");

admin.initializeApp();
const db = admin.firestore();

const taskRunner = functions
  .runWith({ memory: "2GB" })
  .pubsub.schedule("* * * * *")
  .onRun(async (context) => {
    checkScheduled();
    checkPerformAt();
  });

const checkPerformAt = async () => {
  const now = admin.firestore.Timestamp.now();

  const query = await db
    .collection("jobs")
    .where("state", "==", "Active")
    .where("performAt", "<=", now)
    .get();

  console.log("running checkingPerformAt every minute");

  if (query.empty) {
    console.log("no documents found");
    return;
  } else {
    query.docs.forEach((doc) => {
      console.log("doc is", doc);
      return db.doc(`jobs/${doc.id}`).update({ performAt: now });
    });
  }
};

const checkScheduled = async () => {
  const jobs = [];
  const query = await db
    .collection("jobs")
    .where("state", "==", "Scheduled")
    .get();

  console.log("checking scheduled every minute");

  if (query.empty) {
    return;
  } else {
    query.docs.forEach((doc) => {
      console.log("scheduled doc is", doc.data());
      const { worker, postcode } = doc.data();
      const job = workers[worker](postcode);
      jobs.push(job);
      const now = admin.firestore.Timestamp.now().toDate();
      now.setTime(now.getTime() + 5 * 60 * 1000);
      let performAt = admin.firestore.Timestamp.fromDate(now);
      db.doc(`jobs/${doc.id}`).update({ performAt, state: "Active" });
    });
  }

  return await Promise.all(jobs);
};

const workers = {
  asdaDeliveryScan: (postcode) => {
    console.log("hit asda worker");
    new AsdaDelivery(postcode);
  },
};

module.exports = {
  taskRunner,
  checkPerformAt,
  checkScheduled,
  AsdaDelivery,
};
