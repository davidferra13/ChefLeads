# Discord SMS Lead Monitoring System

This integration monitors SMS messages forwarded to Discord by Tasker, automatically filters and detects potential chef leads, and adds them to your lead dashboard.

## How It Works

1. **Tasker → Discord Webhook**: Your existing Tasker automation sends SMS messages to Discord
2. **Discord → Windsurf**: This integration monitors messages posted to your Discord channel
3. **Message Processing**: Each message is analyzed for chef-related keywords and assigned a confidence score
4. **Lead Creation**: Messages with confidence ≥ 0.1 are automatically added as leads to your dashboard
5. **Dashboard Integration**: View and manage SMS leads in the dedicated SMS Leads page

## Getting Started

### 1. Start the Discord Monitor Server

```bash
npm run discord-monitor
```

This starts the server that will monitor incoming Discord messages. Keep this running in the background.

### 2. Configure Discord Webhook URL

The Discord webhook URL is located at:
```
http://your-server:3005/webhook/discord-sms
```

**Note**: Replace `your-server` with your actual server address or IP.

### 3. Access the SMS Leads Dashboard

Navigate to `/sms-leads` in your application to view incoming SMS leads.

## Keyword Detection System

The system uses a sophisticated multi-category keyword detection algorithm:

- **Service Terms**: chef, dinner, book, reservation, menu, etc.
- **Question Terms**: how much, are you available, what do you serve, etc.
- **Location Terms**: airbnb, come to, at home, travel to, etc.
- **Date Terms**: available, tonight, tomorrow, weekend, etc.
- **Dietary Terms**: vegan, vegetarian, gluten-free, etc.
- **Event Terms**: birthday, anniversary, celebration, etc.
- **Cannabis Terms**: edibles, cannabis, weed dinner, etc.

Each category has a weight, and combinations of categories receive bonus points. Messages with a confidence score of at least 0.1 are forwarded as leads.

## Manual Feedback

On the SMS Leads dashboard, you can:
- Mark messages as "Handled" 
- Flag messages as "Not a Lead"

This feedback will help improve future filtering and can be used to fine-tune the system.

## System Integration Architecture

```
[Tasker] → [Discord] ⟶ [Discord Monitor Server] → [Lead Storage] → [Dashboard UI]
    SMS       Webhook      Filtering & Scoring      Local Storage     React Component
```

## Troubleshooting

If leads aren't appearing in your dashboard:

1. Check that the Discord monitor server is running
2. Verify webhook URL configuration in Tasker/Discord
3. Check console logs for any errors or filtering decisions
4. Test with a sample message containing obvious chef-related keywords

## Technical Details

- Server runs on Express.js on port 3005 (configurable)
- Uses weighted category scoring with contextual bonuses
- Resilient to Discord rate limits and connection issues
- Stores processed message IDs to prevent duplicates
