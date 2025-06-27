/**
 * Simple SMS Lead Test
 * 
 * This minimal script tests the SMS lead detector with a clear high-confidence lead
 */

const axios = require('axios');

// High confidence test message
const testMessage = {
  id: `test-${Date.now()}`,
  content: 'From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates and availability?',
  timestamp: new Date().toISOString()
};

console.log('======================================');
console.log('SIMPLE SMS LEAD TEST');
console.log('======================================');
console.log('Sending test message to SMS lead detector...');
console.log(`Content: "${testMessage.content}"`);

// Send the test message
axios.post('http://localhost:3005/webhook/sms', testMessage)
  .then(response => {
    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.leadDetected) {
      console.log(`\n🎯 LEAD DETECTED with ${Math.round(response.data.score * 100)}% confidence!`);
      console.log(`Lead ID: ${response.data.id}`);
      console.log(`Matched keywords: ${response.data.keywords.join(', ')}`);
      console.log('\nCheck the dashboard at: http://localhost:3005/');
    } else {
      console.log('\n❌ Not classified as a lead.');
      console.log('Reason:', response.data.reason);
    }
  })
  .catch(error => {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\nMake sure the SMS lead detector is running:');
      console.log('node sms-lead-detector.cjs');
    }
  });
