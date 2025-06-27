/**
 * Test the SMS Lead Detector
 * 
 * This script sends test SMS messages to the lead detector
 */

const axios = require('axios');

const SERVER_URL = 'http://localhost:3005/webhook/sms';

// Array of test messages with varying confidence levels
const TEST_MESSAGES = [
  // High confidence lead
  {
    id: `test-high-${Date.now()}`,
    content: 'From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates and availability?',
    timestamp: new Date().toISOString()
  },
  // Medium confidence lead
  {
    id: `test-med-${Date.now()}`,
    content: 'From: +15559876543 - Can you cook dinner next weekend?',
    timestamp: new Date().toISOString()
  },
  // Low confidence (not a lead)
  {
    id: `test-low-${Date.now()}`,
    content: 'From: +15553332222 - Hey, just checking in about that thing we discussed.',
    timestamp: new Date().toISOString()
  }
];

console.log('======================================');
console.log('SMS LEAD DETECTOR - TEST SCRIPT');
console.log('======================================');
console.log('Sending test messages to webhook endpoint...');

// Send each test message sequentially
async function sendTestMessages() {
  for (const message of TEST_MESSAGES) {
    try {
      console.log(`\nSending: "${message.content}"`);
      
      const response = await axios.post(SERVER_URL, message);
      
      console.log('Response:', response.data);
      
      if (response.data.leadDetected) {
        console.log(`✅ LEAD DETECTED! Score: ${response.data.score.toFixed(2)}, ID: ${response.data.id}`);
      } else {
        console.log(`❌ Not a lead. Score: ${response.data.score.toFixed(2)}, Reason: ${response.data.reason || 'Low confidence'}`);
      }
      
      // Wait 1 second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error sending message: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\nServer not running! Start it with:');
        console.log('node sms-lead-detector.cjs');
        process.exit(1);
      }
    }
  }
  
  console.log('\n======================================');
  console.log('All test messages sent!');
  console.log('View the dashboard at: http://localhost:3005/');
  console.log('======================================');
}

// Run tests
sendTestMessages();
