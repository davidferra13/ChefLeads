/**
 * Discord SMS Monitor - Test Mode Starter
 * 
 * This script starts the Discord SMS monitor in test mode.
 */

// Set test mode environment variable
process.env.SMS_MONITOR_TEST_MODE = 'true';

console.log('========================================');
console.log('DISCORD SMS MONITOR - TEST MODE');
console.log('========================================');
console.log('Starting the Discord SMS monitor server...');

// Import the monitor module
const monitor = require('./src/server/discord-sms-monitor.cjs');

console.log('\nTest server is now running!');
console.log('- To test it, open another terminal window');
console.log('- Run: node send-test-messages.cjs');
console.log('- Press Ctrl+C to stop this server when done');
console.log('========================================');
