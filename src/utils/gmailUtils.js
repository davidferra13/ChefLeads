import { LEAD_KEYWORDS } from '../config/gmail';

// Check if an email contains any lead keywords
export const isPotentialLead = (email) => {
  if (!email) return false;
  
  const textToSearch = `${email.subject || ''} ${email.snippet || ''} ${email.from || ''}`.toLowerCase();
  return LEAD_KEYWORDS.some(keyword => textToSearch.includes(keyword));
};

// Parse email headers to extract useful information
export const parseEmailHeaders = (headers = []) => {
  const result = {};
  
  headers.forEach(header => {
    if (header.name === 'From') {
      // Extract name and email from "Name <email@example.com>"
      const fromMatch = header.value.match(/([^<]+)<([^>]+)>/);
      if (fromMatch) {
        result.fromName = fromMatch[1].trim();
        result.fromEmail = fromMatch[2].trim();
      } else {
        result.fromName = header.value;
        result.fromEmail = header.value;
      }
    } else if (header.name === 'Subject') {
      result.subject = header.value;
    } else if (header.name === 'Date') {
      result.date = new Date(header.value);
    }
  });
  
  return result;
};

// Format date to a readable string
export const formatDate = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const diffInDays = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  } else {
    return new Date(date).toLocaleDateString();
  }
};

// Get initials for avatar
export const getInitials = (name = '') => {
  if (!name) return '?';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};
