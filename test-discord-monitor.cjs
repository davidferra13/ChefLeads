/**
 * Discord SMS Monitor Test
 * 
 * This is a self-contained test script that runs the Discord SMS monitor
 * in test mode and sends sample messages to verify the lead detection
 * and Discord reply functionality.
 */

// Set test mode environment variable
process.env.SMS_MONITOR_TEST_MODE = 'true'; 
process.env.DISCORD_MONITOR_PORT = '3005';

const http = require('http');
const axios = require('axios');

// Import the monitor server
console.log('Starting Discord SMS monitor in test mode...');
const monitorApp = require('./src/server/discord-sms-monitor.cjs');

// Give the server a moment to start up
setTimeout(runTests, 1000);

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
    console.log('\n==================================================');
    console.log(`Sending test message ${message.id}:`);
    console.log(`"${message.content}"`);
    console.log('==================================================\n');
    
    const response = await axios.post('http://localhost:3005/webhook/discord-sms', message);
    
    // Give time for processing and console output to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\nAPI Response:', JSON.stringify(response.data, null, 2));
    console.log('==================================================\n');
    
    return response.data;
  } catch (error) {
    console.error('\nError sending test message:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.log('==================================================\n');
    return null;
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('=== Discord SMS Monitor Test ===');
  console.log('Sending test messages to webhook endpoint');
  console.log('='.repeat(50));
  
  // Process each test message with a delay between them
  for (const message of testMessages) {
    await sendTestMessage(message);
    // Wait 1.5 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\nTests completed!');
  console.log('Check above for simulated Discord replies.');
  
  // Give time to see the output then exit
  setTimeout(() => process.exit(0), 1000);
}
