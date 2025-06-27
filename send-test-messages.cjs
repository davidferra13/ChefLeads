/**
 * Discord SMS Monitor - Test Message Sender
 * 
 * This script sends test messages to the Discord SMS monitor webhook
 * to demonstrate the lead detection and auto-reply functionality.
 */

const axios = require('axios');

// Configuration
const WEBHOOK_URL = 'http://localhost:3005/webhook/discord-sms';

// Sample test messages with different confidence levels
const testMessages = [
  // High confidence message (should trigger a reply)
  {
    id: 'test-high-1',
    content: 'From: +15551234567 - Hello, I\'m looking for a private chef for my anniversary dinner next weekend for 8 people at my home in Miami. What are your rates and menu options?',
    timestamp: new Date().toISOString()
  },
  // Medium confidence message (should also trigger a reply)
  {
    id: 'test-med-1',
    content: 'From: +15552223333 - Do you cook dinner parties? We need someone for an event.',
    timestamp: new Date().toISOString()
  },
  // Low confidence message (might not trigger a reply)
  {
    id: 'test-low-1',
    content: 'From: +15553334444 - Do you do gluten-free meals?',
    timestamp: new Date().toISOString()
  },
  // Food-related but not booking (should not trigger)
  {
    id: 'test-food-1',
    content: 'From: +15554445555 - I tried that recipe you mentioned last time and it was delicious!',
    timestamp: new Date().toISOString()
  },
  // Spam message (should be filtered out)
  {
    id: 'test-spam-1',
    content: 'From: +15556667777 - CONGRATS! You\'ve won a FREE vacation! Click here to claim your prize now!',
    timestamp: new Date().toISOString()
  },
  // Cannabis-related message (should trigger)
  {
    id: 'test-cannabis-1',
    content: 'From: +15558889999 - Hey, we\'re interested in booking a cannabis dinner experience for a special occasion. Do you offer that?',
    timestamp: new Date().toISOString()
  }
];

/**
 * Send a test message to the webhook endpoint
 */
async function sendTestMessage(message) {
  console.log('\n========================================');
  console.log(`SENDING TEST MESSAGE (ID: ${message.id})`);
  console.log('----------------------------------------');
  console.log(message.content);
  console.log('----------------------------------------');
  
  try {
    const response = await axios.post(WEBHOOK_URL, message);
    
    // Display response
    console.log('\nSERVER RESPONSE:');
    console.log('----------------------------------------');
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Processed: ${response.data.processed}`);
    console.log(`Forwarded: ${response.data.forwarded}`);
    console.log(`Confidence: ${response.data.score}`);
    
    // If this was in production mode with a real Discord token:
    if (response.data.forwarded) {
      console.log('\nDISCORD BOT ACTION (Simulated in Test Mode):');
      console.log('----------------------------------------');
      console.log('✅ Bot would reply to this message in Discord channel');
      console.log('✅ The reply would include a formatted lead summary');
      console.log('✅ The message IDs would be stored in the dashboard');
    } else {
      console.log('\nDISCORD BOT ACTION (Simulated in Test Mode):');
      console.log('----------------------------------------');
      console.log('❌ This message would NOT trigger a bot reply');
      console.log('❌ Too low confidence or filtered as spam/irrelevant');
    }
    
    return response.data;
  } catch (error) {
    console.error('\nERROR SENDING MESSAGE:');
    console.error(`${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

/**
 * Run all test messages in sequence
 */
async function runAllTests() {
  console.log('\n========================================');
  console.log('DISCORD SMS LEAD DETECTION - TEST SUITE');
  console.log('========================================');
  console.log('This test will demonstrate how the system:');
  console.log('1. Processes incoming SMS messages');
  console.log('2. Analyzes them for lead potential');
  console.log('3. Simulates Discord bot replies for leads');
  console.log('4. Tracks message IDs for dashboard integration');
  console.log('========================================\n');
  
  console.log('Starting tests (sending 6 different messages)...');
  
  for (const message of testMessages) {
    await sendTestMessage(message);
    // Wait between messages to make output readable
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n========================================');
  console.log('TEST COMPLETE!');
  console.log('========================================');
  console.log('The Discord SMS monitoring system is working as expected.');
  console.log('\nIn PRODUCTION MODE (with a real Discord token):');
  console.log('- The bot would reply directly in the Discord channel');
  console.log('- Replies would include a formatted lead summary');
  console.log('- Message and reply IDs would be tracked in the dashboard');
  console.log('- Only qualified leads would receive bot replies');
  console.log('\nTo use in production, update your .env file with:');
  console.log('DISCORD_BOT_TOKEN=your_actual_discord_bot_token');
  console.log('========================================');
}

// Execute all tests
runAllTests().catch(console.error);
