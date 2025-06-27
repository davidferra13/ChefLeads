/**
 * Auth Service - Handles authentication flows for various platforms
 * 
 * This service orchestrates the OAuth flows and API integrations
 * with third-party platforms to allow importing leads.
 */

import { updateServiceConnection } from '../../utils/serviceConnections';
import GmailAuthProvider from './providers/GmailAuthProvider';
import FacebookAuthProvider from './providers/FacebookAuthProvider';
import InstagramAuthProvider from './providers/InstagramAuthProvider';
import GenericAuthProvider from './providers/GenericAuthProvider';
import { isOAuthConfigured } from '../../utils/environment';

// Provider mapping
const providers = {
  'gmail': GmailAuthProvider,
  'facebook': FacebookAuthProvider,
  'instagram': InstagramAuthProvider,
  // Other providers will be added here
};

// Default configuration
const defaultConfig = {
  popupWidth: 600,
  popupHeight: 700,
  responseType: 'token', 
  redirectUrl: `${window.location.origin}/auth-callback`
};

/**
 * Core authentication service for handling provider-specific auth flows
 */
class AuthService {
  constructor() {
    this.activeProviders = {};
    this.authCallbacks = {};
    
    // Setup message listener for popup communication
    window.addEventListener('message', this.handleAuthMessage.bind(this), false);
  }

  /**
   * Initialize authentication for a specific service
   * @param {string} serviceId The service ID to authenticate with
   * @param {object} options Additional options for the auth flow
   * @returns {Promise} A promise that resolves when auth is complete
   */
  async authenticate(serviceId, options = {}) {
    try {
      // Check if this is demo mode (when no OAuth credentials are configured)
      const isDemoMode = !isOAuthConfigured();
      
      // Get the appropriate provider for this service or use generic provider if not found
      let provider;
      const Provider = providers[serviceId];
      
      if (Provider) {
        // Use the specific provider
        provider = new Provider();
      } else if (isDemoMode) {
        // In demo mode, use the generic provider for any service without a dedicated provider
        console.log(`Using generic provider for ${serviceId} in demo mode`);
        provider = new GenericAuthProvider(serviceId);
      } else {
        // In production mode, fail if no provider is available
        throw new Error(`No authentication provider found for service: ${serviceId}`);
      }
      
      this.activeProviders[serviceId] = provider;
      
      // If we're in demo mode, simulate authentication instead of real OAuth
      if (isDemoMode && options.allowDemo !== false) {
        console.log(`Running in demo mode for ${serviceId} - no real OAuth will be performed`);
        return this.simulateDemoAuthentication(serviceId);
      }
      
      // Create auth session and proceed with real OAuth
      const session = await provider.createAuthSession({
        ...defaultConfig,
        ...options
      });
      
      // Return a promise that resolves when authentication is complete
      return new Promise((resolve, reject) => {
        this.authCallbacks[serviceId] = {
          resolve: (data) => {
            this.onAuthSuccess(serviceId, data);
            resolve(data);
          },
          reject: (error) => {
            this.onAuthFailure(serviceId, error);
            reject(error);
          }
        };
        
        // Some providers might handle auth differently (e.g., popup vs redirect)
        if (provider.requiresPopup) {
          this.openAuthPopup(serviceId, session.authUrl);
        } else {
          provider.authenticate(session)
            .then(this.authCallbacks[serviceId].resolve)
            .catch(this.authCallbacks[serviceId].reject);
        }
      });
    } catch (error) {
      console.error(`Authentication error for ${serviceId}:`, error);
      
      // Provide a more helpful error message in development
      if (error.message && error.message.includes('not configured')) {
        console.info(
          `To enable real ${serviceId} authentication, add the required credentials to your .env file. ` +
          `Check .env.example for required variables.`
        );
      }
      
      throw error;
    }
  }
  
  /**
   * Simulate authentication flow in demo mode
   * @param {string} serviceId The service to simulate authentication for
   * @returns {Promise} A promise that resolves with simulated auth data
   */
  simulateDemoAuthentication(serviceId) {
    return new Promise((resolve) => {
      console.log(`Simulating auth flow for ${serviceId} in demo mode`);
      
      // Simulate a brief delay as if we're authenticating
      setTimeout(() => {
        // Create mock auth data
        const mockAuthData = {
          accessToken: `mock_token_${Math.random().toString(36).substring(2, 15)}`,
          refreshToken: `mock_refresh_${Math.random().toString(36).substring(2, 15)}`,
          expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
          tokenType: 'Bearer',
          user: {
            id: `user_${Math.random().toString(36).substring(2, 9)}`,
            name: 'Demo User',
            email: `demo-${serviceId}@example.com`,
            picture: 'https://via.placeholder.com/150'
          }
        };
        
        // Store the mock auth data
        this.onAuthSuccess(serviceId, mockAuthData);
        resolve(mockAuthData);
      }, 1000);
    });
  }
  
