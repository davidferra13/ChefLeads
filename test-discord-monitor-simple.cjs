/**
 * Simplified Discord SMS Monitor for Testing
 * 
 * This is a basic version of the monitor server that receives webhook
 * messages, evaluates them using our scoring algorithm, and shows results.
 */

const express = require('express');
const bodyParser = require('body-parser');

// Create Express app
const app = express();
app.use(bodyParser.json());

// Simplified version of the keyword scoring system
function evaluateMessage(text) {
  if (!text || text.trim().length === 0) {
    return { score: 0, matchedKeywords: [], shouldForward: false, filterReason: 'empty message' };
  }
  
  const textLower = text.toLowerCase();
  
  // Keyword categories with weights
  const keywords = {
    serviceTerms: {
      weight: 1.0,
      words: ['chef', 'dinner', 'cook', 'meal', 'food', 'catering', 'menu', 'book', 'reservation']
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
  const shouldForward = totalScore >= threshold && !isSpam;
  
  // Prepare return value with diagnostic info
  const allMatchedKeywords = Object.values(matchedKeywordsMap).flat();
  let filterReason = '';
  
  if (!shouldForward) {
    if (isSpam) {
      filterReason = 'spam detected';
    } else if (totalScore < threshold) {
      filterReason = 'confidence too low';
    }
  }
  
  return {
    score: Math.min(1.0, totalScore),
    matchedKeywords: allMatchedKeywords,
    matchedCategories: Object.keys(matchedKeywordsMap),
    shouldForward,
    filterReason
  };
}

// Webhook endpoint
app.post('/webhook/discord-sms', (req, res) => {
  console.log('\n======= NEW MESSAGE =======');
  console.log('Received webhook message:', req.body);
  
  // Extract the message content
  const messageContent = req.body.content || '';
  
  // Evaluate message
  const evaluation = evaluateMessage(messageContent);
  
  console.log('\n--- Evaluation Results ---');
  console.log(`Confidence Score: ${(evaluation.score * 100).toFixed(2)}%`);
  console.log(`Matched Keywords: ${evaluation.matchedKeywords.join(', ')}`);
  console.log(`Matched Categories: ${evaluation.matchedCategories.join(', ')}`);
  console.log(`Is Lead: ${evaluation.shouldForward ? 'YES' : 'NO'}`);
  
  if (!evaluation.shouldForward) {
    console.log(`Reason Filtered: ${evaluation.filterReason}`);
  } else {
    console.log('Message would be forwarded to Lead Dashboard');
  }
  
  // Always return success to avoid retries
  res.status(200).json({
    status: 'success',
    message: 'Webhook received',
    evaluation: evaluation
  });
});

// Start server
const PORT = 3005;
app.listen(PORT, () => {
  console.log(`Test Discord SMS Monitor running on port ${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook/discord-sms`);
});
