const axios = require('axios');
const crypto = require('crypto');

const secret = 'uTKwN1N+ImSnSUPktYzj2R1ZDy0BeBXqFd4Z6bFWIwI='; // From user's env
const payload = {
  event: 'envelope-completed',
  data: {
    envelopeSummary: {
      envelopeId: 'test-envelope-id',
      status: 'completed'
    }
  }
};

const payloadString = JSON.stringify(payload);
const hmac = crypto.createHmac('sha256', secret);
hmac.update(payloadString);
const signature = hmac.digest('base64');

async function testWebhook() {
  try {
    console.log('Sending webhook request...');
    const response = await axios.post('http://localhost:4000/api/v1/webhooks/docusign', payload, {
      headers: {
        'x-docusign-signature-1': signature,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response:', response.status, response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testWebhook();
