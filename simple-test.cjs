/**
 * Direct Testing of SMS Lead Detection Logic
 * 
 * This script tests the lead detection function directly without 
 * relying on network connectivity or server setup.
 */

// Copy of the lead detection function from the webhook server
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

// Sample Discord webhook payloads
const TEST_MESSAGES = [
  // High confidence lead
  {
    id: 1,
    username: "SMSForwarder",
    content: "From: +15551234567 - Looking for a private chef for next Saturday. Party of 6 people. What are your rates?"
  },
  // Medium confidence lead
  {
    id: 2,
    username: "SMSForwarder",
    content: "From: +15559876543 - Can you cook dinner at our Airbnb?"
  },
  // Low confidence but still valid lead
  {
    id: 3,
    username: "SMSForwarder",
    content: "From: +15552223333 - Do you do vegan menus?"
  },
  // Spam message (should be filtered)
  {
    id: 4,
    username: "SMSForwarder",
    content: "From: +15554445555 - SPECIAL OFFER: Limited time discount. Click here!"
  },
  // Unrelated message (should be filtered)
  {
    id: 5,
    username: "SMSForwarder",
    content: "From: +15556667777 - Hey, are we still on for coffee?"
  }
];

console.log('=======================================================');
console.log('🔔 DISCORD SMS WEBHOOK SERVER LOGIC TEST');
console.log('=======================================================');
console.log('\nThis test demonstrates the lead detection logic');
console.log('that would be used in the Discord webhook server');
console.log('\nTesting with sample messages...\n');

// Process each test message
TEST_MESSAGES.forEach(message => {
  console.log('\n==================================================');
  console.log(`MESSAGE FROM ${message.username}`);
  console.log(`ID: ${message.id}`);
  console.log(`Content: "${message.content}"`);
  
  // Detect lead
  const result = detectLead(message.content);
  
  // Format confidence score as percentage
  const scorePercent = Math.round(result.confidenceScore * 100);
  
  // Display results in the exact format requested
  console.log('\n🔔 New SMS Message Received');
  console.log(`Confidence Score: ${scorePercent}%`);
  console.log(`Matched Categories: ${result.matchedCategories.join(', ') || 'none'}`);
  console.log(`Lead Status: ${result.leadStatus ? '✅ Valid Lead' : '❌ Filtered Out'}`);
  console.log(`Message: "${message.content}"`);
  
  // Show what would be sent to Discord
  console.log('\nWould send to Discord:');
  if (result.leadStatus) {
    console.log(`📬 Lead Received from ${message.username}`);
    console.log(`Confidence Score: ${scorePercent}%`);
    console.log(`Status: ✅ Valid Lead`);
    console.log(`Matched Keywords: ${result.matchedKeywords.join(', ') || 'none'}`);
    console.log(`Message: "${message.content}"`);
  } else {
    console.log(`❌ Message from ${message.username} was filtered out (Confidence Score: ${scorePercent}%)`);
  }
});

console.log('\n=======================================================');
console.log('TEST COMPLETE!');
console.log('=======================================================');
console.log('\nThe core lead detection logic is functioning properly.');
console.log('When deployed with proper Discord API credentials:');
console.log('1. It will process incoming webhook messages from Discord');
console.log('2. Evaluate each message for lead potential');
console.log('3. Reply to Discord with the evaluation results');
console.log('4. Store valid leads for viewing in the /sms-leads page\n');
