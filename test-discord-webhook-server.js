/**
 * Discord Webhook Server Test Script
 * 
 * This script demonstrates how the webhook server processes Discord messages
 * containing SMS content and generates responses.
 */

const axios = require('axios');

// Sample Discord webhook payloads
const TEST_MESSAGES = [
  // High confidence lead
  {
    content: "From: +15551234567 - Looking for a private chef for next Saturday. Party of 6 people. What are your rates?",
    author: { username: "SMSForwarder" },
    channel_id: "123456789012345678"
  },
  // Medium confidence lead
  {
    content: "From: +15559876543 - Can you cook dinner at our Airbnb?",
    author: { username: "SMSForwarder" },
    channel_id: "123456789012345678"
  },
  // Low confidence but still valid lead
  {
    content: "From: +15552223333 - Do you do vegan menus?",
    author: { username: "SMSForwarder" },
    channel_id: "123456789012345678"
  },
  // Spam message (should be filtered)
  {
    content: "From: +15554445555 - SPECIAL OFFER: Limited time discount. Click here!",
    author: { username: "SMSForwarder" },
    channel_id: "123456789012345678"
  },
  // Unrelated message (should be filtered)
  {
    content: "From: +15556667777 - Hey, are we still on for coffee?",
    author: { username: "SMSForwarder" },
    channel_id: "123456789012345678"
  }
];

// Function to send test messages to webhook
async function sendTestMessage(message) {
  console.log('\n==================================================');
  console.log(`Sending test message: "${message.content}"`);
  
  try {
    // Send message to webhook
    const response = await axios.post('http://localhost:3005/webhook/discord-sms', message);
    
    console.log('\nServer responded:');
    console.log(`Status: ${response.status}`);
    console.log('Response data:', response.data);
    
    if (response.data.leadDetected) {
      console.log('\n✅ Message was identified as a valid lead');
    } else {
      console.log('\n❌ Message was filtered out');
    }
    
    return response.data;
  } catch (error) {
    console.error(`\n❗ Error sending test message: ${error.message}`);
    if (error.response) {
      console.error('Server response error data:', error.response.data);
    }
    throw error;
  }
}

// Run all tests sequentially
async function runAllTests() {
  console.log('=======================================================');
  console.log('DISCORD SMS WEBHOOK SERVER TEST');
  console.log('=======================================================');
  console.log('\nThis test simulates Discord webhook messages containing SMS content');
  console.log('Check the server console to see the properly formatted log output');
  console.log('\nSending test messages...');
  
  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    try {
      await sendTestMessage(TEST_MESSAGES[i]);
      // Wait a second between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Test message ${i + 1} failed`);
    }
  }
  
  console.log('\n=======================================================');
  console.log('TEST COMPLETE!');
  console.log('=======================================================');
  console.log('\nAfter you deploy this server:');
  console.log('1. Configure your Discord bot with the appropriate permissions');
  console.log('2. Set your DISCORD_BOT_TOKEN in the .env file');
  console.log('3. Point your webhook to: http://your-server:3005/webhook/discord-sms');
  console.log('4. View SMS leads at: /sms-leads in your application\n');
}

// Make sure the server is running before running tests
console.log('Make sure the Discord SMS webhook server is running on port 3005');
console.log('Run it with: node src/server/discord-sms-webhook.cjs');
console.log('Press Ctrl+C to cancel or Enter to continue...');

// Wait for user input before starting tests
process.stdin.once('data', () => {
  runAllTests().catch(console.error);
});
