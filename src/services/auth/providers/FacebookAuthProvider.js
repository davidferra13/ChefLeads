/**
 * Facebook Auth Provider
 * Handles OAuth authentication with Facebook
 */
import { oauthConfig } from '../../../utils/environment';

class FacebookAuthProvider {
  constructor() {
    this.requiresPopup = true;
    this.appId = oauthConfig.facebook.appId;
    this.authBaseUrl = 'https://www.facebook.com/v18.0/dialog/oauth';
    this.tokenUrl = 'https://graph.facebook.com/v18.0/oauth/access_token';
    // Scope for accessing messages and lead data
    this.scope = 'email,pages_messaging,pages_show_list,pages_read_engagement';
    this.isConfigured = oauthConfig.facebook.isConfigured();
  }

  /**
   * Creates an authentication session
   * @param {Object} config Authentication configuration
   * @returns {Object} Authentication session details
   */
  async createAuthSession(config) {
    if (!this.isConfigured) {
      throw new Error(
        'Facebook App ID is not configured. Please check your environment variables in .env file.'
      );
    }
    
    // Build the auth URL with proper scopes
    const authUrl = new URL(this.authBaseUrl);
    authUrl.searchParams.append('client_id', this.appId);
    authUrl.searchParams.append('redirect_uri', config.redirectUrl);
    authUrl.searchParams.append('scope', this.scope);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('display', 'popup');
    
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
      const response = await fetch(`${this.tokenUrl}?client_id=${this.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${process.env.REACT_APP_FACEBOOK_APP_SECRET}&code=${code}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get tokens: ${errorData.error.message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Fetch pages managed by the user
   * @param {string} accessToken User access token
   * @returns {Promise<Array>} List of pages the user manages
   */
  async fetchPages(accessToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Facebook pages:', error);
      throw error;
    }
  }
  
  /**
   * Fetch Facebook page conversations (potential leads)
   * @param {string} pageId Page ID 
   * @param {string} pageAccessToken Page access token
   * @param {Object} options Query options
   * @returns {Promise<Array>} List of conversations
   */
  async fetchPageConversations(pageId, pageAccessToken, options = {}) {
    try {
      const limit = options.limit || 25;
      const url = `https://graph.facebook.com/v18.0/${pageId}/conversations?fields=participants,link,updated_time,snippet&limit=${limit}&access_token=${pageAccessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch conversations: ${error.error.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Facebook conversations:', error);
      throw error;
    }
  }
  
  /**
   * Fetch messages from a specific conversation
   * @param {string} conversationId Conversation ID
   * @param {string} pageAccessToken Page access token
   * @returns {Promise<Array>} List of messages
   */
  async fetchConversationMessages(conversationId, pageAccessToken) {
    try {
      const url = `https://graph.facebook.com/v18.0/${conversationId}/messages?fields=message,from,created_time&access_token=${pageAccessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch messages: ${error.error.message || 'Unknown error'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }
  
  /**
   * Fetch user profile information
   * @param {string} accessToken Access token
   * @returns {Promise<Object>} User profile data
   */
  async fetchUserProfile(accessToken) {
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=name,email,picture&access_token=${accessToken}`);
      
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
   * Clean up any resources when logging out
   */
  logout() {
    // Facebook doesn't require special logout functionality on client side
    // We just need to clear the tokens, which is handled by AuthService
  }
}

export default FacebookAuthProvider;
