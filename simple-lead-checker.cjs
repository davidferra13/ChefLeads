/**
 * Simple SMS Lead Checker
 * 
 * Quickly check if SMS messages contain chef-related leads
 * No server needed, works directly in console
 */

// Lead detection keywords in categories
const LEAD_CONFIG = {
  serviceTerms: ['chef', 'cook', 'cooking', 'catering', 'meal', 'dinner', 'food', 'menu', 'dish'],
  eventTerms: ['party', 'event', 'gathering', 'celebration', 'birthday', 'wedding', 'holiday', 'dinner party'],
  bookingTerms: ['book', 'reserve', 'schedule', 'availability', 'available', 'hire'],
  inquiryTerms: ['interested', 'rates', 'pricing', 'cost', 'quote', 'price'],
  personTerms: ['people', 'guests', 'persons', 'adults', 'children', 'family'],
  spamTerms: ['unsubscribe', 'spam', 'scam', 'offer', 'discount', 'sale', 'promotion']
};

// Test messages
const testMessages = [
  // High confidence lead
  "From: +15551234567 - Hi, I need a private chef for a dinner party next Saturday for 10 people. What are your rates?",
  
  // Medium confidence
  "From: +15552223333 - Can you cook dinner for us this weekend?",
  
  // Not a lead
  "From: +15553334444 - Hey, just checking in about that thing.",
  
  // Custom message (if provided via command line)
  ...(process.argv.length > 2 ? [process.argv.slice(2).join(' ')] : [])
];

// Process a single message
function checkForLead(message) {
  const matches = {};
  let score = 0;
  
  // Check each category
  Object.entries(LEAD_CONFIG).forEach(([category, keywords]) => {
    const categoryMatches = [];
    const normalizedMessage = message.toLowerCase();
    
    keywords.forEach(keyword => {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        categoryMatches.push(keyword);
        
        // Score differently based on category
        if (category === 'spamTerms') {
          score -= 0.2;  // Penalty for spam terms
        } else if (category === 'serviceTerms') {
          score += 0.2;  // Bonus for chef/cooking terms
        } else {
          score += 0.1;  // Standard score for other matches
        }
      }
    });
    
    if (categoryMatches.length > 0) {
      matches[category] = categoryMatches;
    }
  });
  
  // Message length factor (longer messages often have more detail = better leads)
  const lengthFactor = Math.min(message.length / 200, 1) * 0.1;
  score += lengthFactor;
  
  // Bonus for having matches in multiple important categories
  if (matches.serviceTerms && (matches.bookingTerms || matches.inquiryTerms)) {
    score += 0.2;  // Big bonus for having both service terms AND booking/inquiry terms
  }
  
  // Cap score between 0 and 1
  score = Math.max(0, Math.min(1, score));
  
  // Determine confidence level
  let confidence = 'Low';
  if (score >= 0.7) confidence = 'High';
  else if (score >= 0.4) confidence = 'Medium';
  
  // Format results
  return {
    isLead: score >= 0.4,  // Consider medium+ confidence as leads
    score: score.toFixed(2),
    confidence,
    matches
  };
}

// Display results
console.log("SMS LEAD CHECKER\n");

testMessages.forEach((message, index) => {
  console.log(`----- MESSAGE ${index + 1} -----`);
  console.log(message);
  console.log("");
  
  const result = checkForLead(message);
  
  console.log(`RESULT: ${result.isLead ? "LEAD DETECTED!" : "Not a lead"}`);
  console.log(`Score: ${result.score} (${result.confidence} confidence)`);
  
  // Show matching keywords by category
  if (Object.keys(result.matches).length > 0) {
    console.log("\nMatched Keywords:");
    Object.entries(result.matches).forEach(([category, keywords]) => {
      const readableCategory = category.replace('Terms', '');
      console.log(`- ${readableCategory}: ${keywords.join(', ')}`);
    });
  }
  
  console.log("\n");
});

console.log("To check a specific message: node simple-lead-checker.cjs \"Your message here\"");
