/**
 * Discord SMS Monitor Launcher
 * 
 * This script launches the Discord SMS monitoring server that:
 * 1. Monitors Discord webhook messages sent by Tasker
 * 2. Processes SMS messages to detect chef-related leads
 * 3. Forwards qualifying leads to the lead dashboard
 * 4. Replies to qualified leads in Discord with formatted summaries
 */

// Import the server module - using require since the target is a CJS file
const discordMonitor = require('./src/server/discord-sms-monitor.cjs');

console.log('Discord SMS Monitor started!');
console.log('To stop, press Ctrl+C');
