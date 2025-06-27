/**
 * Discord SMS Lead Detection & Reply Demo
 * 
 * This script shows exactly how the enhanced Discord SMS monitor works
 * with the new reply functionality added to the existing system.
 */

// Simulate a high-confidence lead message
const leadMessage = {
  id: 'msg-12345',
  content: 'From: John Smith - Looking to hire a private chef for our anniversary dinner next weekend. We have 8 guests and would like to know your rates and menu options.',
  sender: 'John Smith',
  timestamp: new Date().toISOString()
};

// Clear console and show header
console.clear();
console.log('\n==========================================');
console.log('  DISCORD SMS LEAD DETECTION & REPLY DEMO');
console.log('==========================================\n');

// Show the incoming SMS message
console.log('1. INCOMING SMS MESSAGE TO DISCORD:');
console.log('------------------------------------------');
console.log(`Message ID: ${leadMessage.id}`);
console.log(`Content: "${leadMessage.content}"`);
console.log('------------------------------------------\n');

// Simulate processing time
setTimeout(() => {
  // Show the keyword analysis
  const { score, matchedKeywords, categories } = analyzeMessage(leadMessage.content);
  
  console.log('2. SMS LEAD DETECTION SYSTEM PROCESSING:');
  console.log('------------------------------------------');
  console.log(`Analyzing message for chef-related keywords...`);
  console.log(`Score: ${score.toFixed(2)} (High Confidence)`);
  console.log(`Matched Keywords: ${matchedKeywords.join(', ')}`);
  console.log(`Categories: ${categories.join(', ')}`);
  console.log(`Result: Lead detected! Forwarding to dashboard`);
  console.log('------------------------------------------\n');
  
  // Slight delay before showing the Discord reply
  setTimeout(() => {
    // Show the Discord reply with formatted lead summary
    console.log('3. DISCORD BOT AUTO-REPLY:');
    console.log('------------------------------------------');
    console.log('The bot replies in the same Discord channel:');
    console.log('\n> I detected a potential lead from this SMS message:\n');
    
    // Show the formatted embed reply
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ 🟢 NEW LEAD DETECTED: HIGH CONFIDENCE (85%) │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ A new potential lead has been detected  │');
    console.log('│                                         │');
    console.log('│ From:     John Smith                    │');
    console.log('│ Type:     lead                          │');
    console.log('│ Score:    0.85 (High)                   │');
    console.log('│                                         │');
    console.log('│ Matched Keywords:                       │');
    console.log('│ chef, hire, anniversary, dinner,        │');
    console.log('│ weekend, guests, rates, menu options    │');
    console.log('│                                         │');
    console.log('│ Categories:                             │');
    console.log('│ service, booking, event, date, inquiry  │');
    console.log('│                                         │');
    console.log('│ Next Steps:                             │');
    console.log('│ This lead has been added to your        │');
    console.log('│ dashboard for follow up.                │');
    console.log('│                                         │');
    console.log('│ Lead ID: msg-12345                      │');
    console.log('└─────────────────────────────────────────┘');
    console.log('------------------------------------------\n');
    
    // Show the data stored in the dashboard
    setTimeout(() => {
      console.log('4. LEAD STORED IN DASHBOARD:');
      console.log('------------------------------------------');
      console.log('Lead data stored with these connections:');
      console.log('- Original Discord Message ID: msg-12345');
      console.log('- Discord Reply Message ID: reply-67890');
      console.log('- Lead Type: SMS via Discord');
      console.log('- Confidence Score: 0.85');
      console.log('- Creation Date: ' + new Date().toISOString());
      console.log('------------------------------------------\n');
      
      // Final summary of enhanced functionality
      setTimeout(() => {
        console.log('SUMMARY OF ENHANCED DISCORD FUNCTIONALITY:');
        console.log('------------------------------------------');
        console.log('✓ SMS messages forwarded to Discord by Tasker');
        console.log('✓ Incoming messages analyzed for lead potential');
        console.log('✓ Auto-replies directly in Discord with lead details');
        console.log('✓ Both original message and bot reply IDs tracked');
        console.log('✓ Complete lead data stored in dashboard for follow-up');
        console.log('------------------------------------------\n');
        
        console.log('The enhanced Discord SMS monitoring system is now complete!');
      }, 1000);
    }, 2000);
  }, 2000);
}, 2000);

// Keyword analysis function (simplified version of what's in the monitor)
function analyzeMessage(text) {
  const textLower = text.toLowerCase();
  
  // Define keyword categories (simplified)
  const keywordGroups = {
    service: ['chef', 'dinner', 'cook', 'meal', 'menu', 'food'],
    booking: ['book', 'hire', 'reservation', 'available', 'schedule'],
    event: ['party', 'guests', 'event', 'people'],
    date: ['weekend', 'anniversary', 'date', 'time'],
    inquiry: ['rates', 'pricing', 'cost', 'menu options', 'offer']
  };
  
  // Find matching keywords
  const matchedKeywords = [];
  const matchedCategories = new Set();
  
  for (const [category, keywords] of Object.entries(keywordGroups)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        matchedKeywords.push(keyword);
        matchedCategories.add(category);
      }
    }
  }
  
  // Calculate score based on keyword matches and category coverage
  let score = Math.min(matchedKeywords.length / 10, 0.7);  // Base score from keyword count
  score += 0.05 * matchedCategories.size;  // Bonus for category coverage
  
  // Special bonus for high-intent combinations
  if (matchedCategories.has('service') && matchedCategories.has('booking')) {
    score += 0.1;
  }
  
  return {
    score: Math.min(score, 1.0),  // Cap at 1.0
    matchedKeywords: [...new Set(matchedKeywords)],  // Remove duplicates
    categories: [...matchedCategories]
  };
}
