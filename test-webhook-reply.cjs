/**
 * Discord Webhook Test
 * 
 * Tests the SMS lead detection system using webhook replies
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:3005/webhook/discord-sms';

// Simulated SMS message
const testMessage = {
  id: `test-${Date.now()}`,
  content: 'From: +15551234567 - Looking for a chef to cater a dinner party next Saturday for 8 people. What are your rates?',
  timestamp: new Date().toISOString()
};

console.log('==============================================');
console.log('TESTING DISCORD WEBHOOK REPLY');
console.log('==============================================');
console.log('Sending test SMS message to webhook endpoint:');
console.log(`"${testMessage.content}"`);

// Send the test message
axios.post(SERVER_URL, testMessage)
  .then(response => {
    console.log('\n✅ SUCCESS! Server processed the message');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.replied) {
      console.log('\n✅ Check your Discord channel - you should see the bot reply!');
    } else {
      console.log('\n❌ No reply was sent. Check the server logs for details.');
    }
    
    console.log('\nTest complete! If you see the bot reply in Discord, everything is working.');
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure the webhook server is running:');
      console.log('1. Start it with: node webhook-discord-monitor.cjs');
      console.log('2. Then run this test again');
    }
  });
