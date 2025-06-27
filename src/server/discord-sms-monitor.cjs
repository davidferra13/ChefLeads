/**
 * Discord SMS Monitor Server
 * 
 * This server component monitors a Discord channel where Tasker sends SMS messages,
 * processes them to detect chef-related leads, and adds them to the lead dashboard.
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { setTimeout } = require('timers/promises');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express server
const app = express();
const PORT = process.env.DISCORD_MONITOR_PORT || 3005;

// Initialize Discord bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize Discord bot when token is available
let discordReady = false;
const TEST_MODE = process.env.SMS_MONITOR_TEST_MODE === 'true';

// Log the mode we're running in
if (TEST_MODE) {
  console.log('🧪 Running in TEST MODE - Discord bot features will be simulated');
} else {
  console.log('🔵 Running in PRODUCTION MODE - Using real Discord bot');
}

if (process.env.DISCORD_BOT_TOKEN && !TEST_MODE) {
  console.log('Connecting to Discord with provided token...');
  client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => {
      console.log('✅ Discord bot connected successfully!');
    })
    .catch(err => {
      console.error('❌ Failed to login to Discord:', err.message);
    });

  client.on('ready', () => {
    console.log(`Discord bot logged in as ${client.user.tag}`);
    discordReady = true;
  });

  client.on('error', (error) => {
    console.error('Discord client error:', error);
  });
} else {
  if (TEST_MODE) {
    console.log('🧪 Running in TEST MODE - Discord bot features will be simulated');
    // Mock Discord functionality for testing
    discordReady = true;
  } else {
    console.warn('DISCORD_BOT_TOKEN not found in environment variables. Discord bot features will be disabled.');
  }
}

// Rate limiting middleware to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all Discord webhook endpoints
app.use('/webhook', apiLimiter);

// Parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Store processed message IDs to avoid duplicates
const processedMessages = new Set();
// Maximum number of processed messages to remember (to prevent memory leaks)
const MAX_PROCESSED_MESSAGES = 1000;

// Configuration (would be moved to environment variables or config file in production)
const DASHBOARD_API_URL = '/api/leads'; // Endpoint to send leads to

// Keywords and categories for chef service lead detection
const keywords = {
  serviceTerms: [
    'chef', 'dinner', 'book', 'reservation', 'menu', 'private cooking', 
    'custom meal', 'event', 'catering', 'cook for us', 'pricing', 'meal', 
    'food for group', 'come cook', 'come over', 'come to our', 'cooking service',
    'hire you', 'chef available', 'chef for hire', 'private meal', 'menu options',
    'need a chef', 'cooking'
  ],
  
  questionTerms: [
    'how much', 'how does it work', 'are you available', 'can you come to',
    'how far in advance', 'what do you serve', 'do you travel',
    'what\'s your rate', 'how it works', 'can you make', 'how many people',
    'do you do', 'can you do', 'do you offer'
  ],
  
  locationTerms: [
    'airbnb', 'come to', 'at home', 'travel to', 'maine', 'vacation', 'rental',
    'house', 'condo', 'cabin', 'location'
  ],
  
  dateTerms: [
    'available', 'free', 'date', 'tonight', 'tomorrow', 'weekend',
    'next week', 'this friday', 'saturday', 'sunday'
  ],
  
  dietaryTerms: [
    'vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'allergies',
    'keto', 'paleo', 'pescatarian', 'halal', 'kosher'
  ],
  
  eventTerms: [
    'birthday', 'anniversary', 'celebration', 'party', 'gathering',
    'wedding', 'proposal', 'special occasion', 'graduation'
  ],
  
  cannabisTerms: [
    'edibles', 'cannabis', 'weed dinner', 'thc', 'cbd', 'infused'
  ],
  
  spamTerms: [
    'click here', 'unsubscribe', 'buy now', 'limited time', 'offer',
    'warranty', 'insurance', 'discount', 'prize', 'won', 'crypto', 'bitcoin',
    'investment', 'loan', 'credit score', 'free money', 'make money',
    'earn from home', 'work from home', 'marketing', 'subscribe'
  ]
};

/**
 * Evaluates an SMS message to determine if it's a potential chef service lead
 * @param {string} text - The message text to evaluate
 * @returns {object} Evaluation results including score, matched keywords, etc.
 */
