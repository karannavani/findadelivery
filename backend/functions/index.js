const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { AsdaDelivery } = require('./supermarkets/asda-delivery');
const { IcelandDelivery } = require('./supermarkets/iceland-delivery');
const { SainsburysDelivery } = require('./supermarkets/sainsbury-delivery');
const { send } = require('./utils/email-service');

admin.initializeApp();
const db = admin.firestore();

const taskRunner = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('* * * * *')
  .onRun(async (context) => {
    checkPerformAt();
  });

const checkPerformAt = async () => {
  const now = admin.firestore.Timestamp.now();

  const query = await db
    .collection('jobs')
    .where('state', '==', 'Active')
    .where('performAt', '<=', now)
    .get();

  console.log('running checkingPerformAt every minute');

  if (query.empty) {
    console.log('no documents found');
    return;
  } else {
    query.docs.forEach((doc) => {
      console.log('doc to perform now is', doc);
      return db.doc(`jobs/${doc.id}`).update({ performAt: 'Now' });
    });
  }
};

const onJobScheduled = functions
  .runWith({ memory: '2GB' })
  .firestore.document('jobs/{docId}')
  .onCreate(async (snapshot, context) => {
    const job = [];
    if (snapshot.data().state === 'Scheduled') {
      console.log('scheduled found');
      const { worker, postcode } = snapshot.data();
      snapshot
        .data()
        .user.get()
        .then((user) => {
          console.log('inside the then block');
          const email = user.data().email;
          updatePerformAt(snapshot)
            .then(() => {
              job.push(workers[worker](postcode, email, snapshot.id));
            })
            .catch((error) =>
              console.log('updatePerformAt error from scheduled', error)
            );
        });
    }
    return Promise.all(job);
  });

const onJobActive = functions
  .runWith({ memory: '2GB' })
  .firestore.document('jobs/{docId}')
  .onUpdate(async (snapshot, context) => {
    const job = [];
    if (
      snapshot.after.data().state === 'Active' &&
      snapshot.after.data().performAt === 'Now'
    ) {
      const { worker, postcode } = snapshot.after.data();
      snapshot.after
        .data()
        .user.get()
        .then((user) => {
          const email = user.data().email;
          updatePerformAt(snapshot.after).then(() => {
            job.push(workers[worker](postcode, email, snapshot.after.id));
          });
        });
    }
    return Promise.all(job);
  });

const workers = {
  asdaDeliveryScan: async (postcode, email, docId) => {
    console.log('hit asda worker with', postcode, email, docId);
    new AsdaDelivery(postcode, email, docId);
  },
  icelandDeliveryScan: async (postcode, email, docId) => {
    console.log('hit iceland worker with', postcode, email, docId);
    new IcelandDelivery(postcode, email, docId);
  },
  sainsburysDeliveryScan: async (postcode, email, docId) => {
    console.log('hit sainsburys worker with', postcode, email, docId);
    new SainsburysDelivery(postcode, email, docId);
  },
};

const updatePerformAt = (snapshot) => {
  const now = admin.firestore.Timestamp.now().toDate();
  now.setTime(now.getTime() + 5 * 60 * 1000);
  const performAt = admin.firestore.Timestamp.fromDate(now);
  return db.doc(`jobs/${snapshot.id}`).update({ performAt, state: 'Active' });
};

module.exports = {
  taskRunner,
  checkPerformAt,
  AsdaDelivery,
  IcelandDelivery,
  SainsburysDelivery,
  onJobScheduled,
  onJobActive,
  updatePerformAt,
  send,
};
