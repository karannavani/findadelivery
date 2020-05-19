const axios = require("axios");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json");
const sendEmail = require('./utils/send-email');
const db = admin
  .initializeApp(
    {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://checkout-app-uk.firebaseio.com",
    },
    "Asda Delivery"
  )
  .firestore();
// const db = admin.firestore();

class AsdaDelivery {
  constructor(postcode, email, docId) {
    this.postcode = postcode;
    this.email = email;
    this.docId = docId;
    this.availabilityVerified = false;
    this.checkAsda(postcode);
  }
  checkAsda(postcode) {
    console.log("running asda", postcode);
    axios
      .post("https://groceries.asda.com/api/v3/slot/view", {
        requestorigin: "gi",
        data: {
          service_info: {
            fulfillment_type: "DELIVERY",
            enable_express: false,
          },
          start_date: "2020-04-25T00:00:00+01:00",
          end_date: "2020-05-15T00:00:00+01:00",
          reserved_slot_id: "",
          service_address: {
            postcode,
          },
          customer_info: {
            account_id: "8774316050",
          },
          order_info: {
            order_id: "20027220446",
            restricted_item_types: [],
            volume: 0,
            weight: 0,
            sub_total_amount: 0,
            line_item_count: 0,
            total_quantity: 0,
          },
        },
      })
      .then((res) => {
        console.log(`statusCode: ${res.status_code}`);
        this.getSlots(res.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getSlots(data) {
    if (data.slot_days) {
      console.log("get slots called");
      data.slot_days.forEach((day) => {
        day.slots.forEach((slot) => {
          if (
            slot.slot_info.status !== "UNAVAILABLE" &&
            !this.availabilityVerified
          ) {
            console.log(slot.slot_info.status);
            const startTime = new Date(slot.slot_info.start_time);
            const endTime = new Date(slot.slot_info.end_time);
            this.availabilityVerified = true;

            const payload = {
              vendor: 'ASDA',
              details: {
                timeSlot: [startTime, endTime]
              }
            };
            this.sendEmail(payload).then(async () => {

            return db.doc(`jobs/${this.docId}`)
              .update({
                state: "Completed",
              })
              .then(() => {
                // TODO: Fix this logging.
                // there is a slot open on date:
                console.log("date", `${startTime.toDateString()}`);
                console.log(
                  "start time",
                  `${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0`
                );
                console.log(
                  "start time",
                  `${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0`
                );
              });
            })
          }
        });
      });
    }
  }
}

module.exports = {
  AsdaDelivery,
};
