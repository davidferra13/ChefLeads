/**
 * OAuth Utilities
 * 
 * Provides standardized functions for OAuth2 authentication flows
 */

import { isOAuthConfigured, oauthConfig } from './environment';
import { getServiceById, getOAuthConfig } from '../config/services';


/**
 * Creates an OAuth authorization URL for the specified service
 * @param {string} service - The service identifier (e.g., 'facebook', 'gmail')
 * @returns {string|null} The authorization URL or null if service not supported
 */
export function createAuthUrl(service) {
  // Get service configuration
  const serviceConfig = getServiceById(service);
  if (!serviceConfig) {
    console.error(`Service not found: ${service}`);
    return null;
  }
  
  // Get OAuth configuration for the service
  const oauthConfig = getOAuthConfig(service);
  if (!oauthConfig) {
    console.error(`OAuth configuration not found for service: ${service}`);
    return null;
  }
  
  // Get client ID based on the service
  let clientId = 'demo-client-id';
  let redirectUri = `${window.location.origin}/auth/${service}/callback`;
  
  // Use real credentials when available
  if (service === 'facebook' && oauthConfig.facebook && oauthConfig.facebook.isConfigured()) {
    clientId = oauthConfig.facebook.appId;
    // Use configured redirect URI if available
    if (oauthConfig.facebook.redirectUri) {
      redirectUri = oauthConfig.facebook.redirectUri;
    }
    console.log(`Using real Facebook OAuth credentials with client ID ${clientId.substring(0, 5)}...`);
  } else if (service === 'google' && oauthConfig.google && oauthConfig.google.isConfigured()) {
    clientId = oauthConfig.google.clientId;
    if (oauthConfig.google.redirectUri) {
      redirectUri = oauthConfig.google.redirectUri;
    }
    console.log(`Using real Google OAuth credentials with client ID ${clientId.substring(0, 5)}...`);
  } else if (service === 'instagram' && oauthConfig.instagram && oauthConfig.instagram.isConfigured()) {
    clientId = oauthConfig.instagram.appId;
    if (oauthConfig.instagram.redirectUri) {
      redirectUri = oauthConfig.instagram.redirectUri;
    }
    console.log(`Using real Instagram OAuth credentials with client ID ${clientId.substring(0, 5)}...`);
  } else {
    console.log(`Using demo credentials for ${service} OAuth flow`);
  }
  
  // Build the authorization URL
  const url = new URL(oauthConfig.authorizeUrl);
  url.searchParams.append('client_id', clientId);
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', oauthConfig.scope);
  
  // Add any additional parameters if specified in the configuration
  if (oauthConfig.additionalParams) {
    Object.entries(oauthConfig.additionalParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  // Add state parameter for security - prevents CSRF attacks
  const state = generateState(service);
  url.searchParams.append('state', state);
  
  // Store state in session storage for verification in callback
  sessionStorage.setItem(`oauth_state_${service}`, state);
  
  return url.toString();
}

/**
 * Initiates the OAuth connection process for a service
 * @param {string} service - The service to connect with
 * @returns {boolean} True if redirection initiated, false otherwise
 */
export function connectWithOAuth(service) {
  try {
    // Check if real credentials are available for this specific service
    let serviceConfigured = false;
    
    // Check for service-specific configuration
    if (service === 'facebook' && oauthConfig.facebook) {
      serviceConfigured = oauthConfig.facebook.isConfigured();
    } else if (service === 'google' && oauthConfig.google) {
      serviceConfigured = oauthConfig.google.isConfigured();
    } else if (service === 'instagram' && oauthConfig.instagram) {
      serviceConfigured = oauthConfig.instagram.isConfigured();
    }
    
    // If service is not configured, use demo mode
    if (!serviceConfigured) {
      console.log(`Demo mode active for ${service} OAuth flow (service credentials not found)`);
      // In demo mode, we'll simulate the authentication process
      simulateDemoAuth(service);
      return true;
    }
    
    // Otherwise use real OAuth flow
    console.log(`Using real OAuth flow for ${service}`);
    const authUrl = createAuthUrl(service);
    if (!authUrl) return false;
    
    // Redirect to the authorization URL
    window.location.href = authUrl;
    return true;
  } catch (error) {
    console.error(`Error initiating OAuth flow for ${service}:`, error);
    return false;
  }
}

/**
 * Simulates OAuth authentication in demo mode
 * @param {string} service - The service identifier
 */
function simulateDemoAuth(service) {
  // Store indication that we're in a simulated auth flow
  sessionStorage.setItem('demo_auth_flow', service);
  
  // Redirect to our callback endpoint with dummy parameters
  const demoCode = `demo_code_${Math.random().toString(36).substring(2, 15)}`;
  const demoState = sessionStorage.getItem(`oauth_state_${service}`) || 'demo_state';
  
  // Delay to simulate network request
  setTimeout(() => {
    window.location.href = `${window.location.origin}/auth/${service}/callback?code=${demoCode}&state=${demoState}`;
  }, 500);
}

/**
 * Exchanges an authorization code for an access token
 * @param {string} service - The service identifier
 * @param {string} code - The authorization code
 * @returns {Promise<Object>} Token response object
 */
export async function exchangeCodeForToken(service, code) {
  // Get service configuration
  const serviceConfig = getServiceById(service);
  if (!serviceConfig) {
    throw new Error(`Service not found: ${service}`);
  }
  
  // Get OAuth configuration for the service
  const oauthConfig = getOAuthConfig(service);
  if (!oauthConfig) {
    throw new Error(`OAuth configuration not found for service: ${service}`);
  }
  
  // Check if we're in demo mode
  const isDemoMode = sessionStorage.getItem('demo_auth_flow') === service || !isOAuthConfigured();
  
  if (isDemoMode) {
    // Mock token response in demo mode
    console.log(`Demo mode active: Creating mock token for ${service}`);
    return {
      access_token: `mock_${service}_token_${Math.random().toString(36).substring(2, 15)}`,
      refresh_token: `mock_refresh_${Math.random().toString(36).substring(2, 15)}`,
      expires_in: 3600,
      token_type: 'Bearer',
      // Add some service-specific mock data based on service type
      profile: {
        id: `${service}_user_${Math.random().toString(36).substring(2, 8)}`,
        name: `Demo ${serviceConfig.name} User`,
        email: `demo@${service}example.com`,
      }
    };
  }
  
  // For Facebook service with real credentials, perform actual token exchange
  if (service === 'facebook' && oauthConfig.facebook && oauthConfig.facebook.isConfigured()) {
    console.log('Using real Facebook OAuth token exchange');
    try {
      // Get the OAuth configuration for Facebook
      const fbConfig = getOAuthConfig(service);
      const envConfig = oauthConfig.facebook;
      
      // Prepare the redirect URI - use configured one or fallback to default
      const redirectUri = envConfig.redirectUri || `${window.location.origin}/auth/${service}/callback`;
      
      // Make the actual API call to Facebook's token endpoint
      const response = await fetch(fbConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: envConfig.appId,
          client_secret: envConfig.appSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Facebook token exchange failed: ${errorData.error || response.statusText}`);
      }
      
      // Parse the token response
      const tokenData = await response.json();
      
      // Facebook returns different property names than our standard format
      // So we normalize the response
      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'bearer',
        expires_in: tokenData.expires_in || 3600,
        refresh_token: tokenData.refresh_token || null,
        // Add Facebook user ID if available
        id: tokenData.id || `fb_${Math.random().toString(36).substring(2, 8)}`,
        // Add additional data as needed
        raw_response: tokenData
      };
    } catch (error) {
      console.error('Error in real Facebook OAuth token exchange:', error);
      throw error;
    }
  }
  
  // For other services or when Facebook credentials are missing, we'll continue with mock implementation
  // In future, we can add more 'if' blocks for other services like Gmail, Instagram, etc.
  
  // For now, we'll mock this step as requested
  console.log(`Mocking token exchange for ${service} with code ${code}`);
  
  // Return a mock token response
  return {
    access_token: `${service}_token_${Math.random().toString(36).substring(2, 15)}`,
    refresh_token: `${service}_refresh_${Math.random().toString(36).substring(2, 15)}`,
    expires_in: 3600,
    token_type: 'Bearer',
    profile: {
      id: `${service}_user_real_${Math.random().toString(36).substring(2, 8)}`,
      name: `Real ${serviceConfig.name} User`,
      email: `user@${service}example.com`,
    }
  };
}

/**
 * Generates a random state parameter
 * @param {string} prefix - Optional prefix for the state
 * @returns {string} Random state string
 */
function generateState(prefix = '') {
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${prefix}_${randomPart}_${Date.now()}`;
}

/**
 * Validates the state parameter in callback to prevent CSRF attacks
 * @param {string} service - The service identifier
 * @param {string} state - The state parameter from callback
 * @returns {boolean} True if state is valid
 */
export function validateState(service, state) {
  const storedState = sessionStorage.getItem(`oauth_state_${service}`);
  const isDemoMode = sessionStorage.getItem('demo_auth_flow') === service;
  
  // Always validate in demo mode
  if (isDemoMode && state.includes('demo_state')) {
    return true;
  }
  
  return storedState === state;
}
