const axios = require('axios');
const functions = require('firebase-functions');

const sendInvite = async (inviteCode, address) => {
  try {
    console.log('sending invite...');
    const url = 'https://findadelivery.com/register;inviteCode=';

    const dynamicTemplateData = {
      'btn-link': url,
      inviteCode,
    };

    const personalization = {
      to: [{ email: address }],
      dynamic_template_data: dynamicTemplateData,
    };

    const sgPayload = {
      from: { email: 'invites@findadelivery.com' },
      template_id: 'd-cadb5d76ee1f430e94150020f95c201b',
      personalizations: [personalization],
    };

    await axios({
      method: 'post',
      url: 'https://api.sendgrid.com/v3/mail/send',
      data: JSON.stringify(sgPayload),
      headers: {
        Authorization: `Bearer ${functions.config().sendgrid.api_key}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.log('error is', error);
  }
};

module.exports = { sendInvite };
