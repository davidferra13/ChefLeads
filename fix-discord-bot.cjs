/**
 * Discord Bot Fix & Diagnostics
 */

// Use strict mode for better error catching
'use strict';

const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('=======================================');
console.log('DISCORD BOT DIAGNOSTICS & FIX');
console.log('=======================================');

// Check token existence
if (!process.env.DISCORD_BOT_TOKEN) {
  console.error('❌ ERROR: DISCORD_BOT_TOKEN not found in .env file');
  console.log('Please check your .env file configuration');
  process.exit(1);
}

// Create a basic client with minimal intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Handle connection events
client.once('ready', async () => {
  console.log(`✅ Connected successfully as: ${client.user.tag}`);
  
  // List available channels
  console.log('\nAvailable channels:');
  client.channels.cache.forEach((channel) => {
    if (channel.isTextBased()) {
      console.log(`- #${channel.name} (${channel.id})`);
    }
  });
  
  // Find a text channel to use for testing
  const targetChannel = client.channels.cache.find(
    channel => channel.isTextBased() && 
    (channel.name.includes('test') || channel.name.includes('sms') || channel.name.includes('bot'))
  );
  
  if (targetChannel) {
    console.log(`\n✅ Found suitable test channel: #${targetChannel.name}`);
    
    try {
      // Send a test message
      console.log('Sending test message...');
      
      // Create a simple test embed that matches our lead format
      const testEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Test: Bot Connection Working')
        .setDescription('If you can see this, the Discord bot is functioning correctly')
        .addFields(
          { name: 'Permissions', value: 'Working correctly', inline: true },
          { name: 'Connection', value: 'Established', inline: true },
          { name: 'Next Steps', value: 'The SMS monitor will use this bot to reply to detected leads' }
        )
        .setFooter({ text: 'Windsurf SMS Lead Monitor' });
      
      const message = await targetChannel.send({ 
        content: '🔍 DIAGNOSTIC TEST: This confirms the bot can post messages with embeds.',
        embeds: [testEmbed]
      });
      
      console.log(`✅ Test message sent successfully (ID: ${message.id})`);
      console.log('\n✅ Discord bot is WORKING PROPERLY');
      console.log('=======================================');
      
      // Close the connection after sending the test message
      process.exit(0);
    } catch (error) {
      console.error('❌ Error sending test message:', error.message);
      console.log('This may be a permissions issue. Make sure the bot has:');
      console.log('- View Channel permission');
      console.log('- Send Messages permission');
      console.log('- Embed Links permission');
      process.exit(1);
    }
  } else {
    console.log('\n❌ Could not find a suitable text channel for testing');
    console.log('Please make sure the bot has access to at least one text channel');
    process.exit(1);
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('❌ Discord client error:', error.message);
  process.exit(1);
});

// Connect to Discord
console.log('Connecting to Discord...');
client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  console.error('❌ Failed to login to Discord:', error.message);
  console.log('\nPossible causes:');
  console.log('1. Invalid token in .env file');
  console.log('2. Network connectivity issues');
  console.log('3. Discord API outage');
  console.log('\nPlease check your token and try again.');
  process.exit(1);
});

// Add timeout in case login hangs
setTimeout(() => {
  console.error('❌ Connection attempt timed out');
  console.log('Check your internet connection and Discord token');
  process.exit(1);
}, 30000);
