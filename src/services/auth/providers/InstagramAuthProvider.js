/**
 * Instagram Auth Provider
 * Handles OAuth authentication with Instagram
 * Note: Instagram API uses Facebook's Graph API for business accounts
 */
import { oauthConfig } from '../../../utils/environment';

class InstagramAuthProvider {
  constructor() {
    this.requiresPopup = true;
    this.appId = oauthConfig.instagram.appId; // Instagram uses Facebook App ID
    this.authBaseUrl = 'https://api.instagram.com/oauth/authorize';
    this.tokenUrl = 'https://api.instagram.com/oauth/access_token';
    // Scopes for Instagram Business accounts
    this.scope = 'user_profile,user_media,instagram_basic';
    this.isConfigured = oauthConfig.instagram.isConfigured();
  }

  /**
   * Creates an authentication session
   * @param {Object} config Authentication configuration
   * @returns {Object} Authentication session details
   */
  async createAuthSession(config) {
    if (!this.isConfigured) {
      throw new Error(
        'Instagram App ID is not configured. Please check your environment variables in .env file.'
      );
    }
    
    // Build the auth URL with proper scopes
    const authUrl = new URL(this.authBaseUrl);
    authUrl.searchParams.append('client_id', this.appId);
    authUrl.searchParams.append('redirect_uri', config.redirectUrl);
    authUrl.searchParams.append('scope', this.scope);
    authUrl.searchParams.append('response_type', 'code');
    
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
      const formData = new FormData();
      formData.append('client_id', this.appId);
      formData.append('client_secret', process.env.REACT_APP_INSTAGRAM_APP_SECRET);
      formData.append('grant_type', 'authorization_code');
      formData.append('redirect_uri', redirectUri);
      formData.append('code', code);

      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to get tokens: ${errorData.error_message || 'Unknown error'}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @param {string} accessToken Access token
   * @returns {Promise<Object>} User profile data
   */
  async fetchUserProfile(accessToken) {
    try {
      const response = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Instagram user profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram user profile:', error);
      throw error;
    }
  }
  
  /**
   * Get Instagram direct messages 
   * Note: This requires a Business Account and the Instagram Graph API
   * @param {string} accessToken Access token
   * @returns {Promise<Array>} List of messages/threads if available
   */
  async fetchDirectMessages(accessToken) {
    try {
      // Instagram messages API requires specific permissions and a business account
      // This is a simplified example
      const response = await fetch(`https://graph.facebook.com/v18.0/me/conversations?access_token=${accessToken}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch messages: ${error.error.message || 'Instagram API may require a Business Account'}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram messages:', error);
      throw error;
    }
  }
  
  /**
   * Get Instagram posts that might contain comments with leads
   * @param {string} accessToken Access token
   * @returns {Promise<Array>} List of posts with comments
   */
  async fetchPostsWithComments(accessToken, limit = 25) {
    try {
      const response = await fetch(`https://graph.instagram.com/me/media?fields=id,caption,comments,timestamp,permalink&limit=${limit}&access_token=${accessToken}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch Instagram posts');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      throw error;
    }
  }

  /**
   * Clean up any resources when logging out
   */
  logout() {
    // Instagram doesn't require special logout functionality on client side
    // We just need to clear the tokens, which is handled by AuthService
  }
}

export default InstagramAuthProvider;
