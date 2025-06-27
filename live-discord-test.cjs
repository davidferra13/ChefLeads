/**
 * Live Discord SMS Monitor Test
 * 
 * This script runs the Discord SMS monitor with your real token
 * and tests it with a simulated message.
 */

// Force production mode
process.env.SMS_MONITOR_TEST_MODE = 'false';

const express = require('express');
const axios = require('axios');
const { setTimeout } = require('timers/promises');

// Start the Discord monitor
console.log('Starting Discord monitor with live token...');
const monitor = require('./src/server/discord-sms-monitor.cjs');

// Allow time for Discord client to connect
async function runTest() {
  try {
    console.log('Waiting for Discord client to connect...');
    await setTimeout(5000);
    
    const testMessage = {
      id: `test-${Date.now()}`,
      content: 'From: +15551234567 - Looking for a private chef for a dinner party next weekend for 8 people. What are your rates?',
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending test message to webhook...');
    console.log(testMessage.content);
    
    const response = await axios.post('http://localhost:3005/webhook/discord-sms', testMessage);
    console.log('Response:', response.data);
    console.log('Check your Discord channel for the bot reply!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

runTest();
