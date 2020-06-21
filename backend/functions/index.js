const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { AsdaDelivery } = require('./supermarkets/asda-delivery');
const { SainsburysDelivery } = require('./supermarkets/sainsbury-delivery');
const { send } = require('./utils/email-service');
const { IcelandDelivery } = require('./supermarkets/iceland-delivery');

admin.initializeApp();
const db = admin.firestore();

const taskRunner = functions
  .region('europe-west2')
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
      return db.doc(`jobs/${doc.id}`).update({ performAt: 'Now' });
    });
  }
};

const onJobScheduled = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .firestore.document('jobs/{docId}')
  .onCreate(async (snapshot, context) => {
    const jobs = [];

    try {
      if (snapshot.data().state === 'Scheduled') {
        const { worker, postcode } = snapshot.data();
        const user = await snapshot.data().user.get();
        const email = user.data().email;

        await updatePerformAt(snapshot);
        jobs.push(workers[worker](postcode, email, snapshot.id));
      }
    } catch (error) {
      console.log('error on job active', error);
      return;
    }

    return await Promise.all(jobs);
  });

const onJobActive = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 540 })
  .firestore.document('jobs/{docId}')
  .onUpdate(async (snapshot, context) => {
    // const jobs = [];

    try {
      if (
        snapshot.after.data().state === 'Active' &&
        snapshot.after.data().performAt === 'Now'
      ) {
        const { worker, postcode } = snapshot.after.data();
        const user = await snapshot.after.data().user.get();
        const email = user.data().email;

        await updatePerformAt(snapshot.after);
        // jobs.push(workers[worker](postcode, email, snapshot.after.id));
        return workers[worker](postcode, email, snapshot.after.id);
      }
    } catch (error) {
      console.log('error on job active', error);
      return;
    }
    // return await Promise.all(jobs);
  });

const checkIceland = functions
  .region('europe-west2')
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
  })
  .https.onRequest(async (req, res) => {
    console.log('req is', req.body);
    const { postcode, email, docId } = req.body;
    new IcelandDelivery(postcode, email, docId, res);
  });

const checkSainsburys = functions
  .region('europe-west2')
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
  })
  .https.onRequest(async (req, res) => {
    console.log('req is', req.body);
    const { postcode, email, docId } = req.body;
    new SainsburysDelivery(postcode, email, docId, res);
  });

const workers = {
  asdaDeliveryScan: async (postcode, email, docId) => {
    console.log('hit asda worker with', postcode, email, docId);
    return new AsdaDelivery(postcode, email, docId);
  },
  icelandDeliveryScan: async (postcode, email, docId) => {
    const url =
      'https://europe-west2-checkout-app-uk.cloudfunctions.net/checkIceland';
    console.log('hit iceland worker with', postcode, email, docId);
    return await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcode, email, docId }),
    });
  },
  sainsburysDeliveryScan: async (postcode, email, docId) => {
    const url =
      'https://europe-west2-checkout-app-uk.cloudfunctions.net/checkSainsburys';

    console.log('hit sainsburys worker with', postcode, email, docId);
    return await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcode, email, docId }),
    });
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
  SainsburysDelivery,
  onJobScheduled,
  onJobActive,
  updatePerformAt,
  send,
  checkIceland,
  checkSainsburys,
  IcelandDelivery,
};