function evaluateMessage(text) {
  if (!text || text.trim().length === 0) {
    return { 
      score: 0, 
      matchedKeywords: [], 
      matchedCategories: [],
      shouldForward: false, 
      filterReason: 'empty message' 
    };
  }
  
  const textLower = text.toLowerCase();
  let totalScore = 0;
  let shouldForward = false;
  let filterReason = '';
  
  // Check if message contains spam indicators
  const containsSpam = keywords.spamTerms.some(term => textLower.includes(term.toLowerCase()));
  if (containsSpam) {
    return {
      score: 0,
      matchedKeywords: [],
      matchedCategories: [],
      shouldForward: false,
      filterReason: 'contains spam keywords'
    };
  }
  
  // Initialize matched keywords tracking
  const matchedKeywordsMap = {};
  const allMatchedKeywords = [];
  
  // Define category weights for scoring
  const categoryWeights = {
    serviceTerms: 0.3,
    questionTerms: 0.2,
    locationTerms: 0.15,
    dateTerms: 0.15,
    dietaryTerms: 0.1,
    eventTerms: 0.15,
    cannabisTerms: 0.05
  };
  
  // Search for keywords in each category
  Object.keys(keywords).forEach(category => {
    if (category === 'spamTerms') return; // Skip spam terms as we already checked
    
    const categoryKeywords = keywords[category];
    const matched = categoryKeywords.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    );
    
    if (matched.length > 0) {
      matchedKeywordsMap[category] = matched;
      allMatchedKeywords.push(...matched);
      
      // Calculate score contribution from this category
      // The more matches in a category, the higher the score, with diminishing returns
      const categoryMatches = Math.min(matched.length, 3); // Cap at 3 matches per category
      const categoryScore = categoryWeights[category] * (categoryMatches / 3);
      totalScore += categoryScore;
    }
  });
  
  // Apply special bonuses for certain combinations
  
  // Bonus for having both service terms and question terms (strong intent)
  if (matchedKeywordsMap.serviceTerms && matchedKeywordsMap.questionTerms) {
    totalScore += 0.2;
  }
  
  // Bonus for having both service terms and location/date (planning)
  if (matchedKeywordsMap.serviceTerms && 
      (matchedKeywordsMap.locationTerms || matchedKeywordsMap.dateTerms)) {
    totalScore += 0.15;
  }
  
  // Bonus for specific high-intent phrases
  const highIntentPhrases = [
    'interested in hiring',
    'looking to book',
    'need a chef',
    'want to hire',
    'chef services',
    'available for'
  ];
  
  for (const phrase of highIntentPhrases) {
    if (textLower.includes(phrase)) {
      totalScore += 0.2;
      allMatchedKeywords.push(phrase);
      break; // Only apply this bonus once
    }
  }
  
  // Cap the score at 1.0
  totalScore = Math.min(totalScore, 1.0);
  
  // Round to 2 decimal places for cleaner display
  totalScore = Math.round(totalScore * 100) / 100;
  
  // Special handling for very short messages
  const wordCount = text.split(/\s+/).length;
  if (wordCount <= 5) {
    // For very short messages, require stronger signals
    if (totalScore < 0.4 && !matchedKeywordsMap.serviceTerms) {
      filterReason = 'short message without strong chef-related terms';
      totalScore = Math.max(0.05, totalScore); // Minimum score of 0.05 if any matches
    }
  }
  
  // Decision on forwarding based on confidence score
  shouldForward = totalScore >= 0.1; // Very low threshold as requested
  
  if (!shouldForward) {
    filterReason = filterReason || 'confidence score below threshold';
  }
  
  return {
    score: totalScore,
    matchedKeywords: allMatchedKeywords,
    matchedCategories: Object.keys(matchedKeywordsMap),
    shouldForward,
    filterReason
  };
}

/**
 * Processes a Discord message that contains an SMS from Tasker
 * @param {object} message - The Discord message to process
 * @returns {object} Processing results
 */
