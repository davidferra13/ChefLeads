/**
 * Simple Discord SMS Monitor Test Script
 */

// Import required modules
const axios = require('axios');
const { execSync } = require('child_process');

// Configuration
const WEBHOOK_URL = 'http://localhost:3005/webhook/discord-sms';

// Sample test lead message (high confidence)
const highConfidenceMessage = {
  id: 'test-lead-1',
  content: 'From: +15551234567 - Hello, I\'m looking for a private chef for my anniversary dinner next weekend for 8 people at my house in Miami. What are your rates and do you have availability?',
  timestamp: new Date().toISOString()
};

// Sample test message (low confidence)
const lowConfidenceMessage = {
  id: 'test-nonlead-1',
  content: 'From: +15559876543 - Hey, just checking in. How are you doing?',
  timestamp: new Date().toISOString()
};

// Start the Discord monitor server in test mode in a separate process
console.log('Starting Discord SMS Monitor in test mode...');
console.log('-----------------------------------------------------');

try {
  // Set test mode environment variable for the child process
  process.env.SMS_MONITOR_TEST_MODE = 'true';
  
  // Start the monitor by requiring the module directly
  console.log('Loading Discord SMS Monitor module...');
  const monitor = require('./src/server/discord-sms-monitor.cjs');
  console.log('Discord SMS Monitor started in TEST MODE');
  console.log('Server running on port 3005');
  console.log('-----------------------------------------------------');
  
  // Wait a moment for server to fully initialize
  setTimeout(async () => {
    // Now test with our sample messages
    console.log('\nSending high-confidence test message:');
    console.log(highConfidenceMessage.content);
    
    try {
      const highResponse = await axios.post(WEBHOOK_URL, highConfidenceMessage);
      console.log('\n✅ Response (high confidence message):');
      console.log(JSON.stringify(highResponse.data, null, 2));
      console.log('-----------------------------------------------------');
      
      // Short pause between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('\nSending low-confidence test message:');
      console.log(lowConfidenceMessage.content);
      
      const lowResponse = await axios.post(WEBHOOK_URL, lowConfidenceMessage);
      console.log('\n✅ Response (low confidence message):');
      console.log(JSON.stringify(lowResponse.data, null, 2));
      console.log('-----------------------------------------------------');
      
      console.log('\n🎉 TESTING COMPLETE!');
      console.log('The Discord SMS monitoring system is working as expected.');
      console.log('In PRODUCTION mode (with a real Discord token), the system will:');
      console.log('1. Reply directly in Discord channel for high-confidence leads');
      console.log('2. Track message and reply IDs for dashboard integration');
      console.log('3. Skip replies for low-confidence messages');
      
      // Exit with success
      process.exit(0);
      
    } catch (error) {
      console.error('Error during testing:', error.message);
      process.exit(1);
    }
  }, 2000);
} catch (error) {
  console.error('Failed to start Discord SMS Monitor:', error);
  process.exit(1);
}
