/**
 * Discord Webhook Test Script
 * Used to test the SMS lead detection system by simulating incoming Discord messages
 */

const axios = require('axios');

const WEBHOOK_URL = 'http://localhost:3005/webhook/discord-sms';
const TEST_MESSAGES = [
  // High confidence message (should be detected as lead)
  {
    id: 'test-msg-1',
    content: 'From: +15551234567 - Hello, I\'m looking for a private chef for dinner next weekend for 6 people. What are your rates?',
    timestamp: new Date().toISOString()
  },
  // Medium confidence message (should be detected)
  {
    id: 'test-msg-2',
    content: 'From: +15559876543 - Can you cook at our Airbnb next Saturday?',
    timestamp: new Date().toISOString()
  },
  // Low confidence message (just above threshold)
  {
    id: 'test-msg-3',
    content: 'From: +15552223333 - Do you do gluten-free meals?',
    timestamp: new Date().toISOString()
  },
  // Spam message (should be ignored)
  {
    id: 'test-msg-4',
    content: 'From: +15554445555 - SPECIAL OFFER: Click here to earn money from home! Limited time discount.',
    timestamp: new Date().toISOString()
  },
  // Unrelated message (should be ignored)
  {
    id: 'test-msg-5',
    content: 'From: +15556667777 - Hey, what time are we meeting later?',
    timestamp: new Date().toISOString()
  },
  // Cannabis-related message
  {
    id: 'test-msg-6',
    content: 'From: +15558889999 - I heard you do cannabis dinner events. We\'re interested in booking.',
    timestamp: new Date().toISOString()
  }
];

async function sendTestMessage(message) {
  try {
    console.log(`Sending test message: "${message.content.substring(0, 50)}..."`);
    const response = await axios.post(WEBHOOK_URL, message);
    console.log(`Response (${response.status}):`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error sending test message: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function runAllTests() {
  console.log('Starting Discord webhook test sequence...');
  console.log(`Sending ${TEST_MESSAGES.length} test messages to ${WEBHOOK_URL}`);
  console.log('-----------------------------------------------------');
  
  for (const message of TEST_MESSAGES) {
    await sendTestMessage(message);
    // Wait a second between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('-----------------------------------------------------');
  }
  
  console.log('All test messages sent. Check your SMS Leads page to view the results.');
}

// Run the tests
runAllTests().catch(console.error);
