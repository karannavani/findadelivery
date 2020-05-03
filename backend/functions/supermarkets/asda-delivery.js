const axios = require("axios");
const sgMail = require("@sendgrid/mail");
const functions = require("firebase-functions");

sgMail.setApiKey(functions.config().sendgrid.api_key);

class AsdaDelivery {
  constructor(postcode) {
    this.postcode = postcode;
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
        // getSlots(res.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }
}

module.exports = {
  AsdaDelivery
}