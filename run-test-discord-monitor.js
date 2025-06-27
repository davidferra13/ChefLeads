/**
 * Test launcher for Discord SMS Monitor
 * 
 * This runs the Discord SMS monitor in test mode where Discord 
 * bot responses are simulated without requiring an actual token.
 */

const { exec } = require('child_process');

// Set test mode environment variable and run the monitor
const env = Object.assign({}, process.env, { 
  SMS_MONITOR_TEST_MODE: 'true',
  DISCORD_MONITOR_PORT: '3005'
});

console.log('Starting Discord SMS Monitor in test mode...');
console.log('Press Ctrl+C to stop the server');

// Run the Discord monitor with test mode enabled
const monitor = exec('node start-discord-monitor.js', { env });

monitor.stdout.on('data', (data) => {
  console.log(data.toString().trim());
});

monitor.stderr.on('data', (data) => {
  console.error(data.toString().trim());
});

monitor.on('close', (code) => {
  console.log(`Discord monitor exited with code ${code}`);
});