function processSmsMessage(message) {
  // Guard against empty or invalid messages
  if (!message || !message.content) {
    console.log('Received empty or invalid message');
    return { processed: false, reason: 'invalid message format' };
  }
  
  // Prevent duplicate processing
  if (processedMessages.has(message.id)) {
    return { processed: false, reason: 'duplicate message' };
  }
  
  // Add to processed set (with size management)
  processedMessages.add(message.id);
  if (processedMessages.size > MAX_PROCESSED_MESSAGES) {
    // Remove oldest entries when we hit the limit
    const iterator = processedMessages.values();
    const toRemove = processedMessages.size - MAX_PROCESSED_MESSAGES;
    for (let i = 0; i < toRemove; i++) {
      processedMessages.delete(iterator.next().value);
    }
  }
  
  // Extract message content
  const { content, timestamp, id } = message;
  
  // Extract sender info if present (for future use)
  // Format might be "From: [Sender] - Message content" or just "Message content"
  let sender = 'Unknown';
  let messageText = content;
  
  const fromMatch = content.match(/^From: (.+?) - (.*)/i);
  if (fromMatch) {
    sender = fromMatch[1].trim();
    messageText = fromMatch[2].trim();
  }
  
  // Evaluate the message
  const { score, matchedKeywords, matchedCategories, shouldForward, filterReason } = 
    evaluateMessage(messageText);
  
  // Log the processing results
  console.log(`[SMS Lead Detection] Message: "${messageText.substring(0, 50)}..." | Score: ${score} | Forward: ${shouldForward}`);
  if (matchedKeywords.length > 0) {
    console.log(`[SMS Lead Detection] Matched Keywords: ${matchedKeywords.join(', ')}`);
  }
  if (matchedCategories.length > 0) {
    console.log(`[SMS Lead Detection] Categories: ${matchedCategories.join(', ')}`);
  }
  if (!shouldForward) {
    console.log(`[SMS Lead Detection] Filtered: ${filterReason}`);
  }
  
  // Determine message type
  let messageType = 'general';
  if (matchedCategories.includes('serviceTerms')) {
    messageType = 'lead';
  } else if (matchedCategories.includes('questionTerms')) {
    messageType = 'inquiry';
  }
  
  return {
    processed: true,
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
 * Formats a lead summary for Discord replies
 * @param {object} leadData - Data about the lead
 * @returns {object} Formatted embed message for Discord
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
  const embed = new EmbedBuilder()
    .setColor(confidenceColor)
    .setTitle(`New Lead Detected: ${confidenceLevel} Confidence (${Math.round(leadData.score * 100)}%)`)
    .setDescription(`A new potential lead has been detected from SMS`)
    .addFields(
      { name: 'From', value: leadData.sender || 'Unknown', inline: true },
      { name: 'Type', value: leadData.messageType || 'general', inline: true },
      { name: 'Score', value: `${leadData.score.toFixed(2)} (${confidenceLevel})`, inline: true },
      { name: 'Matched Keywords', value: keywordsText },
      { name: 'Categories', value: categoriesText },
      { name: 'Next Steps', value: 'This lead has been added to your dashboard for follow up.' }
    )
    .setTimestamp(leadData.timestamp ? new Date(leadData.timestamp) : new Date())
    .setFooter({ text: `Lead ID: ${leadData.messageId || 'Unknown'}` });
    
  return embed;
}

/**
 * Sends a reply to the Discord channel where the SMS was received
 * @param {object} leadData - Data about the lead
 * @returns {Promise<object>} The sent message(s) or error info
 */
async function replyToDiscord(leadData) {
  // Skip if Discord bot is not ready or no messageId
  if (!discordReady || !leadData.messageId) {
    console.log('[Discord] Cannot reply - bot not ready or missing messageId');
    return { success: false, reason: 'Discord bot not ready or missing messageId' };
  }
  
  // In test mode, simulate Discord replies
  if (TEST_MODE) {
    const summaryEmbed = formatLeadSummary(leadData);
    
    console.log('\n===== SIMULATED DISCORD REPLY =====');
    console.log('Reply to message ID:', leadData.messageId);
    console.log('Original message:', leadData.content);
    console.log('\nEmbed Title:', summaryEmbed.data.title);
    console.log('Embed Description:', summaryEmbed.data.description);
    
    // Display fields
    if (summaryEmbed.data.fields) {
      console.log('\nEmbed Fields:');
      summaryEmbed.data.fields.forEach(field => {
        console.log(`- ${field.name}: ${field.value}`);
      });
    }
    console.log('=================================\n');
    
    return {
      success: true,
      messageId: `test-reply-${Date.now()}`,
      channelId: 'test-channel'
    };
  }
  
  try {
    // Find the channel that has this message
    const channels = client.channels.cache;
    let targetChannel = null;
    let originalMessage = null;
    
    // This approach assumes the bot has access to message history
    // and the message is in a channel the bot can access
    for (const [id, channel] of channels) {
      if (channel.isTextBased()) {
        try {
          const message = await channel.messages.fetch(leadData.messageId);
          if (message) {
            targetChannel = channel;
            originalMessage = message;
            break;
          }
        } catch (err) {
          // Message not in this channel, continue searching
        }
      }
    }
    
    if (!targetChannel) {
      console.log(`[Discord] Couldn't find message ${leadData.messageId} in any accessible channel`);
      return { success: false, reason: 'Message not found in accessible channels' };
    }
    
    // Format the lead summary
    const summaryEmbed = formatLeadSummary(leadData);
    
    // Reply with both original message (optional) and formatted summary
    const sentMessage = await targetChannel.send({
      content: 'I detected a potential lead from this SMS message:',
      embeds: [summaryEmbed],
      reply: { messageReference: originalMessage.id, failIfNotExists: false }
    });
    
    console.log(`[Discord] Sent reply to message ${leadData.messageId} in channel ${targetChannel.name}`);
    
    return { 
      success: true, 
      messageId: sentMessage.id,
      channelId: targetChannel.id
    };
  } catch (error) {
    console.error('[Discord] Error sending reply:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Forwards a qualified lead to the dashboard API
 * @param {object} leadData - Data about the lead to forward
 * @returns {Promise} Promise resolving with the API response
 */
async function sendToDashboard(leadData) {
  try {
    const payload = {
      source: "SMS via Discord",
      sender: leadData.sender,
      timestamp: leadData.timestamp,
      rawMessage: leadData.content,
      keywords: leadData.matchedKeywords,
      confidence: leadData.score,
      messageType: leadData.messageType
    };
    
    // Add Discord message reference to the payload
    payload.discordMessageId = leadData.messageId;
    payload.discordReplyId = leadData.replyId; // If we have a reply ID from Discord bot
    
    // Use either direct API call or localStorage based on app structure
    if (typeof window !== 'undefined' && window.localStorage) {
      // Browser environment - use localStorage API
      const existingLeads = JSON.parse(localStorage.getItem('chef_leads_archive')) || { leads: [], version: '1.0' };
      const newLead = {
        id: `sms-${Date.now()}`,
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isArchived: false,
        source: "SMS via Discord",
        status: "New"
      };
      
      existingLeads.leads.push(newLead);
      localStorage.setItem('chef_leads_archive', JSON.stringify(existingLeads));
      console.log('[SMS Lead] Added to local storage:', newLead.id);
      return { success: true, leadId: newLead.id };
    } else {
      // Server environment - use direct API call
      const response = await axios.post(DASHBOARD_API_URL, payload);
      console.log('[SMS Lead] Forwarded to dashboard API:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('[SMS Lead] Error forwarding to dashboard:', error.message);
    // Implement retry logic here if needed
    throw error;
  }
}

/**
 * Discord webhook endpoint that receives messages from Tasker
 */
app.post('/webhook/discord-sms', async (req, res) => {
  try {
    const message = req.body;
    
    // Basic validation
    if (!message || !message.content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }
    
    // Process the SMS message
    const processResult = processSmsMessage(message);
    
    // If message should be forwarded to dashboard
    if (processResult.shouldForward) {
      try {
        // Send reply to Discord if bot is available
        if (discordReady) {
          const replyResult = await replyToDiscord(processResult);
          if (replyResult.success) {
            // Add the reply ID to the process result for tracking
            processResult.replyId = replyResult.messageId;
          }
        }
        
        // Forward to dashboard with Discord message references
        await sendToDashboard(processResult);
      } catch (forwardError) {
        console.error('Error forwarding lead:', forwardError);
        // Continue processing despite forwarding error
      }
    }
    
    // Always return success to Discord to avoid retries
    return res.status(200).json({ 
      success: true, 
      processed: processResult.processed,
      forwarded: processResult.shouldForward,
      score: processResult.score
    });
  } catch (error) {
    console.error('Error processing Discord webhook:', error);
    // Always return success to Discord to avoid retries
    return res.status(200).json({ 
      success: true, 
      processed: false,
      error: error.message 
    });
  }
});

/**
 * Endpoint to manually flag a message as lead or not-lead
 */
app.post('/webhook/discord-sms/feedback', async (req, res) => {
  try {
    const { messageId, isLead, feedback } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required' });
    }
    
    // Here you would implement logic to record the feedback for future tuning
    console.log(`[Feedback] Message ${messageId} marked as ${isLead ? 'lead' : 'not lead'}: ${feedback || 'No additional feedback'}`);
    
    // In a real implementation, you would store this feedback in a database
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Discord SMS Monitor' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Discord SMS Monitor running on port ${PORT}`);
  console.log(`Webhook URL: http://your-server:${PORT}/webhook/discord-sms`);
});

module.exports = app;
