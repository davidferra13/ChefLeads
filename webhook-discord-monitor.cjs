/**
 * Discord SMS Monitor - Webhook Edition
 * 
 * This version uses Discord webhooks directly to post replies,
 * eliminating the need for a bot token and permissions.
 */

// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Constants
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1388148744503169024/aABCqrkGO08w_7iA2E8AembwhMpyMo3oNIdhnnRT0TMezdpxVU_vpd8QzjXk6O-fCIfM';
const PORT = process.env.DISCORD_MONITOR_PORT || 3005;

console.log('==========================================');
console.log('DISCORD SMS MONITOR - WEBHOOK EDITION');
console.log('==========================================');

// Initialize Express
const app = express();
app.use(bodyParser.json());

// Lead detection keywords and categories
const LEAD_KEYWORDS = {
  serviceTerms: ['chef', 'cook', 'cooking', 'catering', 'meal', 'dinner', 'food', 'menu', 'dish'],
  dateTerms: ['tonight', 'tomorrow', 'weekend', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'next week', 'this week', 'date', 'day'],
  eventTerms: ['party', 'event', 'gathering', 'celebration', 'anniversary', 'birthday', 'wedding', 'reception', 'holiday', 'dinner party'],
  bookingTerms: ['book', 'booking', 'reserve', 'reservation', 'schedule', 'availability', 'available', 'hire', 'hired'],
  inquiryTerms: ['interested', 'rates', 'pricing', 'cost', 'quote', 'how much', 'price', 'charge', 'fee'],
  personTerms: ['people', 'guests', 'persons', 'adults', 'children', 'family'],
  spamTerms: ['unsubscribe', 'spam', 'scam', 'offer', 'discount', 'sale', 'promotion', 'marketing', 'advertisement']
};

