/**
 * Discord Webhook SMS Lead Monitor
 * 
 * This service:
 * 1. Receives SMS messages via webhook
 * 2. Runs lead detection logic on the messages
 * 3. Posts lead notifications to Discord via webhook
 * 
 * All decision logic is centralized in this Windsurf server
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Import our lead detection module
const { detectLead } = require('./chef-lead-detector.cjs');

// Configuration
const PORT = process.env.SMS_DETECTOR_PORT || 3005;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Validate configuration
if (!DISCORD_WEBHOOK_URL) {
  console.error('ERROR: DISCORD_WEBHOOK_URL not set in .env file');
  console.log('Please add your Discord webhook URL to the .env file:');
  console.log('DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url');
  process.exit(1);
}

// Initialize Express server
const app = express();
app.use(bodyParser.json());

// In-memory storage for leads (replace with DB in production)
const leadsDatabase = [];

// Webhook endpoint that receives SMS messages
app.post('/webhook/sms', async (req, res) => {
  console.log('[Webhook] Received SMS message');
  
  try {
    // Extract message data
    const { id, content, timestamp } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing required field: content' });
    }
    
    // Process the message with our lead detector
    const result = detectLead(content);
    
    // Create standardized lead object
    const lead = {
      id: id || result.id,
      sender: result.sender,
      content: result.content,
      timestamp: timestamp || result.timestamp,
      score: result.score,
      confidence: result.confidence,
      isLead: result.isLead,
      matchedKeywords: result.matchedKeywords,
      categories: Object.keys(result.categoryMatches)
        .filter(cat => cat !== 'spam')
        .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1))
    };
    
    // Only store and notify about actual leads
    if (result.isLead) {
      // Store the lead
      leadsDatabase.push(lead);
      console.log(`[Lead Detected] Score: ${Math.round(lead.score * 100)}%, Confidence: ${lead.confidence}`);
      
      // Post to Discord webhook
      await sendToDiscordWebhook(lead);
      
      // Return success
      return res.json({
        success: true,
        leadDetected: true,
        id: lead.id,
        score: lead.score,
        confidence: lead.confidence,
        keywords: lead.matchedKeywords
      });
    } else {
      // Not a lead, just return the result
      console.log(`[Not a Lead] Score: ${Math.round(result.score * 100)}%`);
      return res.json({
        success: true,
        leadDetected: false,
        id: lead.id,
        score: lead.score,
        reason: 'Low confidence or spam indicators'
      });
    }
  } catch (error) {
    console.error('[Error]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Send a lead notification to Discord via webhook
 * @param {object} lead - The lead object
 */
async function sendToDiscordWebhook(lead) {
  try {
    console.log(`[Discord] Sending lead notification to webhook...`);
    
    // Format the matched keywords and categories
    const keywordsText = lead.matchedKeywords.length > 0
      ? lead.matchedKeywords.join(', ')
      : 'None';
    
    const categoriesText = lead.categories.length > 0
      ? lead.categories.join(', ')
      : 'None';
    
    // Format the confidence color
    // Discord embed colors: Green=High, Gold=Medium, Red=Low confidence
    const colorMap = {
      'High': 5763719,    // Green
      'Medium': 16776960, // Gold
      'Low': 15548997     // Red
    };
    
    const confidenceColor = colorMap[lead.confidence] || 5793266; // Default gray
    
    // Create a rich embed for Discord
    const embed = {
      title: '🔔 New Chef Lead Detected',
      description: `From: ${lead.sender}\n"${lead.content}"`,
      color: confidenceColor,
      fields: [
        {
          name: 'Confidence',
          value: `${Math.round(lead.score * 100)}% (${lead.confidence})`,
          inline: true
        },
        {
          name: 'Lead ID',
          value: lead.id,
          inline: true
        },
        {
          name: 'Categories',
          value: categoriesText,
          inline: false
        },
        {
          name: 'Keywords',
          value: keywordsText,
          inline: false
        }
      ],
      footer: {
        text: `Detected at ${new Date().toISOString()}`
      }
    };
    
    // Send the webhook
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: 'Chef Lead Bot',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png', // Replace with your chef icon
      embeds: [embed]
    });
    
    console.log('[Discord] Lead notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Discord] Error sending webhook:', error.message);
    return false;
  }
}

// Simple API to retrieve leads
app.get('/api/leads', (req, res) => {
  res.json(leadsDatabase);
});

// API to retrieve a specific lead
app.get('/api/leads/:id', (req, res) => {
  const lead = leadsDatabase.find(l => l.id === req.params.id);
  
  if (lead) {
    res.json(lead);
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

// Simple HTML dashboard
app.get('/', (req, res) => {
  const dashboardHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Chef Lead Monitor Dashboard</title>
      <meta http-equiv="refresh" content="30">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; line-height: 1.5; }
        .container { max-width: 900px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        h1 { margin: 0; color: #333; }
        .card { background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .lead-card { border-left: 4px solid; }
        .high { border-color: #4CAF50; }
        .medium { border-color: #FFC107; }
        .low { border-color: #F44336; }
        .lead-message { font-size: 16px; margin: 10px 0; }
        .lead-sender { color: #666; }
        .lead-meta { display: flex; flex-wrap: wrap; margin-top: 10px; font-size: 14px; color: #666; }
        .lead-meta span { margin-right: 15px; }
        .lead-keywords { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
        .keyword { background: #e0f7fa; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
        .no-leads { text-align: center; padding: 40px; color: #666; }
        .refresh-note { text-align: center; margin-top: 20px; font-size: 14px; color: #888; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Chef Lead Monitor</h1>
          <div>
            <span id="lead-count">${leadsDatabase.length}</span> leads detected
          </div>
        </div>
        
        <div id="leads-container">
          ${leadsDatabase.length === 0 ? 
            '<div class="no-leads">No leads detected yet. SMS leads will appear here.</div>' : 
            leadsDatabase.map(lead => {
              const confidenceClass = lead.confidence.toLowerCase();
              const keywords = lead.matchedKeywords.map(k => 
                `<span class="keyword">${k}</span>`
              ).join('');
              
              return `
                <div class="card lead-card ${confidenceClass}">
                  <div class="lead-sender">${lead.sender}</div>
                  <div class="lead-message">"${lead.content}"</div>
                  <div class="lead-meta">
                    <span><strong>Confidence:</strong> ${Math.round(lead.score * 100)}% (${lead.confidence})</span>
                    <span><strong>ID:</strong> ${lead.id}</span>
                    <span><strong>Detected:</strong> ${new Date(lead.timestamp).toLocaleString()}</span>
                  </div>
                  <div class="lead-keywords">
                    ${keywords}
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
        
        <div class="refresh-note">
          This dashboard refreshes automatically every 30 seconds.
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(dashboardHtml);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.send('SMS Lead Detector is running correctly!');
});

// Start the server
app.listen(PORT, () => {
  console.log('\n======================================');
  console.log('DISCORD SMS LEAD MONITOR');
  console.log('======================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('- View dashboard: http://localhost:' + PORT + '/');
  console.log('- Send SMS webhook: http://localhost:' + PORT + '/webhook/sms');
  console.log('- API endpoints:');
  console.log('  • GET /api/leads');
  console.log('  • GET /api/leads/:id');
  console.log('======================================');
});
