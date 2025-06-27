/**
 * Environment configuration utility
 * This handles accessing environment variables with proper fallbacks
 * for development convenience
 */

// For Vite, we need to use import.meta.env instead of process.env
const env = import.meta.env || {};

/**
 * Get an environment variable with a fallback
 * @param {string} key - The environment variable name
 * @param {string} fallback - Fallback value if not found
 * @returns {string} The environment value or fallback
 */
export const getEnvVariable = (key, fallback = '') => {
  // Handle both process.env (Node) and import.meta.env (Vite)
  // Convert CRA-style REACT_APP_ prefix to VITE_ which is what Vite uses
  const viteKey = key.replace('REACT_APP_', 'VITE_');
  
  // Check for Vite format first
  if (env[viteKey] !== undefined) {
    return env[viteKey];
  }
  
  // Check for React CRA format
  if (env[key] !== undefined) {
    return env[key];
  }
  
  // Check for Node process.env (unlikely in browser but possible in SSR)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Return the fallback
  return fallback;
};

/**
 * OAuth Client IDs and secrets
 */
export const oauthConfig = {
  facebook: {
    appId: getEnvVariable('VITE_FACEBOOK_CLIENT_ID', ''),
    appSecret: getEnvVariable('VITE_FACEBOOK_CLIENT_SECRET', ''),
    redirectUri: getEnvVariable('VITE_FACEBOOK_REDIRECT_URI', ''),
    isConfigured: function() {
      return Boolean(this.appId && this.appSecret);
    }
  },
  google: {
    clientId: getEnvVariable('VITE_GOOGLE_CLIENT_ID', ''),
    clientSecret: getEnvVariable('VITE_GOOGLE_CLIENT_SECRET', ''),
    redirectUri: getEnvVariable('VITE_GOOGLE_REDIRECT_URI', ''),
    isConfigured: function() {
      return Boolean(this.clientId && this.clientSecret);
    }
  },
  instagram: {
    // Instagram typically uses Facebook app credentials
    appId: getEnvVariable('VITE_INSTAGRAM_CLIENT_ID', '') || 
           getEnvVariable('VITE_FACEBOOK_CLIENT_ID', ''),
    appSecret: getEnvVariable('VITE_INSTAGRAM_CLIENT_SECRET', '') || 
               getEnvVariable('VITE_FACEBOOK_CLIENT_SECRET', ''),
    redirectUri: getEnvVariable('VITE_INSTAGRAM_REDIRECT_URI', ''),
    isConfigured: function() {
      return Boolean(this.appId && this.appSecret);
    }
  }
};

/**
 * Check if OAuth is completely configured for at least one provider
 * @returns {boolean} True if at least one provider is configured
 */
export const isOAuthConfigured = () => {
  return oauthConfig.google.isConfigured() || 
         oauthConfig.facebook.isConfigured() || 
         oauthConfig.instagram.isConfigured();
};

export default {
  getEnvVariable,
  oauthConfig,
  isOAuthConfigured
};
