/**
 * Test Script for Discord SMS Lead Monitor
 * 
 * This script sends test SMS messages to the webhook endpoint
 * to demonstrate the Discord webhook monitor in action.
 */

const axios = require('axios');

// Configuration
const SERVER_URL = 'http://localhost:3005/webhook/sms';

// Sample test messages with varying confidence levels
const TEST_MESSAGES = [
  // High confidence lead
  {
    id: `test-high-${Date.now()}`,
    content: 'From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates and menu options?',
    timestamp: new Date().toISOString()
  },
  
  // Medium confidence lead
  {
    id: `test-med-${Date.now()}`,
    content: 'From: +15552223333 - Do you cook for events? We have a gathering next week with about 20 people.',
    timestamp: new Date().toISOString()
  },
  
  // Low confidence (potential lead)
  {
    id: `test-low-${Date.now()}`,
    content: 'From: +15553334444 - What type of food do you serve?',
    timestamp: new Date().toISOString()
  },
  
  // Not a lead
  {
    id: `test-none-${Date.now()}`,
    content: 'From: +15554445555 - Hey, just wanted to check in about that other thing.',
    timestamp: new Date().toISOString()
  },
  
  // Spam message
  {
    id: `test-spam-${Date.now()}`,
    content: 'From: +15555556666 - UNSUBSCRIBE to stop receiving our special promotional offers and discounts.',
    timestamp: new Date().toISOString()
  }
];

/**
 * Send test messages sequentially with a delay between them
 */
async function sendTestMessages() {
  console.log('======================================');
  console.log('DISCORD SMS MONITOR TEST');
  console.log('======================================');
  console.log(`Sending ${TEST_MESSAGES.length} test messages to webhook endpoint...`);
  console.log('Look for replies in your Discord channel!');
  console.log('======================================\n');
  
  // Send each message with a delay
  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    const message = TEST_MESSAGES[i];
    
    try {
      console.log(`Sending test message ${i + 1}/${TEST_MESSAGES.length}:`);
      console.log(`"${message.content}"\n`);
      
      const response = await axios.post(SERVER_URL, message);
      
      if (response.data.leadDetected) {
        console.log(`✅ LEAD DETECTED! Score: ${Math.round(response.data.score * 100)}% (${response.data.confidence || 'Unknown'})`);
        console.log(`📨 Lead notification sent to Discord!`);
      } else {
        console.log(`❌ Not a lead. Score: ${Math.round(response.data.score * 100)}%`);
        console.log(`Reason: ${response.data.reason || 'Low confidence'}`);
      }
      
      console.log('\n--------------------------------------\n');
      
      // Wait 2 seconds between messages
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error sending message: ${error.message}`);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\nServer not running! Start it with:');
        console.log('node discord-webhook-monitor.cjs');
        process.exit(1);
      }
    }
  }
  
  console.log('======================================');
  console.log('All test messages sent!');
  console.log('Check your Discord channel for lead notifications');
  console.log('View the dashboard at: http://localhost:3005/');
  console.log('======================================');
}

// Start the test
sendTestMessages();
