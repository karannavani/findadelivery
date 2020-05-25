require('dotenv').config(); // For testing
const axios = require('axios');
const format = require('date-fns/format');
const util = require('util');
const supermarkets = require('./supermarkets');

const formatSlotData = (slots, maxSlotsAllowed) => {
  const formattedSlots = [];

  for (let i = 0; i < maxSlotsAllowed; i++) {
    const formattedSlotObj = {};

    formattedSlotObj.formattedDate = format(slots[i].start, 'EEEE, do LLLL');
    formattedSlotObj.startTime = format(slots[i].start, 'k:mm');
    formattedSlotObj.endTime = format(slots[i].end, 'k:mm');
    formattedSlotObj.price = slots[i].price;

    formattedSlots.push(formattedSlotObj);
  }

  return formattedSlots;
}

const buildSgPayload = (merchant, addresses, slots) => {
  const maxSlotsAllowed = slots.length > 5 ? 5 : slots.length;
  const to = addresses.map((address) => ({ email: address }));
  const dynamic_template_data = {
    'btn-link': slots[0].url,
    more: slots.length > maxSlotsAllowed ? true : false,
    merchant: supermarkets[merchant],
    slots: formatSlotData(slots, maxSlotsAllowed)
  };

  const payload = {
    from: { email: 'noreply@findadelivery.com' },
    template_id:'d-ae627fe97d3c43209c1608fb43dfe7f0',
    personalizations: [{ to, dynamic_template_data }]
  };

  return payload;
};

const defineAddresses = (addresses) => {
  console.log('Looking for addresses...');

  const primaryAddress = process.env.PERSONAL_EMAIL;

  if (!primaryAddress && !addresses) throw { statusCode: 400, message: 'No recipient(s) found.' };
  if (!primaryAddress) {
    return addresses;
  } else if (!addresses) {
    return [primaryAddress];
  } else {
    return [primaryAddress, ...addresses];
  }
};

const sendEmail = async (data) => {
  const url = 'https://api.sendgrid.com/v3/mail/send';

  try {
    if (!data) throw { statusCode: 400, message: 'No data passed.' };
    // TODO: Let's quit immediately if we can't find a valid API key. It's fine for
    // now but is a good check to have in place.
    // if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // else throw { statusCode: 400, message: 'No API key found.' };

    console.log('Checking parameters are valid...');

    const requiredArgs = ['merchant', 'slots'];
    requiredArgs.forEach((arg) => {
      // TODO: Check a supported merchant has been submitted
      // TODO: Build logger for debugging/testing
      // console.log(`Checking data[${arg}] contains data...`);
      if (data[arg] === undefined || data[arg] === null) throw { statusCode: 400, message: 'Required argument missing: ' + arg }
    });

    const { merchant, slots } = data;

    console.log('Finished checking parameters.');
    const addresses = defineAddresses(data.addresses);
    console.log('Addresses found:', addresses);

    await axios({
      method: 'post',
      url: 'https://api.sendgrid.com/v3/mail/send',
      data: JSON.stringify(buildSgPayload(merchant, addresses, slots)),
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
    });

    console.log('Successfully called SendGrid.');
    return { statusCode: 200, message: 'Successfully called SendGrid.' };
  } catch (error) {
    console.log('Error is:', JSON.stringify(error.message));
    return error;
  }
};

module.exports = {
  send: sendEmail,
  build: buildSgPayload // TODO: Find a way to test this without exposing it.
}
