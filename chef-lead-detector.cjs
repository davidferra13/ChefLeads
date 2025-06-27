/**
 * Chef Lead Detector (Discord/SMS)
 * 
 * Simple, reliable lead detection for chef-related SMS messages
 * without requiring servers, tokens or external dependencies
 */

// Load sample messages from file if it exists, otherwise use built-in samples
let sampleMessages = [
  "From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates?",
  "From: +15552223333 - Do you cook for events? We have a gathering next week.",
  "From: +15554445555 - Can you provide your menu options for a wedding reception?",
  "From: +15556667777 - Just checking in about that thing we discussed last week.",
  "From: +15558889999 - UNSUBSCRIBE to stop receiving these promotional messages."
];

// Core lead detection configuration
const LEAD_DETECTION_CONFIG = {
  // Keyword categories with weights
  keywords: {
    chef: { 
      terms: ['chef', 'cook', 'cooking', 'catering', 'food service', 'culinary', 'personal chef'],
      weight: 0.3
    },
    event: { 
      terms: ['party', 'event', 'gathering', 'dinner party', 'reception', 'celebration', 'wedding', 'birthday', 'anniversary'],
      weight: 0.2
    },
    meal: { 
      terms: ['dinner', 'lunch', 'breakfast', 'brunch', 'meal', 'food', 'menu', 'dish', 'cuisine'],
      weight: 0.2
    },
    booking: { 
      terms: ['book', 'booking', 'schedule', 'reservation', 'available', 'availability', 'hire', 'date'],
      weight: 0.25
    },
    inquiry: { 
      terms: ['price', 'pricing', 'rate', 'rates', 'cost', 'quote', 'fee', 'charge', 'how much'],
      weight: 0.2
    },
    guests: { 
      terms: ['people', 'guests', 'persons', 'adults', 'kids', 'children', 'family', 'friends'],
      weight: 0.15
    },
    spam: { 
      terms: ['unsubscribe', 'spam', 'offer', 'discount', 'promotion', 'marketing', 'advertisement', 'sale'],
      weight: -0.5  // Negative weight for spam indicators
    }
  },
  
  // Threshold scores
  thresholds: {
    high: 0.65,
    medium: 0.4,
    low: 0.2
  },
  
  // Multi-category bonuses (applied when matches from multiple important categories are found)
  categoryBonuses: [
    { categories: ['chef', 'booking'], bonus: 0.2 },
    { categories: ['chef', 'inquiry'], bonus: 0.2 },
    { categories: ['event', 'booking'], bonus: 0.15 },
    { categories: ['meal', 'guests'], bonus: 0.1 }
  ]
};

/**
 * Process a message to detect if it contains a chef lead
 * @param {string} message - The message text to process
 * @returns {object} Detection results
 */
