/**
 * Discord SMS Webhook Server
 * 
 * This server receives Discord webhook messages containing SMS content,
 * evaluates them for chef-related leads, and replies to Discord with the results.
 */

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(bodyParser.json());

// Rate limiting middleware to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/webhook', limiter);

// In-memory store for processed messages (to avoid duplicates)
const processedMessages = new Set();
// Cap size to prevent memory leaks
const MAX_PROCESSED_SET_SIZE = 1000;

// In-memory store of recent leads for the SMS leads page
const smsLeads = [];
const MAX_SMS_LEADS = 200;

// Keyword-based lead detection function
function detectLead(text) {
  if (!text || text.trim().length === 0) {
    return { 
      confidenceScore: 0, 
      matchedKeywords: [], 
      matchedCategories: [],
      leadStatus: false 
    };
  }
  
  const textLower = text.toLowerCase();
  
  // Keyword categories with weights
  const keywords = {
    serviceTerms: {
      weight: 1.0,
      words: ['chef', 'dinner', 'cook', 'meal', 'food', 'catering', 'menu', 'book', 'reservation', 'private chef']
    },
    questionTerms: {
      weight: 0.8,
      words: ['how much', 'cost', 'price', 'rate', 'available', 'do you', 'can you', 'would you', 'when can']
    },
    locationTerms: {
      weight: 0.7,
      words: ['home', 'house', 'airbnb', 'apartment', 'condo', 'at my', 'our place', 'come to']
    },
    dateTerms: {
      weight: 0.7,
      words: ['tonight', 'tomorrow', 'weekend', 'friday', 'saturday', 'sunday', 'next week', 'date']
    },
    dietaryTerms: {
      weight: 0.6,
      words: ['vegan', 'vegetarian', 'gluten', 'dairy', 'allergies', 'organic', 'diet']
    },
    eventTerms: {
      weight: 0.7,
      words: ['party', 'birthday', 'anniversary', 'celebration', 'event', 'gathering']
    },
    cannabisTerms: {
      weight: 0.8,
      words: ['cannabis', 'weed', 'marijuana', 'thc', 'cbd', 'edibles', '420']
    }
  };
  
  // Track matched keywords by category
  const matchedKeywordsMap = {};
  
  // Calculate score based on keyword matches
  let totalScore = 0;
  
  // Check for keyword matches in each category
  Object.entries(keywords).forEach(([category, { weight, words }]) => {
    const matched = words.filter(word => textLower.includes(word));
    if (matched.length > 0) {
      matchedKeywordsMap[category] = matched;
      totalScore += weight * (matched.length / words.length);
    }
  });

  // Apply bonuses for strong indicators
  if (matchedKeywordsMap.serviceTerms && matchedKeywordsMap.questionTerms) {
    totalScore *= 1.3; // 30% bonus for service + question
  }
  
  if (matchedKeywordsMap.serviceTerms && matchedKeywordsMap.dateTerms) {
    totalScore *= 1.5; // 50% bonus for service + date (strong booking intent)
  }

  // Filter out spam
  const spamPatterns = [
    'make money', 'click here', 'special offer', 'discount', 'limited time',
    'buy now', 'free trial', 'unsubscribe'
  ];
  
  const isSpam = spamPatterns.some(pattern => textLower.includes(pattern));
  
  // Determine if we should forward the message
  const threshold = 0.1;
  const leadStatus = totalScore >= threshold && !isSpam;
  
  // Prepare matched keywords and categories
  const matchedKeywords = Object.values(matchedKeywordsMap).flat();
  const matchedCategories = Object.keys(matchedKeywordsMap);
  
  return {
    confidenceScore: Math.min(1.0, totalScore),
    matchedKeywords,
    matchedCategories,
    leadStatus
  };
}

// Send reply to Discord channel
async function replyToDiscord(channelId, content) {
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.error('DISCORD_BOT_TOKEN not found in environment variables');
      return;
    }
    
    await axios.post(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      { content },
      {
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );
    console.log('Reply sent to Discord successfully');
  } catch (error) {
    console.error('Error sending reply to Discord:', error.message);
    if (error.response) {
      console.error('Discord API response:', error.response.data);
    }
  }
}

// Add lead to in-memory store
function addSmsLead(message, username, leadData) {
  const lead = {
    id: `sms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    source: 'SMS via Discord',
    message,
    username,
    timestamp: new Date().toISOString(),
    confidenceScore: leadData.confidenceScore,
    matchedCategories: leadData.matchedCategories,
    matchedKeywords: leadData.matchedKeywords,
    status: 'New',
    handled: false
  };
  
  smsLeads.unshift(lead); // Add to beginning of array
  
  // Limit size to prevent memory issues
  if (smsLeads.length > MAX_SMS_LEADS) {
    smsLeads.pop(); // Remove oldest
  }
  
  return lead;
}

// Webhook endpoint for receiving Discord messages
app.post('/webhook/discord-sms', async (req, res) => {
  try {
    // Extract data from request
    const { content, author, channel_id } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Missing message content' });
    }
    
    const username = author?.username || 'Unknown';
    
    // Skip duplicate messages
    if (processedMessages.has(content)) {
      return res.status(200).json({ status: 'skipped', message: 'Duplicate message' });
    }
    
    // Add to processed messages set
    processedMessages.add(content);
    
    // Limit size of processed messages set
    if (processedMessages.size > MAX_PROCESSED_SET_SIZE) {
      const iterator = processedMessages.values();
      processedMessages.delete(iterator.next().value);
    }
    
    // Detect lead
    const leadData = detectLead(content);
    const { confidenceScore, matchedCategories, matchedKeywords, leadStatus } = leadData;
    
    // Format confidence score as percentage
    const scorePercent = Math.round(confidenceScore * 100);
    
    // Log result to console
    console.log('\n🔔 New SMS Message Received');
    console.log(`Confidence Score: ${scorePercent}%`);
    console.log(`Matched Categories: ${matchedCategories.join(', ') || 'none'}`);
    console.log(`Lead Status: ${leadStatus ? '✅ Valid Lead' : '❌ Filtered Out'}`);
    console.log(`Message: "${content}"`);
    
    // Store lead if valid
    if (leadStatus) {
      addSmsLead(content, username, leadData);
    }
    
    // Prepare Discord reply
    let replyContent;
    
    if (leadStatus) {
      replyContent = `📬 Lead Received from ${username}\n` +
        `Confidence Score: ${scorePercent}%\n` +
        `Status: ✅ Valid Lead\n` +
        `Matched Keywords: ${matchedKeywords.join(', ') || 'none'}\n` +
        `Message: "${content}"`;
    } else {
      replyContent = `❌ Message from ${username} was filtered out (Confidence Score: ${scorePercent}%)`;
    }
    
    // Reply to Discord
    if (channel_id) {
      await replyToDiscord(channel_id, replyContent);
    }
    
    // Return success
    res.status(200).json({
      status: 'success',
      leadDetected: leadStatus,
      confidenceScore
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get SMS leads for the frontend
app.get('/api/sms-leads', (req, res) => {
  res.json(smsLeads);
});

// Start server
const PORT = process.env.DISCORD_MONITOR_PORT || 3005;
app.listen(PORT, () => {
  console.log(`Discord SMS Webhook Server running on port ${PORT}`);
  console.log(`Webhook URL: http://your-server:${PORT}/webhook/discord-sms`);
  console.log('Note: Add DISCORD_BOT_TOKEN to your .env file to enable Discord replies');
});

module.exports = app;