  /**
   * Handles message events from auth popups
   */
  handleAuthMessage(event) {
    // Validate message origin for security
    if (!this.isValidOrigin(event.origin)) {
      console.warn(`Rejected message from untrusted origin: ${event.origin}`);
      return;
    }
    
    try {
      const { serviceId, type, payload } = event.data;
      
      if (!serviceId || !type || !this.authCallbacks[serviceId]) {
        return; // Not a relevant auth message
      }
      
      if (type === 'AUTH_SUCCESS') {
        this.authCallbacks[serviceId].resolve(payload);
      } else if (type === 'AUTH_FAILURE') {
        this.authCallbacks[serviceId].reject(new Error(payload.message || 'Authentication failed'));
      }
    } catch (error) {
      console.error('Error processing auth message', error);
    }
  }
  
  /**
   * Validates message origin for security
   */
  isValidOrigin(origin) {
    // List of trusted origins
    const trustedOrigins = [
      window.location.origin,
      'https://accounts.google.com',
      'https://www.facebook.com',
      'https://api.instagram.com'
      // Add other trusted origins as needed
    ];
    
    return trustedOrigins.some(trusted => origin === trusted || 
                              origin.startsWith(trusted));
  }
  
  /**
   * Opens an authentication popup window
   */
  openAuthPopup(serviceId, url) {
    const width = defaultConfig.popupWidth;
    const height = defaultConfig.popupHeight;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      url,
      `auth-${serviceId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    if (!popup || popup.closed) {
      this.authCallbacks[serviceId].reject(new Error('Popup was blocked. Please allow popups for this site.'));
    }
    
    // Poll to check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkClosed);
        if (this.authCallbacks[serviceId]) {
          this.authCallbacks[serviceId].reject(new Error('Authentication was cancelled.'));
          delete this.authCallbacks[serviceId];
        }
      }
    }, 500);
  }
  
  /**
   * Handles successful authentication
   */
  onAuthSuccess(serviceId, authData) {
    // Update connection state
    updateServiceConnection(serviceId, true);
    
    // Store auth data securely
    this.storeAuthData(serviceId, authData);
    
    // Clean up
    delete this.authCallbacks[serviceId];
  }
  
  /**
   * Handles failed authentication
   */
  onAuthFailure(serviceId, error) {
    console.error(`Authentication failed for ${serviceId}:`, error);
    
    // Clean up
    delete this.authCallbacks[serviceId];
  }
  
  /**
   * Securely stores authentication data
   */
  storeAuthData(serviceId, authData) {
    try {
      // Store tokens in secure storage
      const secureData = {
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        expiresAt: Date.now() + (authData.expiresIn * 1000),
        tokenType: authData.tokenType || 'Bearer',
        scope: authData.scope || ''
      };
      
      // Use sessionStorage for temp auth data
      sessionStorage.setItem(`auth_${serviceId}`, JSON.stringify(secureData));
      
      // Store minimal info in localStorage for persistence
      localStorage.setItem(`auth_exists_${serviceId}`, 'true');
      
      console.log(`Auth data stored for ${serviceId}`);
    } catch (error) {
      console.error(`Failed to store auth data for ${serviceId}:`, error);
    }
  }
  
  /**
   * Retrieves stored auth data
   */
  getAuthData(serviceId) {
    try {
      const data = sessionStorage.getItem(`auth_${serviceId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get auth data for ${serviceId}:`, error);
      return null;
    }
  }
  
  /**
   * Check if a service is authenticated
   */
  isAuthenticated(serviceId) {
    const authData = this.getAuthData(serviceId);
    return !!(authData && authData.accessToken && authData.expiresAt > Date.now());
  }
  
  /**
   * Disconnect a service
   */
  disconnect(serviceId) {
    // Remove from local storage
    localStorage.removeItem(`auth_exists_${serviceId}`);
    sessionStorage.removeItem(`auth_${serviceId}`);
    
    // Update connection state
    updateServiceConnection(serviceId, false);
    
    // If provider has a specific logout process
    const provider = this.activeProviders[serviceId];
    if (provider && typeof provider.logout === 'function') {
      provider.logout();
    }
  }
}

export default new AuthService();
