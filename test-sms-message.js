/**
 * Test Script for Discord SMS Monitor
 * 
 * This script simulates incoming SMS messages by sending test payloads
 * to the Discord SMS webhook endpoint.
 */

const axios = require('axios');

// Test server configuration
const SERVER_PORT = 3005;
const WEBHOOK_URL = `http://localhost:${SERVER_PORT}/webhook/discord-sms`;

// Test message payloads ranging from low to high confidence
const testMessages = [
  {
    id: 'test-msg-1',
    content: 'Hey, do you offer private chef services? I would like to book for a dinner party next weekend.',
    author: { username: 'TestUser1', id: '12345' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'test-msg-2',
    content: 'From: John Smith - Looking for a chef to cook for our anniversary dinner, what are your rates?',
    author: { username: 'TestUser2', id: '23456' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'test-msg-3',
    content: 'Just wanted to say hi, how are you doing today?',
    author: { username: 'TestUser3', id: '34567' },
    timestamp: new Date().toISOString()
  },
  {
    id: 'test-msg-4',
    content: 'From: Lisa Jones - We have a vacation rental in Maine next month and would love to have a private chef for one night during our stay. Is that something you offer?',
    author: { username: 'TestUser4', id: '45678' },
    timestamp: new Date().toISOString()
  }
];

/**
 * Sends a test message to the webhook endpoint
 */
async function sendTestMessage(message) {
  try {
    console.log(`\nSending test message: "${message.content.substring(0, 40)}..."`);
    
    const response = await axios.post(WEBHOOK_URL, message);
    
    console.log('Response:', response.data);
    console.log('-'.repeat(50));
    
    return response.data;
  } catch (error) {
    console.error('Error sending test message:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return null;
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('=== Discord SMS Monitor Test ===');
  console.log(`Sending test messages to ${WEBHOOK_URL}`);
  console.log('='.repeat(50));
  
  // Process each test message with a delay between them
  for (const message of testMessages) {
    await sendTestMessage(message);
    // Wait 1 second between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTests completed!');
  console.log('Check the Discord SMS Monitor console for processing details.');
}

// Run the tests
runTests().catch(console.error);
