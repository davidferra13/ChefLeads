/**
 * Discord SMS Monitor Launcher (CommonJS)
 * 
 * This script starts the Discord SMS monitor in production mode
 * with the real Discord bot token from your .env file.
 */

// Explicitly set test mode to false
process.env.SMS_MONITOR_TEST_MODE = 'false';

console.log('==========================================');
console.log('DISCORD SMS MONITOR - PRODUCTION MODE');
console.log('==========================================');
console.log('Starting monitor with live Discord bot...');

// Import the monitor directly
const monitor = require('./src/server/discord-sms-monitor.cjs');

console.log('✓ Discord SMS Monitor running in PRODUCTION mode');
console.log('✓ Using bot token from .env file');
console.log('✓ Bot will post real replies in your Discord channel');
console.log('✓ Monitor is listening for SMS messages on port 3005');
console.log('==========================================');
console.log('Press Ctrl+C to stop the server');
