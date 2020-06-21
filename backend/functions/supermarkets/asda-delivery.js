const axios = require('axios');
const moment = require('moment');
const sgMail = require('@sendgrid/mail');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require('../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json');
const { send } = require('../utils/email-service');

const db = admin
  .initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://checkout-app-uk.firebaseio.com',
    },
    'Asda Delivery'
  )
  .firestore();

sgMail.setApiKey(functions.config().sendgrid.api_key);

class AsdaDelivery {
  constructor(postcode, email, docId, res) {
    this.merchant = 'Asda';
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
    this.res = res;
    this.availabilityVerified = false;
    this.checkAsda();
  }

  async checkAsda() {
    console.log('running asda', this.postcode);
    const start_date = new Date();
    let end_date = new Date(start_date);
    // setting end date to be one month from the current date
    end_date.setMonth(start_date.getMonth() + 1);
    // adding the ASDA request headers
    const requestorigin = 'gi';
    const data = {
      service_info: {
        fulfillment_type: 'DELIVERY',
        enable_express: false,
      },
      start_date,
      end_date,
      reserved_slot_id: '',
      service_address: {
        postcode: this.postcode,
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
      const res = await axios.post(
        'https://groceries.asda.com/api/v3/slot/view',
        {
          requestorigin,
          data,
        }
      );
      const slotData = res.data.data;
      this.getSlots(slotData);
    } catch (error) {
      console.log({ error });
    }
  }

  async getSlots({ slot_days }) {
    const availableSlotsArray = [];
    // If there are no slot days, do nothing.
    if (!slot_days) return;

    // Otherwise...
    await slot_days.forEach((day) =>
      day.slots.forEach(async (slot) => {
        if (slot.slot_info.status !== 'UNAVAILABLE') {
          const start = new Date(slot.slot_info.start_time);
          const end = new Date(slot.slot_info.end_time);
          const price = slot.slot_info.final_slot_price;
          availableSlotsArray.push({ start, end, price });
        }
      })
    );
    if (availableSlotsArray.length) {
      this.returnFormattedSlots(availableSlotsArray);
      this.availabilityVerified = true;
    }
  }

  async returnFormattedSlots(availableSlotsArray) {
    const slotsObj = {
      url: 'https://groceries.asda.com/checkout/book-slot?tab=deliver&origin=/',
      merchant: this.merchant,
      addresses: [this.email],
      slots: [],
    };

    await availableSlotsArray.forEach((slot) => {
      const desiredPattern = 'dddd, Do MMM';
      const slotTimePattern = 'h:mm a';
      const start = moment(slot.start).format(slotTimePattern).replace(' ', '');
      const end = moment(slot.end).format(slotTimePattern).replace(' ', '');
      const formattedDate = moment(slot.start).format(desiredPattern);
      const price = `£${slot.price}`;

      if (!start || !end || !formattedDate) {
        throw new Error('Could not extract all data required to notify user');
      } else {
        slotsObj.slots.push({ formattedDate, start, end, price });
      }
    });

    return this.completeSearch(slotsObj);
  }

  async completeSearch(slots) {
    if (this.availabilityVerified) {
      await send(slots);
      await db.doc(`jobs/${this.docId}`).update({ state: 'Completed' });
      console.log('slots are', slots);
    } else {
      console.log('No slots currently available');
    }
    return this.res.status(200).end();
  }
}

module.exports = {
  AsdaDelivery,
};
