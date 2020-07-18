const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const { AsdaDelivery } = require('./supermarkets/asda-delivery');
const { SainsburysDelivery } = require('./supermarkets/sainsbury-delivery');
const { send } = require('./utils/email-service');
const { IcelandDelivery } = require('./supermarkets/iceland-delivery');
const { firestore } = require('firebase-admin');
const { sendInvite } = require('./utils/invite-sender');

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
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .firestore.document('jobs/{docId}')
  .onCreate(async (snapshot, context) => {
    try {
      if (snapshot.data().state === 'Scheduled') {
        const { worker, postcode } = snapshot.data();
        const user = await snapshot.data().user.get();
        const email = user.data().email;

        await updatePerformAt(snapshot);
        return workers[worker](postcode, email, snapshot.id);
      }
    } catch (error) {
      console.log('error on job active', error);
      return;
    }
  });

const onJobActive = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .firestore.document('jobs/{docId}')
  .onUpdate(async (snapshot, context) => {
    try {
      if (
        snapshot.after.data().state === 'Active' &&
        snapshot.after.data().performAt === 'Now'
      ) {
        const { worker, postcode } = snapshot.after.data();
        const user = await snapshot.after.data().user.get();
        const email = user.data().email;

        await updatePerformAt(snapshot.after);
        return workers[worker](postcode, email, snapshot.after.id);
      }
    } catch (error) {
      console.log('error on job active', error);
      return;
    }
  });

const checkAsda = functions
  .region('europe-west2')
  .runWith({
    memory: '2GB',
    timeoutSeconds: 300,
  })
  .https.onRequest(async (req, res) => {
    console.log('req is', req.body);
    const { postcode, email, docId } = req.body;
    new AsdaDelivery(postcode, email, docId, res);
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

const triggerGeneralInvite = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .firestore.document('generalSignups/{docId}')
  .onCreate(async (snapshot, context) => {
    try {
      const inviteId = await snapshot.data().invite.id;
      return db.doc(`invites/${inviteId}`).update({ sendInvite: true });
    } catch (error) {
      console.log('error on triggerGeneralInvite', error);
    }
  });

const triggerNhsInvite = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .firestore.document('nhsSignups/{docId}')
  .onCreate(async (snapshot, context) => {
    try {
      const inviteId = await snapshot.data().invite.id;
      return db.doc(`invites/${inviteId}`).update({ sendInvite: true });
    } catch (error) {
      console.log('error on triggerNhsInvite', error);
    }
  });

const inviteSender = functions
  .region('europe-west2')
  .runWith({ memory: '2GB', timeoutSeconds: 300 })
  .firestore.document('invites/{docId}')
  .onWrite(async (snapshot, context) => {
    try {
      if (
        snapshot.after.data().sendInvite &&
        snapshot.after.data().sendInvite !== snapshot.before.data().sendInvite
      ) {
        await db
          .collection(snapshot.after.data().collection)
          .where('invite', '==', snapshot.after.ref)
          .get()
          .then((res) => {
            const inviteCode = snapshot.after.data().inviteCode;
            const email = res.docs[0].data().email;
            return sendInvite(inviteCode, email);
          });
      }
    } catch (error) {
      console.log('error on inviteSender', error);
    }
  });

/* Need to move these into utils */

const workers = {
  asdaDeliveryScan: async (postcode, email, docId) => {
    const url =
      'https://europe-west2-checkout-app-uk.cloudfunctions.net/checkAsda';

    // const url = 'http://localhost:5001/checkout-app-uk/europe-west2/checkAsda';

    console.log('hit asda worker with', postcode, email, docId);
    return await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ postcode, email, docId }),
    });
  },
  icelandDeliveryScan: async (postcode, email, docId) => {
    const url =
      'https://europe-west2-checkout-app-uk.cloudfunctions.net/checkIceland';

    // const url =
    //   'http://localhost:5001/checkout-app-uk/europe-west2/checkIceland';

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

    // const url =
    //   'http://localhost:5001/checkout-app-uk/europe-west2/checkSainsburys';

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

/*********************************************************/

module.exports = {
  taskRunner,
  checkPerformAt,
  AsdaDelivery,
  SainsburysDelivery,
  onJobScheduled,
  onJobActive,
  updatePerformAt,
  send,
  checkAsda,
  checkIceland,
  checkSainsburys,
  IcelandDelivery,
  sendInvite,
  inviteSender,
  triggerGeneralInvite,
  triggerNhsInvite,
};
