/**
 * Gmail Auth Provider
 * Handles OAuth authentication with Google/Gmail
 */
import { oauthConfig } from '../../../utils/environment';

class GmailAuthProvider {
  constructor() {
    this.requiresPopup = true;
    this.clientId = oauthConfig.google.clientId;
    this.authBaseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    this.tokenUrl = 'https://oauth2.googleapis.com/token';
    this.scope = 'https://www.googleapis.com/auth/gmail.readonly';
    this.isConfigured = oauthConfig.google.isConfigured();
  }

  /**
   * Creates an authentication session
   * @param {Object} config Authentication configuration
   * @returns {Object} Authentication session details
   */
  async createAuthSession(config) {
    if (!this.isConfigured) {
      throw new Error(
        'Google Client ID is not configured. Please check your environment variables in .env file.'
      );
    }
    
    // Build the auth URL with proper scopes for Gmail
    const authUrl = new URL(this.authBaseUrl);
    authUrl.searchParams.append('client_id', this.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUrl);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.scope);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    // Include state parameter for security
    const state = this.generateStateParam();
    authUrl.searchParams.append('state', state);
    
    return {
      authUrl: authUrl.toString(),
      state: state
    };
  }

  /**
   * Generate a random state parameter to prevent CSRF attacks
   */
  generateStateParam() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Exchange authorization code for access tokens
   * @param {string} code Authorization code from OAuth redirect
   * @param {string} redirectUri Redirect URI used in the auth request
   * @returns {Promise<Object>} Token response
   */
  async exchangeCodeForTokens(code, redirectUri) {
    try {
      // In a production app, this should be done by your backend
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get tokens: ${errorData.error_description || errorData.error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Fetch user profile information after authentication
   * @param {Object} tokens Authentication tokens
   * @returns {Promise<Object>} User profile
   */
  async fetchUserProfile(tokens) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Fetch Gmail messages using the Gmail API
   * @param {string} accessToken OAuth access token
   * @param {Object} options Query options
   * @returns {Promise<Object>} Messages response
   */
  async fetchGmailMessages(accessToken, options = {}) {
    try {
      const maxResults = options.maxResults || 20;
      const query = options.query || '';
      
      const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
      url.searchParams.append('maxResults', maxResults);
      if (query) url.searchParams.append('q', query);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch Gmail messages: ${error.error || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }
  
  /**
   * Clean up any resources when logging out
   */
  logout() {
    // Gmail doesn't require any special logout functionality
    // We just need to clear the tokens, which is handled by AuthService
  }
}

export default GmailAuthProvider;
