import { google } from 'googleapis';
import { API_BASE_URL } from '../config/api';

console.log('gmailLeadParser.js loaded');

// List of spammy senders to ignore
const SPAM_SENDERS = [
  'realtor.com',
  'applets',
  'tiktok',
  'no-reply',
  'noreply',
  'notifications',
  'mailer-daemon',
  'auto-confirm',
  'auto-reply'
];

// Helper function to safely decode base64
const decodeBase64 = (data) => {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (error) {
    console.error('Error decoding base64:', error);
    return '';
  }
};

// Extract email address from "From" header
const extractEmailAddress = (from) => {
  const match = from.match(/<([^>]+)>/);
  return match ? match[1] : from;
};

// Extract name from "From" header
const extractName = (from) => {
  const nameMatch = from.match(/([^<]+)/);
  if (nameMatch) {
    return nameMatch[1].trim().replace(/"|'/g, '');
  }
  const emailMatch = from.match(/<([^>]+)>/);
  return emailMatch ? emailMatch[1].split('@')[0] : 'Unknown Sender';
};

// Find and decode the email body, prioritizing text/plain but falling back to text/html
const getEmailBody = (payload) => {
  console.log('getEmailBody: Starting body extraction...');
  let textBody = '';
  let htmlBody = '';

  const stack = [payload];

  while (stack.length > 0) {
    const currentPart = stack.pop();

    if (currentPart.mimeType === 'text/plain' && currentPart.body?.data) {
      console.log('getEmailBody: Found text/plain part.');
      textBody = decodeBase64(currentPart.body.data);
      break; 
    }
    
    if (currentPart.mimeType === 'text/html' && currentPart.body?.data) {
      console.log('getEmailBody: Found text/html part (as fallback).');
      if (!htmlBody) {
        htmlBody = decodeBase64(currentPart.body.data);
      }
    }

    if (currentPart.parts) {
      stack.push(...currentPart.parts.reverse());
    }
  }

  if (textBody) {
    console.log('getEmailBody: Returning plain text body.');
    return textBody;
  }

  if (htmlBody) {
    console.log('getEmailBody: No plain text found, returning converted HTML body.');
    return htmlBody
      .replace(/<style[^>]*>.*<\/style>/gs, ' ')
      .replace(/<script[^>]*>.*<\/script>/gs, ' ')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }
  
  if (!payload.parts && payload.body?.data) {
      console.log('getEmailBody: Returning body from single-part message.');
      return decodeBase64(payload.body.data);
  }

  console.warn('getEmailBody: Could not find any email body.');
  return '';
};

/**
 * Parse email content to extract structured lead information
 * @param {string} body - The email body text
 * @returns {Object} Parsed lead information
 */
const parseEmailContent = (body) => {
  if (!body) return {};
  
  // Remove any quoted text (replies/forwards)
  const cleanBody = body
    .split(/\n\s*On\s.*\s*wrote:.*$/s)[0]
    .split(/\n\s*On\s.*\s*wrote:.*$/m)[0]
    .split('_____')[0]  // Common separator for forwarded messages
    .replace(/^>.*$/gm, '')  // Remove lines starting with >
    .replace(/\n{3,}/g, '\n\n')  // Normalize multiple newlines
    .trim();

  // Try to extract structured data using regex patterns
  const patterns = {
    hostName: /(?:host|chef|name)[:\s]*([^\n]+)/i,
    eventTitle: /(?:event|dinner|lunch|brunch|meal)[\s\w:]*[\s\-:]+([^\n]+)/i,
    guestCount: /(?:guests?|people|pax|number of guests?)[\s\w:]*[\s\-:]+(\d+)/i,
    eventDate: /(?:date|when)[\s\w:]*[\s\-:]+([^\n]+)/i,
    eventTime: /(?:time|when)[\s\w:]*[\s\-:]+(?:[^\n]*?)(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)/i,
    location: /(?:location|where|address|venue)[\s\w:]*[\s\-:]+([^\n]+)/i,
    menuDetails: /(?:menu|food|cuisine|dietary|diet)[\s\w:]*[\s\-:]+([^\n]+)/i,
    allergies: /(?:allerg(?:y|ies)|dietary restrictions?|food restrictions?)[\s\w:]*[\s\-:]+([^\n]+)/i,
    dietaryRestrictions: /(?:dietary restrictions?|diet|food restrictions?)[\s\w:]*[\s\-:]+([^\n]+)/i,
    specialRequests: /(?:special requests?|notes|additional notes|comments|requests?)[\s\w:]*[\s\-:]+([^\n]+)/i,
    budget: /(?:budget|price|cost|rate)[\s\w:]*[\s\-:]+([^\n]+)/i,
    contactPhone: /(?:phone|mobile|telephone|contact number)[\s\w:]*[\s\-:]+([^\n]+)/i
  };

  const result = {};
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = cleanBody.match(pattern);
    if (match) {
      result[key] = match[1]?.trim();
    }
  }

  // If we didn't find a host name, try to extract it from the email
  if (!result.hostName && cleanBody.includes('@')) {
    const emailMatch = cleanBody.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    if (emailMatch) {
      result.hostEmail = emailMatch[0];
    }
  }

  return result;
};

/**
 * Fetch and process Gmail leads from the backend API
 * @param {string} accessToken - The user's access token
 * @returns {Promise<Array>} Array of processed leads
 */
const fetchAndProcessGmailLeads = async (accessToken) => {
  try {
    console.log('Fetching leads from backend API...');
    
    const response = await fetch(`${API_BASE_URL}/api/gmail/leads`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch leads');
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.leads?.length || 0} leads from backend.`);
    
    // Process each lead from the backend
    const processedLeads = (data.leads || []).map(lead => ({
      id: lead.id,
      subject: lead.subject,
      from: lead.from,
      to: lead.to,
      date: lead.date,
      body: lead.body,
      ...parseEmailContent(lead.body),
      rawEmail: lead.rawEmail // Keep the raw email data if provided
    }));
    
    return processedLeads;
  } catch (error) {
    console.error('Error in fetchAndProcessGmailLeads:', error);
    throw new Error(`Failed to fetch and process Gmail leads: ${error.message}`);
  }
};

const parseEmailToLeadObject = (email) => {
  console.log(`parseEmailToLeadObject: Processing email ID ${email.id}`);
  try {
    const headers = email.payload.headers || [];
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
    const emailAddress = extractEmailAddress(fromHeader);

    const isSpam = SPAM_SENDERS.some(sender => 
      emailAddress.toLowerCase().includes(sender) || 
      fromHeader.toLowerCase().includes(sender)
    );
    if (isSpam) {
      console.log(`parseEmailToLeadObject: Skipping spam email from ${fromHeader}`);
      return null;
    }

    const body = getEmailBody(email.payload);
    
    if (!body) {
        console.warn(`parseEmailToLeadObject: Could not extract body from email: ${subject}`);
        return null;
    }

    const parsedContent = parseEmailContent(body);

    const lead = {
      hostName: extractName(fromHeader),
      eventTitle: subject,
      ...parsedContent,
      source: 'Gmail',
      status: 'New',
      rawEmail: email,
      email: emailAddress,
      createdAt: new Date(parseInt(email.internalDate, 10)).toISOString()
    };
    console.log('parseEmailToLeadObject: Successfully created lead object:', lead);
    return lead;
  } catch (error) {
    console.error(`parseEmailToLeadObject: Error parsing email ID ${email.id}:`, error);
    return null;
  }
};

export default {
  fetchAndProcessGmailLeads,
  parseEmailToLeadObject
};
