/**
 * Service Configuration
 * 
 * This file defines configuration for all supported services including OAuth parameters,
 * display information, and capabilities.
 */

// Import Material UI icons for services
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import AirbnbIcon from '@mui/icons-material/House';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import SmsIcon from '@mui/icons-material/Sms';
import TikTokIcon from '@mui/icons-material/MusicVideo';
import WebIcon from '@mui/icons-material/Web';
import UploadIcon from '@mui/icons-material/Upload';
import RateReviewIcon from '@mui/icons-material/RateReview';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';

// Service capabilities
const capabilities = {
  MESSAGING: 'messaging',
  EMAIL: 'email',
  FORMS: 'forms',
  BOOKINGS: 'bookings',
  REVIEWS: 'reviews',
  MANUAL: 'manual'
};

/**
 * Service configurations with OAuth and display settings
 */
const serviceConfigs = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    description: 'Get leads from Facebook Messenger',
    icon: FacebookIcon,
    capabilities: [capabilities.MESSAGING],
    oauth: {
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scope: 'email,public_profile,pages_show_list,pages_messaging,pages_read_engagement',
      clientIdEnvKey: 'REACT_APP_FACEBOOK_APP_ID',
      clientSecretEnvKey: 'REACT_APP_FACEBOOK_APP_SECRET'
    }
  },
  
  gmail: {
    id: 'gmail',
    name: 'Gmail',
    description: 'Get leads from Gmail emails',
    icon: EmailIcon,
    capabilities: [capabilities.EMAIL],
    oauth: {
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/gmail.readonly profile email',
      clientIdEnvKey: 'REACT_APP_GOOGLE_CLIENT_ID',
      clientSecretEnvKey: 'REACT_APP_GOOGLE_CLIENT_SECRET',
      additionalParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  },
  
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect to Instagram DMs',
    icon: InstagramIcon,
    capabilities: [capabilities.MESSAGING],
    oauth: {
      authorizeUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      scope: 'user_profile,user_media',
      clientIdEnvKey: 'REACT_APP_INSTAGRAM_CLIENT_ID',
      clientSecretEnvKey: 'REACT_APP_INSTAGRAM_CLIENT_SECRET'
    }
  },
  
  airbnb: {
    id: 'airbnb',
    name: 'Airbnb',
    description: 'Connect to Airbnb messages',
    icon: AirbnbIcon,
    capabilities: [capabilities.MESSAGING, capabilities.BOOKINGS],
    // No direct OAuth API - would require custom integration
  },
  
  takeachef: {
    id: 'takeachef',
    name: 'Take a Chef',
    description: 'Import leads from Take a Chef',
    icon: RestaurantIcon,
    capabilities: [capabilities.FORMS, capabilities.BOOKINGS],
    // Would require custom API integration
  },
  
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect to WhatsApp messages',
    icon: WhatsAppIcon,
    capabilities: [capabilities.MESSAGING],
    // Uses Facebook Business API
    oauth: {
      // Same as Facebook but with different scope
      authorizeUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scope: 'whatsapp_business_messaging',
      clientIdEnvKey: 'REACT_APP_FACEBOOK_APP_ID',
      clientSecretEnvKey: 'REACT_APP_FACEBOOK_APP_SECRET'
    }
  },
  
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Get leads from TikTok messages',
    icon: TikTokIcon,
    capabilities: [capabilities.MESSAGING],
    oauth: {
      authorizeUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
      scope: 'user.info.basic,video.list',
      clientIdEnvKey: 'REACT_APP_TIKTOK_CLIENT_KEY',
      clientSecretEnvKey: 'REACT_APP_TIKTOK_CLIENT_SECRET'
    }
  },
  
  sms: {
    id: 'sms',
    name: 'Phone (SMS)',
    description: 'Receive leads from SMS messages',
    icon: SmsIcon,
    capabilities: [capabilities.MESSAGING],
    // No OAuth - uses direct API integration
  },
  
  wix: {
    id: 'wix',
    name: 'Wix',
    description: 'Connect to Wix form submissions',
    icon: WebIcon,
    capabilities: [capabilities.FORMS],
    oauth: {
      authorizeUrl: 'https://www.wix.com/oauth/authorize',
      tokenUrl: 'https://www.wix.com/oauth/access',
      scope: 'contacts-read forms-read',
      clientIdEnvKey: 'REACT_APP_WIX_CLIENT_ID',
      clientSecretEnvKey: 'REACT_APP_WIX_CLIENT_SECRET'
    }
  },
  
  manual: {
    id: 'manual',
    name: 'Manual Upload',
    description: 'Manually upload lead data',
    icon: UploadIcon,
    capabilities: [capabilities.MANUAL],
    // No OAuth - internal functionality
  },
  
  // Coming soon services (disabled)
  yelp: {
    id: 'yelp',
    name: 'Yelp',
    description: 'Connect to Yelp inquiries',
    icon: RateReviewIcon,
    capabilities: [capabilities.REVIEWS, capabilities.MESSAGING],
    disabled: true,
    oauth: {
      authorizeUrl: 'https://www.yelp.com/oauth2/authorize',
      tokenUrl: 'https://api.yelp.com/oauth2/token',
      scope: 'basic',
      clientIdEnvKey: 'REACT_APP_YELP_CLIENT_ID',
      clientSecretEnvKey: 'REACT_APP_YELP_CLIENT_SECRET'
    }
  },
  
  opentable: {
    id: 'opentable',
    name: 'OpenTable',
    description: 'Import leads from OpenTable',
    icon: RestaurantMenuIcon,
    capabilities: [capabilities.BOOKINGS],
    disabled: true,
    // Uses partner API rather than OAuth
  }
};

/**
 * Get all available services
 * @returns {Array} Array of service objects
 */
export function getServices() {
  return Object.values(serviceConfigs);
}

/**
 * Get a specific service configuration by ID
 * @param {string} id Service identifier
 * @returns {Object|null} Service configuration or null if not found
 */
export function getServiceById(id) {
  return serviceConfigs[id] || null;
}

/**
 * Get OAuth configuration for a service
 * @param {string} serviceId Service identifier
 * @returns {Object|null} OAuth configuration or null if not supported
 */
export function getOAuthConfig(serviceId) {
  const service = serviceConfigs[serviceId];
  return service && service.oauth ? service.oauth : null;
}

export default serviceConfigs;
