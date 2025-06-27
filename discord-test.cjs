/**
 * Simple Discord SMS test script
 * Tests the enhanced monitor with direct webhook calls
 */

const axios = require('axios');

// Test webhook URL (local server endpoint)
const WEBHOOK_URL = 'http://localhost:3005/webhook/discord-sms';

// Sample high-confidence lead message
const leadMessage = {
  id: 'test-lead-123',
  content: 'From: +15551234567 - Looking to hire a chef for dinner party next weekend. 8 guests. What are your rates?',
  timestamp: new Date().toISOString()
};

// Start server directly in this script (test mode)
process.env.SMS_MONITOR_TEST_MODE = 'true';
const monitor = require('./src/server/discord-sms-monitor.cjs');

// Wait for server to initialize
setTimeout(async () => {
  try {
    // Send test message
    console.log('\n🔄 Sending test lead message...');
    const response = await axios.post(WEBHOOK_URL, leadMessage);
    
    console.log('\n✅ Server response:', JSON.stringify(response.data, null, 2));
    
    // Exit after short delay to allow server logs to print
    setTimeout(() => {
      console.log('\n✅ Test complete - Discord SMS Monitor is working');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}, 1000);
