/**
 * Discord SMS Monitor - Production Test
 * 
 * This script tests the Discord SMS monitor in production mode
 * with a real Discord bot token from your .env file.
 */

const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:3005/webhook/discord-sms';

// Sample test message (high-confidence lead)
const testMessage = {
  id: `test-${Date.now()}`,
  content: 'From: +15551234567 - Looking to hire a private chef for my anniversary dinner next weekend for 8 people. What are your rates and menu options?',
  timestamp: new Date().toISOString()
};

console.log('\n=========================================');
console.log('DISCORD SMS MONITOR - PRODUCTION TEST');
console.log('=========================================');
console.log('This script will test your Discord bot with a real token.');
console.log('Make sure the Discord SMS monitor is running separately.');
console.log('You should see a bot reply in your Discord channel.');
console.log('=========================================\n');

// Test functionality by sending a message to the webhook
async function sendTestMessage() {
  try {
    console.log('Sending test message to webhook endpoint...');
    console.log('Message content:', testMessage.content);
    console.log('=========================================\n');
    
    const response = await axios.post(WEBHOOK_URL, testMessage);
    
    console.log('Server response:', response.status, response.statusText);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log('\n=========================================');
    console.log('✅ Test message sent successfully!');
    console.log('If your Discord bot is properly configured, you should');
    console.log('see a reply in your Discord channel with a lead summary.');
    console.log('=========================================');
  } catch (error) {
    console.error('Error sending test message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.log('\n=========================================');
    console.log('❌ Test failed. Check server logs for details.');
    console.log('=========================================');
  }
}

// Run the test
sendTestMessage();
