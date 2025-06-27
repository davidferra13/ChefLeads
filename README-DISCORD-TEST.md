# Discord SMS Lead Bot - Testing Guide

This document walks you through testing the enhanced Discord SMS monitor with your real bot token.

## Setup Complete
✅ Discord bot integration added to SMS monitor  
✅ Lead summary formatting with embedded replies  
✅ Production vs test mode configuration  
✅ Bot token added to .env file  
✅ Telegram code removed (Discord-only system)  

## How to Test in Production Mode

### Step 1: Start the Discord SMS Monitor
Open a terminal in the project directory and run:
```
node run-discord-monitor.cjs
```

You should see output indicating:
- "Running in PRODUCTION MODE"
- "Discord bot connected successfully" 
- "Discord bot logged in as [bot name]"
- "Discord SMS Monitor running on port 3005"

### Step 2: Send a Test Message
Open a second terminal window and run one of these test scripts:

**Option A - Simple Test** (recommended):
```
node test-discord-webhook.cjs
```

**Option B - Multiple Test Messages**:
```
node send-test-messages.cjs
```

### Step 3: Check Your Discord Channel
Watch your Discord channel - you should see:
1. The test message appearing as if it were an SMS forwarded by Tasker
2. The bot replying to the message with a formatted lead summary
3. The lead summary showing:
   - Confidence level (with color coding)
   - Matched keywords and categories
   - Next steps for follow-up

## Troubleshooting

### If the Bot Doesn't Reply:
1. Check the console output for any login errors
2. Verify that your bot has proper permissions in the Discord channel
3. Make sure `SMS_MONITOR_TEST_MODE` is not set to 'true'
4. Confirm the bot token in .env is correct
5. Ensure the bot has the MESSAGE_CONTENT intent enabled in Discord Developer Portal

### API Error for Dashboard:
- "Invalid URL" errors for the dashboard API are expected in this testing environment
- These don't affect the Discord reply functionality

## What Was Added
- Automatic Discord replies to lead messages
- Formatted lead summaries with confidence levels
- Message tracking between original SMS and bot replies
- Real-time lead qualification directly in Discord 
- Seamless integration with existing dashboard
