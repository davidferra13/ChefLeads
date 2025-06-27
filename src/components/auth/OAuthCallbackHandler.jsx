import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { exchangeCodeForToken, validateState } from '../../utils/oauth';
import { updateServiceConnection } from '../../utils/serviceConnections';

/**
 * OAuth Callback Handler Component
 * 
 * Processes OAuth2 authorization code callbacks from various services
 */
const OAuthCallbackHandler = () => {
  const { service } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Processing authentication callback...');
  
  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        // Extract code and state from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        // Check for errors in the callback
        if (error) {
          console.error(`OAuth error for ${service}:`, error);
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          return;
        }
        
        // Validate required parameters
        if (!code || !state) {
          setStatus('error');
          setMessage('Invalid callback: Missing required parameters');
          return;
        }
        
        // Validate state parameter to prevent CSRF attacks
        if (!validateState(service, state)) {
          setStatus('error');
          setMessage('Security error: Invalid state parameter');
          return;
        }
        
        // Exchange authorization code for token
        const tokenData = await exchangeCodeForToken(service, code);
        
        if (!tokenData || !tokenData.access_token) {
          throw new Error('Invalid token response');
        }
        
        // Calculate token expiry time
        const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour if not specified
        const expiresAt = Date.now() + (expiresIn * 1000);
        
        // Store token data in sessionStorage for temporary use
        // Note: In a production environment, tokens should be securely stored on backend
        sessionStorage.setItem(`auth_${service}`, JSON.stringify({
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenType: tokenData.token_type,
          expiresAt,
          profile: tokenData.profile || null
        }));
        
        // Set flag in localStorage to indicate this service has valid auth
        localStorage.setItem(`auth_exists_${service}`, 'true');
        
        // Update service connection status
        updateServiceConnection(service, true);
        
        // Service-specific handling
        if (service === 'facebook') {
          // For Facebook, we might save page information or permissions
          console.log('Facebook authentication successful!');
          // In a real implementation, we would store Facebook-specific data
          // and possibly make additional API calls to get pages, etc.
        }
        
        // Set success state
        setStatus('success');
        setMessage(`Successfully connected to ${service}!`);
        
        // Clear any stored state
        sessionStorage.removeItem(`oauth_state_${service}`);
        sessionStorage.removeItem('demo_auth_flow');
        
        // Delay before redirecting back to connections page
        setTimeout(() => {
          navigate('/account/connections');
        }, 3000);
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setStatus('error');
        setMessage(`Authentication error: ${error.message || 'Unknown error'}`);
      }
    };
    
    processAuthCallback();
  }, [service, searchParams, navigate]);
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ py: 2 }}>
          {status === 'processing' && (
            <CircularProgress size={60} thickness={4} />
          )}
          {status === 'success' && (
            <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
          )}
          {status === 'error' && (
            <ErrorIcon color="error" sx={{ fontSize: 60 }} />
          )}
        </Box>
        
        <Typography variant="h5" component="h1" gutterBottom>
          {status === 'processing' && 'Processing Authentication'}
          {status === 'success' && 'Authentication Successful'}
          {status === 'error' && 'Authentication Failed'}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {message}
        </Typography>
        
        {status === 'success' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Redirecting you back to the connections page...
          </Alert>
        )}
        
        {status === 'error' && (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/account/connections')}
            sx={{ mt: 2 }}
          >
            Return to Connections
          </Button>
        )}
      </Paper>
    </Container>
  );
};

export default OAuthCallbackHandler;
