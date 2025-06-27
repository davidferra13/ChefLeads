// Google OAuth configuration
// Go to Google Cloud Console -> APIs & Services -> Credentials
// Create OAuth 2.0 Client ID for Web Application
// Add http://localhost:3003 to Authorized JavaScript origins
// Add http://localhost:3003/gmail-leads to Authorized redirect URIs

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly', // Read-only access to email
  'https://www.googleapis.com/auth/gmail.modify', // Needed for labels
  'https://www.googleapis.com/auth/userinfo.email', // View your email address
  'https://www.googleapis.com/auth/userinfo.profile' // View basic profile info
];

// Keywords that indicate a potential lead (inclusion list)
export const INCLUSION_KEYWORDS = [
  // Chef and service related
  'private chef',
  'chef for hire',
  'personal chef',
  'chef inquiry',
  'book a chef',
  'hire a chef',
  'event chef',
  
  // Event types
  'private dinner',
  'private dining',
  'dinner party',
  'special occasion',
  'bachelorette party',
  'birthday dinner',
  'anniversary dinner',
  
  // Service related
  'cooking for us',
  'cook dinner for us',
  'cook at our place',
  'catering',
  'custom menu',
  'menu options',
  'food allergies',
  'guest count',
  'dinner reservation',
  'chef availability',
  'looking for a chef',
  
  // Referral related
  'jon recommended',
  'john told me',
  'airbnb host recommended',
  'jon suggested',
  'heard about you from jon',
  'you cooked for jon',
  'referred by airbnb host',
  'recommended you'
].map(keyword => keyword.toLowerCase());

// Keywords that indicate spam or irrelevant emails (exclusion list)
export const EXCLUSION_KEYWORDS = [
  // Promotional phrases
  '50% off',
  'earn a bonus',
  'limited time offer',
  'unlock now',
  'try it free',
  'your order has shipped',
  'confirm your account',
  'don\'t miss this deal',
  'clearance',
  'sign up now',
  'promo ends soon',
  'redeem offer',
  'upgrade to premium',
  'get more matches',
  'congratulations!',
  'job opportunity',
  'make money from home',
  'business proposal',
  
  // Common brands to exclude
  'hinge',
  'tinder',
  'walmart',
  'chase',
  'bank of america',
  'amazon',
  'paypal',
  'linkedin',
  'indeed',
  'robinhood'
].map(keyword => keyword.toLowerCase());

// For backward compatibility
export const LEAD_KEYWORDS = INCLUSION_KEYWORDS;
