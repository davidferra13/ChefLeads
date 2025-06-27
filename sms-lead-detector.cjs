/**
 * SMS Lead Detector
 * 
 * A simple, reliable service that:
 * 1. Receives SMS messages via webhook
 * 2. Detects potential leads using robust keyword matching
 * 3. Stores leads in memory (can be expanded to database)
 * 4. Provides API endpoints to retrieve leads
 */

// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure server
const PORT = process.env.SMS_DETECTOR_PORT || 3005;
const app = express();
app.use(bodyParser.json());

// Add security headers
app.use((req, res, next) => {
  // Set Content-Security-Policy to allow inline scripts and resources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
  );
  next();
});

// In-memory storage for leads (replace with DB in production)
const leadsDatabase = [];

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

// Webhook endpoint for SMS messages (platform-agnostic)
app.post('/webhook/sms', (req, res) => {
  console.log('[Webhook] Received SMS message');
  
  try {
    // Extract message data
    const { id, content, timestamp } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid message format' 
      });
    }
    
    console.log(`[Received] ${content}`);
    
    // Process the message for lead detection
    const leadData = processMessage(content, id, timestamp);
    
    // Check if we should store it as a lead
    if (leadData.score >= 0.3 && leadData.shouldForward) {
      // Add lead to database
      const leadId = addLeadToDatabase(leadData);
      console.log(`[Lead] Detected new lead (ID: ${leadId}, Score: ${leadData.score.toFixed(2)})`);
      
      return res.json({ 
        success: true, 
        leadDetected: true,
        id: leadId,
        score: leadData.score,
        keywords: leadData.matchedKeywords
      });
    } else {
      // Not a lead
      console.log(`[Filter] Message filtered out (Score: ${leadData.score.toFixed(2)})`);
      
      return res.json({ 
        success: true, 
        leadDetected: false,
        score: leadData.score,
        reason: leadData.filterReason || 'Low confidence score'
      });
    }
  } catch (error) {
    console.error('[Error]', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// API endpoint to get all leads
app.get('/api/leads', (req, res) => {
  res.json({ 
    success: true, 
    leads: leadsDatabase 
  });
});

// API endpoint to get a specific lead
app.get('/api/leads/:id', (req, res) => {
  const lead = leadsDatabase.find(lead => lead.id === req.params.id);
  
  if (lead) {
    res.json({ success: true, lead });
  } else {
    res.status(404).json({ 
      success: false, 
      error: 'Lead not found' 
    });
  }
});

/**
 * Process an SMS message for lead detection
 */
function processMessage(messageText, id, timestamp = new Date().toISOString()) {
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
  
  // Generate confidence level
  let confidenceLevel = 'Low';
  if (score >= 0.7) {
    confidenceLevel = 'High';
  } else if (score >= 0.4) {
    confidenceLevel = 'Medium';
  }
  
  console.log(`[Analysis] Score: ${score.toFixed(2)}, Keywords: ${matchedKeywords.join(', ')}`);
  
  return {
    sender,
    content: messageText,
    timestamp,
    score,
    confidenceLevel,
    matchedKeywords,
    matchedCategories,
    shouldForward,
    messageType,
    messageId: id || `msg-${Date.now()}`,
    filterReason
  };
}

/**
 * Adds a lead to the in-memory database
 */
function addLeadToDatabase(leadData) {
  // Generate a unique ID if one isn't provided
  const id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Add metadata
  const lead = {
    id,
    ...leadData,
    receivedAt: new Date().toISOString(),
    status: 'new'
  };
  
  // Add to database
  leadsDatabase.push(lead);
  
  // In a real app, you would save to a persistent database here
  
  return id;
}

// Serve a simple dashboard for viewing leads
app.get('/', (req, res) => {
  // Basic HTML dashboard
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMS Lead Detector</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
      h1, h2 { color: #333; }
      .container { max-width: 1200px; margin: 0 auto; }
      .card { background: #f9f9f9; border-radius: 5px; padding: 15px; margin-bottom: 15px; border-left: 5px solid #ddd; }
      .card.high { border-left-color: #2ecc71; }
      .card.medium { border-left-color: #f39c12; }
      .card.low { border-left-color: #95a5a6; }
      .meta { color: #777; font-size: 0.9em; }
      .keywords { font-size: 0.9em; background: #eee; padding: 3px 7px; border-radius: 3px; margin-right: 5px; display: inline-block; }
      .refresh { padding: 10px 15px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .empty-state { text-align: center; padding: 40px; color: #777; }
      .score { font-weight: bold; }
      .score.high { color: #2ecc71; }
      .score.medium { color: #f39c12; }
      .score.low { color: #95a5a6; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>SMS Lead Detector</h1>
      <p>A reliable system for detecting potential leads from SMS messages.</p>
      
      <div style="margin: 20px 0;">
        <button class="refresh" onclick="fetchLeads()">Refresh Leads</button>
      </div>
      
      <h2>Detected Leads</h2>
      <div id="leads-container">Loading leads...</div>
    </div>

    <script>
      // Fetch and display leads
      function fetchLeads() {
        fetch('/api/leads')
          .then(response => response.json())
          .then(data => {
            const container = document.getElementById('leads-container');
            
            if (!data.leads || data.leads.length === 0) {
              container.innerHTML = '<div class="empty-state">No leads detected yet. Send an SMS to get started.</div>';
              return;
            }
            
            // Sort leads by timestamp (newest first)
            const leads = data.leads.sort((a, b) => 
              new Date(b.timestamp || b.receivedAt) - new Date(a.timestamp || a.receivedAt)
            );
            
            // Generate HTML for each lead
            const html = leads.map(lead => {
              const confidenceClass = lead.confidenceLevel?.toLowerCase() || 
                (lead.score >= 0.7 ? 'high' : lead.score >= 0.4 ? 'medium' : 'low');
                
              const scoreDisplay = Math.round(lead.score * 100);
              
              return \`
                <div class="card \${confidenceClass}">
                  <div class="meta">From: \${lead.sender || 'Unknown'} • \${new Date(lead.timestamp || lead.receivedAt).toLocaleString()}</div>
                  <div style="margin: 10px 0;">\${lead.content}</div>
                  <div>
                    <span class="score \${confidenceClass}">Score: \${scoreDisplay}% (\${lead.confidenceLevel || confidenceClass})</span>
                  </div>
                  <div style="margin-top: 10px;">
                    \${(lead.matchedKeywords || []).map(kw => \`<span class="keywords">\${kw}</span>\`).join('')}
                  </div>
                </div>
              \`;
            }).join('');
            
            container.innerHTML = html;
          })
          .catch(error => {
            console.error('Error fetching leads:', error);
            document.getElementById('leads-container').innerHTML = 
              '<div class="empty-state">Error loading leads. Please try again.</div>';
          });
      }
      
      // Initial load
      fetchLeads();
      
      // Refresh every 30 seconds
      setInterval(fetchLeads, 30000);
    </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// Start server
app.listen(PORT, () => {
  console.log('======================================');
  console.log('SMS LEAD DETECTOR');
  console.log('======================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`- View dashboard: http://localhost:${PORT}/`);
  console.log(`- Send SMS webhook: http://localhost:${PORT}/webhook/sms`);
  console.log(`- API endpoints:`);
  console.log(`  • GET /api/leads`);
  console.log(`  • GET /api/leads/:id`);
  console.log('======================================');
});