// Webhook endpoint for Discord SMS messages
app.post('/webhook/discord-sms', async (req, res) => {
  console.log('[Webhook] Received message from Discord');
  
  try {
    // Extract message data
    const { id, content, timestamp } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid message format' });
    }
    
    console.log(`[Received] ${content}`);
    
    // Process the message
    const processedMessage = processMessage(content, id, timestamp);
    
    // Check if we should reply (based on lead score)
    if (processedMessage.score >= 0.3 && processedMessage.shouldForward) {
      try {
        // Reply using webhook
        const replyResult = await replyWithWebhook(processedMessage);
        console.log('[Webhook] Reply sent successfully');
        
        // Forward to dashboard
        try {
          const dashboardResult = await sendToDashboard(processedMessage);
          console.log('[Dashboard] Lead forwarded successfully');
          
          return res.json({ 
            success: true, 
            processed: true, 
            replied: true,
            forwarded: true,
            score: processedMessage.score
          });
        } catch (dashboardError) {
          console.error('[Dashboard] Failed to forward lead:', dashboardError.message);
          
          return res.json({ 
            success: true, 
            processed: true, 
            replied: true,
            forwarded: false,
            score: processedMessage.score
          });
        }
      } catch (replyError) {
        console.error('[Webhook] Failed to send reply:', replyError.message);
        
        return res.json({ 
          success: true, 
          processed: true, 
          replied: false,
          score: processedMessage.score
        });
      }
    } else {
      // No reply needed
      console.log(`[Filter] Message filtered out (score: ${processedMessage.score})`);
      
      return res.json({ 
        success: true, 
        processed: true, 
        replied: false,
        score: processedMessage.score
      });
    }
  } catch (error) {
    console.error('[Webhook] Error processing message:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Process an SMS message for lead detection
 */
function processMessage(messageText, id, timestamp) {
  // Extract sender info (common format: "From: +1234567890 - Message content")
  const senderMatch = messageText.match(/From:\s+(\+\d+)\s+-\s+(.*)/i);
  let sender = 'Unknown';
  
  if (senderMatch) {
    sender = senderMatch[1];
    messageText = senderMatch[2];
  }
  
  // Check for keywords in message
  const matchedKeywords = [];
  const matchedCategories = [];
  let score = 0;
  
  // Normalize text for better matching
  const normalizedText = messageText.toLowerCase();
  
  // Check each category of keywords
  for (const [category, keywords] of Object.entries(LEAD_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        
        // Only add category once
        if (!matchedCategories.includes(category)) {
          matchedCategories.push(category);
        }
        
        // Calculate score contribution
        if (category === 'spamTerms') {
          // Spam terms reduce score
          score -= 0.1;
        } else if (category === 'serviceTerms' || category === 'bookingTerms') {
          // Higher weight for direct service or booking terms
          score += 0.15;
        } else {
          // Standard weight for other term matches
          score += 0.1;
        }
      }
    }
  }
  
  // Calculate message length score factor
  // Longer messages tend to be more detailed inquiries
  const lengthFactor = Math.min(messageText.length / 200, 1) * 0.1;
  score += lengthFactor;
  
  // Message includes both service and booking/inquiry terms?
  if (
    matchedCategories.includes('serviceTerms') && 
    (matchedCategories.includes('bookingTerms') || matchedCategories.includes('inquiryTerms'))
  ) {
    score += 0.2;
  }
  
  // Contains both date and event info?
  if (matchedCategories.includes('dateTerms') && matchedCategories.includes('eventTerms')) {
    score += 0.15;
  }
  
  // Cap score between 0 and 1
  score = Math.max(0, Math.min(1, score));
  
  // Determine message type and filter reason
  let messageType = 'general';
  let shouldForward = false;
  let filterReason = '';
  
  if (score >= 0.7) {
    messageType = 'lead';
    shouldForward = true;
  } else if (score >= 0.3) {
    messageType = 'potential_lead';
    shouldForward = true;
  } else {
    filterReason = 'Low relevance score';
  }
  
  console.log(`[Analysis] Score: ${score.toFixed(2)}, Keywords: ${matchedKeywords.join(', ')}`);
  
  return {
    sender,
    content: messageText,
    timestamp,
    score,
    matchedKeywords,
    matchedCategories,
    shouldForward,
    messageType,
    messageId: id,
    filterReason
  };
}

/**
 * Formats a lead summary for Discord webhook replies
 */
function formatLeadSummary(leadData) {
  // Calculate confidence level text
  let confidenceLevel = 'Low';
  let confidenceColor = 0xAAAAAA; // Grey
  
  if (leadData.score >= 0.7) {
    confidenceLevel = 'High';
    confidenceColor = 0x00FF00; // Green
  } else if (leadData.score >= 0.4) {
    confidenceLevel = 'Medium';
    confidenceColor = 0xFFAA00; // Orange
  }
  
  // Format matched keywords for display
  const keywordsText = leadData.matchedKeywords.length > 0 
    ? leadData.matchedKeywords.join(', ')
    : 'None';
  
  // Get categories matched
  const categoriesText = leadData.matchedCategories.length > 0
    ? leadData.matchedCategories.map(cat => cat.replace('Terms', '')).join(', ')
    : 'None';
  
  // Create rich embed for Discord
  return {
    username: "Lead Detection Bot",
    avatar_url: "https://cdn.discordapp.com/avatars/1234567890/abcdef123456.png",
    content: "I detected a potential lead from this SMS message!",
    embeds: [{
      color: confidenceColor,
      title: `New Lead Detected: ${confidenceLevel} Confidence (${Math.round(leadData.score * 100)}%)`,
      description: `A new potential lead has been detected from SMS`,
      fields: [
        {
          name: "From",
          value: leadData.sender || "Unknown",
          inline: true
        },
        {
          name: "Type",
          value: leadData.messageType || "general",
          inline: true
        },
        {
          name: "Score",
          value: `${leadData.score.toFixed(2)} (${confidenceLevel})`,
          inline: true
        },
        {
          name: "Matched Keywords",
          value: keywordsText
        },
        {
          name: "Categories",
          value: categoriesText
        },
        {
          name: "Next Steps",
          value: "This lead has been added to your dashboard for follow up."
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: `Lead ID: ${leadData.messageId || 'Unknown'}`
      }
    }]
  };
}

/**
 * Sends a reply to Discord using webhooks API
 */
async function replyWithWebhook(leadData) {
  // Skip if no messageId
  if (!leadData.messageId) {
    console.log('[Webhook] Cannot reply - missing messageId');
    return { success: false, reason: 'Missing messageId' };
  }
  
  try {
    // Format webhook message
    const webhookPayload = formatLeadSummary(leadData);
    
    // Send webhook POST request
    const response = await axios.post(WEBHOOK_URL, webhookPayload);
    
    console.log('[Webhook] Sent reply successfully');
    
    return { 
      success: true, 
      messageId: response.data?.id,
      channelId: response.data?.channel_id
    };
  } catch (error) {
    console.error('[Webhook] Error sending reply:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Forwards a qualified lead to the dashboard API
 */
async function sendToDashboard(leadData) {
  try {
    const payload = {
      source: "SMS via Discord",
      sender: leadData.sender,
      timestamp: leadData.timestamp,
      rawMessage: leadData.content,
      keywords: leadData.matchedKeywords,
      categories: leadData.matchedCategories,
      confidence: leadData.score,
      messageId: leadData.messageId,
      messageType: leadData.messageType
    };
    
    // Option 1: Use a dashboard API URL if available
    // Replace with your dashboard endpoint
    const dashboardApiUrl = process.env.DASHBOARD_API_URL;
    
    if (dashboardApiUrl) {
      const response = await axios.post(dashboardApiUrl, payload);
      return { success: true, id: response.data.id };
    } else {
      // Option 2: If no dashboard API, just log it
      console.log('[Dashboard] No API URL configured, skipping forwarding');
      console.log('[Dashboard] Would have forwarded:', JSON.stringify(payload, null, 2));
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('[Dashboard] Error forwarding lead:', error.message);
    return { success: false, error: error.message };
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Discord SMS Monitor running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/discord-sms`);
  console.log(`Using Discord webhook URL: ${WEBHOOK_URL.substring(0, 40)}...`);
  console.log('==========================================');
});
