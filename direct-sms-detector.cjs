/**
 * Direct SMS Lead Detector
 * 
 * A simple command-line script that processes SMS messages directly
 * without requiring a server or other dependencies
 */

// Required for ANSI color output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// Test message to process
const testMessages = [
  'From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates?',
  'From: +15552223333 - Can you cook for our dinner this weekend?',
  'From: +15559876543 - Hey, just checking if we\'re still on for tomorrow.'
];

// Lead detection keywords and categories - using your existing configuration
const LEAD_KEYWORDS = {
  serviceTerms: ['chef', 'cook', 'cooking', 'catering', 'meal', 'dinner', 'food', 'menu', 'dish'],
  dateTerms: ['tonight', 'tomorrow', 'weekend', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'next week', 'this week', 'date', 'day'],
  eventTerms: ['party', 'event', 'gathering', 'celebration', 'anniversary', 'birthday', 'wedding', 'reception', 'holiday', 'dinner party'],
  bookingTerms: ['book', 'booking', 'reserve', 'reservation', 'schedule', 'availability', 'available', 'hire', 'hired'],
  inquiryTerms: ['interested', 'rates', 'pricing', 'cost', 'quote', 'how much', 'price', 'charge', 'fee'],
  personTerms: ['people', 'guests', 'persons', 'adults', 'children', 'family'],
  spamTerms: ['unsubscribe', 'spam', 'scam', 'offer', 'discount', 'sale', 'promotion', 'marketing', 'advertisement']
};

/**
 * Process an SMS message for lead detection
 * @param {string} messageText - The SMS message text
 * @returns {object} Lead detection results
 */
function processMessage(messageText) {
  // Extract sender info (common format: "From: +1234567890 - Message content")
  const senderMatch = messageText.match(/From:\s+(\+\d+)\s+-\s+(.*)/i);
  let sender = 'Unknown';
  let content = messageText;
  
  if (senderMatch) {
    sender = senderMatch[1];
    content = senderMatch[2].trim();
  }
  
  // Check for keywords in message
  const matchedKeywords = [];
  const matchedCategories = [];
  let score = 0;
  
  // Normalize text for better matching
  const normalizedText = content.toLowerCase();
  
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
  const lengthFactor = Math.min(content.length / 200, 1) * 0.1;
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
  
  // Determine classification
  let classification = 'ignored';
  let confidenceLevel = 'Low';
  
  if (score >= 0.7) {
    classification = 'lead';
    confidenceLevel = 'High';
  } else if (score >= 0.4) {
    classification = 'potential_lead';
    confidenceLevel = 'Medium';
  } else if (score >= 0.3) {
    classification = 'follow_up';
    confidenceLevel = 'Low';
  }
  
  // Format categories for display
  const formattedCategories = matchedCategories.map(cat => 
    cat.replace('Terms', '').charAt(0).toUpperCase() + cat.replace('Terms', '').slice(1)
  );
  
  return {
    sender,
    content,
    score,
    confidenceLevel,
    classification,
    matchedKeywords,
    categories: formattedCategories
  };
}

/**
 * Print a visual representation of the lead detection results
 * @param {object} result - Lead detection results
 */
function printResults(result) {
  console.log('\n' + '='.repeat(60));
  
  // Print message content
  console.log(`${colors.bright}MESSAGE:${colors.reset}`);
  console.log(`From: ${colors.cyan}${result.sender}${colors.reset}`);
  console.log(`"${result.content}"`);
  console.log('');
  
  // Score color based on confidence
  let scoreColor = colors.red;
  if (result.score >= 0.7) {
    scoreColor = colors.green;
  } else if (result.score >= 0.4) {
    scoreColor = colors.yellow;
  }
  
  // Print analysis results
  console.log(`${colors.bright}ANALYSIS:${colors.reset}`);
  console.log(`Confidence: ${scoreColor}${Math.round(result.score * 100)}% (${result.confidenceLevel})${colors.reset}`);
  
  // Classification
  let classColor = colors.red;
  if (result.classification === 'lead') {
    classColor = colors.green;
  } else if (result.classification === 'potential_lead') {
    classColor = colors.yellow;
  }
  console.log(`Classification: ${classColor}${result.classification.toUpperCase()}${colors.reset}`);
  
  // Categories
  if (result.categories.length > 0) {
    console.log(`Categories: ${colors.magenta}${result.categories.join(', ')}${colors.reset}`);
  } else {
    console.log(`Categories: ${colors.gray}None${colors.reset}`);
  }
  
  // Keywords
  if (result.matchedKeywords.length > 0) {
    console.log(`Keywords: ${colors.cyan}${result.matchedKeywords.join(', ')}${colors.reset}`);
  } else {
    console.log(`Keywords: ${colors.gray}None${colors.reset}`);
  }
}

/**
 * Process multiple messages
 */
function processTestMessages() {
  console.log('\n' + colors.bright + colors.magenta + '='.repeat(20) + ' SMS LEAD DETECTOR ' + '='.repeat(20) + colors.reset);
  
  testMessages.forEach((message, index) => {
    const result = processMessage(message);
    printResults(result);
    
    // Next steps
    if (result.classification === 'lead') {
      console.log(`\n${colors.green}${colors.bright}ACTION NEEDED:${colors.reset} High-confidence lead detected! Forward to sales team immediately.`);
    } else if (result.classification === 'potential_lead') {
      console.log(`\n${colors.yellow}ACTION NEEDED:${colors.reset} Potential lead - evaluate further before responding.`);
    } else {
      console.log(`\n${colors.gray}No action required - message does not appear to be a lead.${colors.reset}`);
    }
  });
  
  console.log('\n' + colors.bright + colors.magenta + '='.repeat(58) + colors.reset);
  console.log(`\nProcessed ${testMessages.length} messages`);
}

// Process the test messages
processTestMessages();

console.log('\n' + colors.bright + 'Additional Options:' + colors.reset);
console.log('- To process a custom message: node direct-sms-detector.cjs "your message here"');
console.log('- Edit the script to add your own test messages');

// Handle command line input if provided
if (process.argv.length > 2) {
  const customMessage = process.argv.slice(2).join(' ');
  console.log('\n' + colors.bright + colors.magenta + '='.repeat(20) + ' CUSTOM MESSAGE ' + '='.repeat(20) + colors.reset);
  const result = processMessage(customMessage);
  printResults(result);
}
