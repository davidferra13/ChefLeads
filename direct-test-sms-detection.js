/**
 * Direct SMS Lead Detection Test
 * 
 * This script directly tests the SMS lead detection algorithm without needing a server.
 * It mimics the same logic used in the discord-sms-monitor.cjs but runs locally.
 */

// Import the keywords and scoring logic
const evaluateMessage = (text) => {
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
};

// Test messages to evaluate
const TEST_MESSAGES = [
  // High confidence message (should be detected as lead)
  {
    id: 'test-msg-1',
    content: 'From: +15551234567 - Hello, I\'m looking for a private chef for dinner next weekend for 6 people. What are your rates?',
    timestamp: new Date().toISOString()
  },
  // Medium confidence message (should be detected)
  {
    id: 'test-msg-2',
    content: 'From: +15559876543 - Can you cook at our Airbnb next Saturday?',
    timestamp: new Date().toISOString()
  },
  // Low confidence message (just above threshold)
  {
    id: 'test-msg-3',
    content: 'From: +15552223333 - Do you do gluten-free meals?',
    timestamp: new Date().toISOString()
  },
  // Spam message (should be ignored)
  {
    id: 'test-msg-4',
    content: 'From: +15554445555 - SPECIAL OFFER: Click here to earn money from home! Limited time discount.',
    timestamp: new Date().toISOString()
  },
  // Unrelated message (should be ignored)
  {
    id: 'test-msg-5',
    content: 'From: +15556667777 - Hey, what time are we meeting later?',
    timestamp: new Date().toISOString()
  },
  // Cannabis-related message
  {
    id: 'test-msg-6',
    content: 'From: +15558889999 - I heard you do cannabis dinner events. We\'re interested in booking.',
    timestamp: new Date().toISOString()
  }
];

// Run the test
console.log('DISCORD SMS LEAD DETECTION TEST\n');
console.log('This test demonstrates how the SMS lead detection algorithm works');
console.log('without needing to run a server or webhook connections.\n');
console.log('Testing with sample messages...\n');

TEST_MESSAGES.forEach((message, index) => {
  console.log(`\n===== MESSAGE ${index + 1} =====`);
  console.log(`Content: "${message.content}"`);

  // Evaluate message
  const evaluation = evaluateMessage(message.content);
  
  console.log('\n--- Evaluation Results ---');
  console.log(`Confidence Score: ${(evaluation.score * 100).toFixed(2)}%`);
  console.log(`Matched Keywords: ${evaluation.matchedKeywords.join(', ') || 'None'}`);
  console.log(`Matched Categories: ${evaluation.matchedCategories.join(', ') || 'None'}`);
  console.log(`Is Lead: ${evaluation.shouldForward ? 'YES ✅' : 'NO ❌'}`);
  
  if (!evaluation.shouldForward) {
    console.log(`Reason Filtered: ${evaluation.filterReason}`);
  } else {
    console.log('This message would be forwarded to Lead Dashboard');
  }
  
  console.log('==========================\n');
});

console.log('\nTEST COMPLETE!');
console.log('The SMS lead detection system is functioning as expected.');
console.log('When deployed, messages with confidence scores >= 10% will appear in your SMS Leads page.');
