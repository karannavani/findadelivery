const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json');
const db = admin
  .initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://checkout-app-uk.firebaseio.com',
    },
    'Asda Delivery'
  )
  .firestore();
// const db = admin.firestore();

sgMail.setApiKey(functions.config().sendgrid.api_key);

class AsdaDelivery {
  constructor(postcode, email, docId) {
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
    this.availabilityVerified = false;
    this.checkAsda(postcode);
  }

  async checkAsda(postcode) {
    console.log('running asda', postcode);
    const requestorigin = 'gi'; //Whats this??
    const data = {
      service_info: {
        fulfillment_type: 'DELIVERY',
        enable_express: false,
      },
      //CB - What's this information here? Should it be hardcoded or dynamic?
      start_date: '2020-04-25T00:00:00+01:00',
      end_date: '2020-05-15T00:00:00+01:00',
      reserved_slot_id: '',
      service_address: {
        postcode,
      },
      customer_info: {
        account_id: '8774316050',
      },
      order_info: {
        order_id: '20027220446',
        restricted_item_types: [],
        volume: 0,
        weight: 0,
        sub_total_amount: 0,
        line_item_count: 0,
        total_quantity: 0,
      },
    };

    try {
      console.log('Making call...');
      const r = await axios.post(
        'https://groceries.asda.com/api/v3/slot/view',
        {
          requestorigin,
          data,
        }
      );
      // console.log({ status_code });
      const slotData = r.data.data;
      this.getSlots(slotData);
    } catch (error) {
      console.log({ error });
    }
  }

  async getSlots({slot_days}) {
    // If there are no slot days, do nothing.
    if (!slot_days) return;

    // Otherwise...
    // console.log('get slots called');
    slot_days.forEach(day =>
      day.slots.forEach(async slot => {
        if (
          slot.slot_info.status !== 'UNAVAILABLE' &&
          !this.availabilityVerified
        ) {
          // console.log(slot.slot_info.status);
          const startTime = new Date(slot.slot_info.start_time);
          const endTime = new Date(slot.slot_info.end_time);
          this.availabilityVerified = true;

          // So this sends an email for every available slot?? Or shouldn't we collate all the available time slots into one email?
          await this.sendEmail(startTime, endTime);

          // Update doc with new state
          await db
            .doc(`jobs/${this.docId}`)
            .update({ state: 'Completed' })

          // there is a slot open on date:
          // const date = `${startTime.toDateString()}`;
          // const startTimeFormatted = `${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0`;
          // const endTimeFormatted = `${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0`;
          // console.log({ date, startTimeFormatted, endTimeFormatted });

        }
      })
    );
  }



  async sendEmail(startTime, endTime) {
    const msg = {
      to: this.email,
      from: 'noreply@findadelivery.com',
      subject: 'ASDA DELIVERY SLOT AVAILABLE',
      text: `A delivery slot has become available for ${startTime.toDateString()}, ${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0 - ${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0

    Book your slot - https://groceries.asda.com/checkout/book-slot?tab=deliver&origin=/`,
    };
    // console.log('sending email');
    await sgMail.send(msg);

    return
  }
}

module.exports = {
  AsdaDelivery,
};

const testRun = new AsdaDelivery();
testRun.checkAsda('SE11AP');
