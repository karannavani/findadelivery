const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("../checkout-app-uk-firebase-adminsdk-2zjvs-54e313e107.json");
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

sgMail.setApiKey(functions.config().sendgrid.api_key);

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
            this.sendEmail(startTime, endTime).then(async () => {
            return db.doc(`jobs/${this.docId}`)
              .update({
                state: "Completed",
              })
              .then(() => {
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

  sendEmail(startTime, endTime) {
    const msg = {
      to: this.email,
      from: "noreply@findadelivery.com",
      subject: "ASDA DELIVERY SLOT AVAILABLE",
      text: `A delivery slot has become available for ${startTime.toDateString()}, ${startTime.getUTCHours()}:${startTime.getUTCMinutes()}0 - ${endTime.getUTCHours()}:${endTime.getUTCMinutes()}0
    
    Book your slot - https://groceries.asda.com/checkout/book-slot?tab=deliver&origin=/`,
    };

    console.log("sending email");
    return sgMail.send(msg);
  }
}

module.exports = {
  AsdaDelivery,
};
