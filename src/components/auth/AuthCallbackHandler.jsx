import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Auth Callback Handler
 * 
 * This component processes OAuth callbacks from third-party services.
 * It extracts parameters from the redirect URL and communicates with the parent window
 * that opened this callback URL in a popup.
 */
const AuthCallbackHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Extract auth parameters from URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const serviceId = searchParams.get('service') || extractServiceFromState(state);
        
        // Handle errors from OAuth provider
        if (error) {
          setStatus('error');
          setError(`Authentication failed: ${error}`);
          sendMessageToParent(serviceId, 'AUTH_FAILURE', { message: error });
          return;
        }
        
        if (!code) {
          setStatus('error');
          setError('No authorization code received');
          sendMessageToParent(serviceId, 'AUTH_FAILURE', { message: 'No authorization code received' });
          return;
        }
        
        // Process successful authentication
        setStatus('success');
        sendMessageToParent(serviceId, 'AUTH_SUCCESS', { 
          code, 
          state,
          redirectUri: window.location.origin + window.location.pathname
        });
        
        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } catch (err) {
        console.error('Error processing authentication callback:', err);
        setStatus('error');
        setError(err.message || 'Authentication failed');
      }
    };

    processAuth();
  }, [searchParams]);

  /**
   * Send message to parent window that opened this popup
   */
  const sendMessageToParent = (serviceId, type, payload) => {
    if (window.opener) {
      window.opener.postMessage(
        { serviceId, type, payload },
        window.location.origin
      );
    }
  };
  
  /**
   * Extract service ID from state parameter if available
   */
  const extractServiceFromState = (state) => {
    if (!state) return 'unknown';
    // State could be encoded with service information
    // This is a simplified example
    return state.split('-')[0] || 'unknown';
  };

  // Render appropriate UI based on status
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 3
      }}
    >
      {status === 'processing' && (
        <>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6">
            Processing authentication...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please wait while we complete your sign-in.
          </Typography>
        </>
      )}
      
      {status === 'success' && (
        <>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6">
            Successfully authenticated!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You may close this window and return to the application.
          </Typography>
        </>
      )}
      
      {status === 'error' && (
        <>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" color="error">
            Authentication Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error || 'Failed to complete authentication'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You may close this window and try again.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallbackHandler;
