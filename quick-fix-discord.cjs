/**
 * Quick Discord Token Tester
 * 
 * This script validates your Discord token without changing any existing code.
 * It will help you fix the token format in your .env file.
 */

const { Client, GatewayIntentBits } = require('discord.js');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

console.log('============================================');
console.log('DISCORD TOKEN VALIDATOR');
console.log('============================================');

// Check current token
const currentToken = process.env.DISCORD_BOT_TOKEN;
console.log('Current token in .env file:');
console.log(currentToken ? 
  `${currentToken.substring(0, 8)}...${currentToken.substring(currentToken.length - 5)}` : 
  'Not found');
console.log('\nTesting this token...');

// Create input interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Test current token
client.once('ready', () => {
  console.log(`✅ SUCCESS! Bot connected as: ${client.user.tag}`);
  console.log('\nYour token is valid. The Discord bot should now work correctly.');
  console.log('============================================');
  rl.close();
  process.exit(0);
});

client.on('error', () => {
  // This will be handled by the catch below
});

// Try to login
client.login(currentToken).catch(error => {
  console.error(`❌ ERROR: ${error.message}`);
  console.log('\nPlease enter a valid Discord bot token:');
  
  rl.question('> ', (token) => {
    console.log('\nTesting your new token...');
    
    // Test new token
    const newClient = new Client({ intents: [GatewayIntentBits.Guilds] });
    
    newClient.once('ready', async () => {
      console.log(`✅ SUCCESS! Bot connected as: ${newClient.user.tag}`);
      console.log('\nUpdate your .env file with this new token:');
      console.log('DISCORD_BOT_TOKEN=' + token);
      
      // Save token to .env file if user confirms
      rl.question('\nWould you like to update your .env file now? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const fs = require('fs');
          const path = require('path');
          const envPath = path.join(process.cwd(), '.env');
          
          try {
            let envContent = await fs.promises.readFile(envPath, 'utf8');
            envContent = envContent.replace(/DISCORD_BOT_TOKEN=.*(\r?\n|$)/m, `DISCORD_BOT_TOKEN=${token}$1`);
            await fs.promises.writeFile(envPath, envContent);
            console.log('✅ .env file updated successfully!');
          } catch (err) {
            console.error('Error updating .env file:', err.message);
            console.log('Please manually update your .env file with the token above.');
          }
        }
        
        rl.close();
        process.exit(0);
      });
    });
    
    newClient.on('error', () => {
      // Handled by catch below
    });
    
    newClient.login(token).catch(error => {
      console.error(`❌ ERROR: ${error.message}`);
      console.log('Please obtain a valid token from the Discord Developer Portal.');
      rl.close();
      process.exit(1);
    });
  });
});
