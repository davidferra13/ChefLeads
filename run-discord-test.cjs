/**
 * Discord SMS Monitor Test Runner
 * 
 * This script runs the Discord SMS monitor directly and 
 * tests the new reply functionality in test mode.
 */

// Set test mode
process.env.SMS_MONITOR_TEST_MODE = 'true';

// Import the module directly
const monitor = require('./src/server/discord-sms-monitor.cjs');

console.log('Discord SMS Monitor started in TEST MODE');
console.log('The server is now running on port 3005');
console.log('To test it, open another terminal and run: node test-discord-webhook.cjs');
console.log('Press Ctrl+C to stop the server when done testing');
