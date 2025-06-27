/**
 * Generic Auth Provider - Provides demo authentication for any service
 * 
 * This provider is used as a fallback when specific providers are not available
 * or not implemented, especially useful in demo mode.
 */

class GenericAuthProvider {
  constructor(serviceId) {
    this.serviceId = serviceId;
    this.isConfigured = true; // Always configured since this is a demo provider
    this.requiresPopup = false;
  }
  
  /**
   * Creates an authentication session
   * @param {Object} config Authentication configuration
   * @returns {Object} Authentication session details
   */
  async createAuthSession(config) {
    return {
      authUrl: '#demo-auth-url',
      state: this.generateStateParam()
    };
  }
  
  /**
   * Exchanges an authorization code for access token
   * @param {Object} params Parameters including code and redirectUri
   * @returns {Object} Token response
   */
  async exchangeCodeForToken(params) {
    return {
      access_token: `mock_token_${this.serviceId}_${Math.random().toString(36).substring(2, 15)}`,
      refresh_token: `mock_refresh_${Math.random().toString(36).substring(2, 15)}`,
      expires_in: 3600,
      token_type: 'Bearer'
    };
  }
  
  /**
   * Fetches user profile information
   * @param {Object} tokenData Token data
   * @returns {Object} User profile
   */
  async fetchUserProfile(tokenData) {
    return {
      id: `user_${Math.random().toString(36).substring(2, 9)}`,
      name: `Demo ${this.serviceId.charAt(0).toUpperCase() + this.serviceId.slice(1)} User`,
      email: `demo-${this.serviceId}@example.com`,
      picture: 'https://via.placeholder.com/150'
    };
  }
  
  /**
   * Fetches data relevant to this service
   * @param {Object} tokenData Token data
   * @returns {Array} Relevant data
   */
  async fetchData(tokenData) {
    return [
      {
        id: `lead_${Math.random().toString(36).substring(2, 9)}`,
        title: 'Demo Lead 1',
        message: `A sample lead from your ${this.serviceId} account`,
        date: new Date().toISOString()
      },
      {
        id: `lead_${Math.random().toString(36).substring(2, 9)}`,
        title: 'Demo Lead 2',
        message: 'Another sample lead with some customer inquiry',
        date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];
  }
  
  /**
   * Generates a state parameter for OAuth security
   * @returns {string} Random state string
   */
  generateStateParam() {
    return Math.random().toString(36).substring(2, 15);
  }
}

export default GenericAuthProvider;