function detectLead(message) {
  // Extract sender info (often in format "From: +1234567890 - Message content")
  const senderMatch = message.match(/From:\s+(\+\d+)\s+-\s+(.*)/i);
  
  const messageData = {
    originalMessage: message,
    sender: senderMatch ? senderMatch[1] : 'Unknown',
    content: senderMatch ? senderMatch[2].trim() : message,
    timestamp: new Date().toISOString()
  };
  
  // Normalize text for matching
  const normalizedText = messageData.content.toLowerCase();
  
  // Track matched keywords by category
  const matches = {};
  let score = 0;
  
  // Check each keyword category
  Object.entries(LEAD_DETECTION_CONFIG.keywords).forEach(([category, config]) => {
    const categoryMatches = [];
    
    config.terms.forEach(term => {
      if (normalizedText.includes(term.toLowerCase())) {
        categoryMatches.push(term);
      }
    });
    
    if (categoryMatches.length > 0) {
      matches[category] = categoryMatches;
      
      // Add weighted score based on matches (diminishing returns for multiple matches in same category)
      const matchFactor = Math.min(categoryMatches.length, 3) / 3; // Cap at 3 matches
      score += config.weight * (0.7 + (matchFactor * 0.3)); // Base 70% of weight + up to 30% more for multiple matches
    }
  });
  
  // Add length-based bonus (longer messages with more detail often indicate higher quality leads)
  // Cap at 100 characters to avoid giving too much weight to very long messages
  const lengthBonus = Math.min(messageData.content.length, 100) / 100 * 0.1;
  score += lengthBonus;
  
  // Check for multi-category bonuses
  LEAD_DETECTION_CONFIG.categoryBonuses.forEach(({ categories, bonus }) => {
    if (categories.every(category => matches[category] && matches[category].length > 0)) {
      score += bonus;
    }
  });
  
  // Cap score at 1.0
  score = Math.min(Math.max(0, score), 1);
  
  // Determine confidence level based on thresholds
  let confidence = 'None';
  if (score >= LEAD_DETECTION_CONFIG.thresholds.high) {
    confidence = 'High';
  } else if (score >= LEAD_DETECTION_CONFIG.thresholds.medium) {
    confidence = 'Medium';
  } else if (score >= LEAD_DETECTION_CONFIG.thresholds.low) {
    confidence = 'Low';
  }
  
  // Determine if it's a lead based on score threshold
  const isLead = score >= LEAD_DETECTION_CONFIG.thresholds.medium;
  
  // Format the matched keywords for display
  const matchedKeywords = Object.entries(matches)
    .filter(([category]) => category !== 'spam') // Don't show spam terms as matched keywords
    .flatMap(([_, terms]) => terms);
  
  return {
    ...messageData,
    isLead,
    score,
    confidence,
    matchedKeywords,
    categoryMatches: matches,
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
}

/**
 * Format lead detection results for console display
 */
function formatResults(results) {
  const output = [];
  
  // Add header
  output.push('╔════════════════════════════════════════════════════════╗');
  output.push('║                   CHEF LEAD DETECTOR                   ║');
  output.push('╚════════════════════════════════════════════════════════╝');
  output.push('');
  
  // Process each result
  results.forEach((result, index) => {
    output.push(`┌─ MESSAGE ${index + 1} ${'─'.repeat(52 - String(index + 1).length)}┐`);
    output.push(`│ From: ${result.sender}`);
    output.push(`│ "${result.content}"`);
    output.push('│');
    
    // Add classification section with appropriate symbols
    const confidenceSymbol = result.isLead
      ? result.confidence === 'High' ? '✓✓✓' : result.confidence === 'Medium' ? '✓✓' : '✓'
      : '✗';
    
    output.push(`│ Classification: ${confidenceSymbol} ${result.isLead ? 'LEAD' : 'NOT A LEAD'} (${result.confidence} confidence)`);
    output.push(`│ Score: ${(result.score * 100).toFixed(0)}%`);
    
    // Add matched keywords if any
    if (result.matchedKeywords.length > 0) {
      // Limit to 5 keywords to avoid long lines
      const displayKeywords = result.matchedKeywords.slice(0, 5);
      const moreKeywords = result.matchedKeywords.length > 5 ? ` + ${result.matchedKeywords.length - 5} more` : '';
      output.push(`│ Keywords: ${displayKeywords.join(', ')}${moreKeywords}`);
    } else {
      output.push('│ Keywords: None');
    }
    
    // Add matched categories
    const categories = Object.keys(result.categoryMatches)
      .filter(cat => cat !== 'spam')
      .map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
    
    if (categories.length > 0) {
      output.push(`│ Categories: ${categories.join(', ')}`);
    }
    
    // Add spam warning if applicable
    if (result.categoryMatches.spam) {
      output.push('│ ⚠️ Warning: Contains spam indicators');
    }
    
    output.push('└' + '─'.repeat(60) + '┘');
    output.push('');
  });
  
  // Add summary
  const leadCount = results.filter(r => r.isLead).length;
  output.push(`${leadCount} lead(s) detected out of ${results.length} messages`);
  output.push('');
  output.push('Run with your own message:');
  output.push('node chef-lead-detector.cjs "Your message here"');
  
  return output.join('\n');
}

// Process command line arguments
if (process.argv.length > 2) {
  // Use the command line argument as the message
  const customMessage = process.argv.slice(2).join(' ');
  const result = detectLead(customMessage);
  console.log(formatResults([result]));
} else {
  // Process all sample messages
  const results = sampleMessages.map(detectLead);
  console.log(formatResults(results));
}

// Export for use in other modules if needed
module.exports = { detectLead, formatResults };
