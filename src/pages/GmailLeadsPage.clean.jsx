import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  CircularProgress, 
  Alert, 
  List, 
  ListItem, 
  ListItemAvatar, 
  Avatar, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton,
  Chip,
  Divider
} from '@mui/material';
import { Refresh as RefreshIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { GOOGLE_CLIENT_ID, GMAIL_SCOPES, LEAD_KEYWORDS } from '../config/gmail';

// Utility function to check if an email is a potential lead
const isPotentialLead = (email, keywords) => {
  if (!email) return false;
  
  const searchText = `${email.subject || ''} ${email.snippet || ''} ${email.from || ''}`.toLowerCase();
  return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
};

// Utility function to parse email headers
const parseEmailHeaders = (headers = []) => {
  return headers.reduce((acc, header) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {});
};

// Format date to a readable string
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString();
};

// Get initials from email
const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Load Google Identity Services script
const loadGisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve();
      } else {
        reject(new Error('Google Identity Services failed to load'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
    document.body.appendChild(script);
  });
};

const GmailLeadsPage = () => {
  console.log('[GmailLeadsPage] Component is mounting');
  
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [gapiReady, setGapiReady] = useState(false);
  const [gapiError, setGapiError] = useState(null);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const googleAuthClient = useRef(null);
  
  // Debug logging
  const logApiState = (message, data = null) => {
    console.log(`[GmailLeadsPage] ${message}`, data || '');
  };
  
  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (!googleAuthClient.current) {
      setGapiError('Google authentication client not ready');
      return;
    }
    
    try {
      googleAuthClient.current.requestAccessToken();
    } catch (error) {
      console.error('Sign-in error:', error);
      setGapiError(`Sign-in error: ${error.message}`);
    }
  }, []);
  
  // Handle sign out
  const handleSignOut = useCallback(() => {
    try {
      // Clear the token from GAPI
      if (window.gapi?.client?.getToken()) {
        const token = window.gapi.client.getToken();
        if (token) {
          window.gapi.client.setToken(null);
        }
      }
      
      // Clear the token from Google Identity Services
      if (window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke('', () => {
          console.log('Token revoked');
        });
      }
      
      // Reset state
      setIsAuthenticated(false);
      setEmails([]);
      setError(null);
      
    } catch (error) {
      console.error('Error during sign out:', error);
      setError(`Error during sign out: ${error.message}`);
    }
  }, []);
  
  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/leads');
  }, [navigate]);
  
  // Fetch emails from Gmail API
  const fetchEmails = useCallback(async () => {
    if (!window.gapi?.client?.gmail) {
      console.error('Gmail client not initialized');
      setError('Gmail client not initialized. Please refresh the page.');
      return;
    }
    
    setIsLoadingEmails(true);
    setError(null);
    
    try {
      // Check if we have a valid token
      const token = window.gapi.client.getToken();
      if (!token) {
        console.error('No access token available');
        setError('Not authenticated. Please sign in again.');
        return;
      }
      
      // Get the list of messages
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 10, // Limit to 10 most recent emails for initial load
        q: 'is:inbox newer_than:7d' // Get emails from the last 7 days
      });
      
      const messages = response.result.messages || [];
      logApiState('Fetched messages', { count: messages.length });
      
      if (messages.length === 0) {
        setEmails([]);
        return;
      }
      
      // Get full message details for each message
      const messagePromises = messages.map(async (message) => {
        try {
          const messageResponse = await window.gapi.client.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date']
          });
          
          const email = messageResponse.result;
          const headers = parseEmailHeaders(email.payload.headers);
          
          return {
            id: email.id,
            threadId: email.threadId,
            from: headers.From,
            subject: headers.Subject || '(No subject)',
            date: headers.Date ? new Date(headers.Date) : new Date(parseInt(email.internalDate)),
            snippet: email.snippet,
            isSpam: (email.labelIds || []).includes('SPAM'),
            isUnread: (email.labelIds || []).includes('UNREAD')
          };
        } catch (err) {
          console.error('Error fetching email details:', err);
          return null;
        }
      });
      
      // Wait for all message details to be fetched
      const emailResults = await Promise.all(messagePromises);
      const validEmails = emailResults.filter(email => email !== null);
      
      // Filter for potential leads
      const leadEmails = validEmails.filter(email => 
        isPotentialLead(email, LEAD_KEYWORDS)
      );
      
      setEmails(leadEmails);
      logApiState(`Found ${leadEmails.length} potential leads`);
      
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(`Failed to fetch emails: ${error.message}`);
      
      // If the error is due to an invalid token, sign the user out
      if (error.status === 401 || error.status === 403) {
        handleSignOut();
      }
    } finally {
      setIsLoadingEmails(false);
    }
  }, [handleSignOut]);
  
  // Load Google API client
  const loadGapiClient = useCallback(async () => {
    try {
      // Load the Google API Client Library
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(script);
      });
      
      // Initialize the client with the API key and discovery docs
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', {
          callback: () => {
            window.gapi.client.init({
              apiKey: '', // Not needed for OAuth flow
              clientId: GOOGLE_CLIENT_ID,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
              scope: GMAIL_SCOPES
            }).then(() => {
              logApiState('GAPI client initialized');
              resolve();
            }).catch(reject);
          },
          onerror: () => reject(new Error('Failed to load GAPI client')),
          timeout: 10000
        });
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to load GAPI client:', error);
      throw error;
    }
  }, []);
  
  // Initialize Google Identity Services
  const initGoogleAuth = useCallback(async () => {
    try {
      // Check if already signed in
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance && authInstance.isSignedIn.get()) {
        setIsAuthenticated(true);
        fetchEmails();
        return;
      }
      
      // Initialize the auth2 library if not already done
      if (!window.google?.accounts?.oauth2) {
        await loadGisScript();
      }
      
      // Configure the Google OAuth client
      googleAuthClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GMAIL_SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('Google OAuth error:', response);
            setGapiError(`Authentication error: ${response.error}`);
            return;
          }
          // Store the access token for GAPI
          window.gapi.client.setToken({
            access_token: response.access_token,
            expires_in: response.expires_in,
            token_type: 'Bearer'
          });
          setIsAuthenticated(true);
          fetchEmails();
        },
        error_callback: (error) => {
          console.error('Google OAuth error callback:', error);
          setGapiError(`Authentication error: ${error.message || 'Unknown error'}`);
        }
      });
      
      setGapiReady(true);
      logApiState('Google Identity Services initialized');
      
    } catch (error) {
      console.error('Failed to initialize Google Identity Services:', error);
      setGapiError(`Failed to initialize Google authentication: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchEmails]);
  
  // Initialize everything on mount
  useEffect(() => {
    const init = async () => {
      try {
        await loadGapiClient();
        await initGoogleAuth();
      } catch (error) {
        console.error('Initialization error:', error);
        setGapiError(`Initialization error: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    init();
    
    return () => {
      // Cleanup if needed
    };
  }, [initGoogleAuth, loadGapiClient]);

  // Render email list item
  const renderEmailItem = (email) => (
    <React.Fragment key={email.id}>
      <ListItem 
        alignItems="flex-start" 
        button 
        onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.id}`, '_blank')}
      >
        <ListItemAvatar>
          <Avatar>{getInitials(email.from)}</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography
                component="span"
                variant="subtitle2"
                color="text.primary"
                sx={{
                  fontWeight: email.isUnread ? 'bold' : 'normal',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mr: 1
                }}
              >
                {email.from}
              </Typography>
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ whiteSpace: 'nowrap' }}
              >
                {formatDate(email.date)}
              </Typography>
            </Box>
          }
          secondary={
            <>
              <Typography
                component="span"
                variant="subtitle2"
                color="text.primary"
                display="block"
                sx={{
                  fontWeight: email.isUnread ? 'bold' : 'normal',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {email.subject}
              </Typography>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {email.snippet}
              </Typography>
            </>
          }
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" aria-label="refresh" onClick={fetchEmails}>
            <RefreshIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
      <Divider component="li" />
    </React.Fragment>
  );

  // Render authentication prompt
  const renderAuthPrompt = () => (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      textAlign: 'center',
      p: 3
    }}>
      <Typography variant="h6" gutterBottom>
        Connect your Gmail account
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Sign in with your Google account to view and manage potential leads from your Gmail.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSignIn}
        disabled={!gapiReady}
        startIcon={!gapiReady ? <CircularProgress size={20} /> : null}
      >
        {gapiReady ? 'Sign in with Google' : 'Loading...'}
      </Button>
      {gapiError && (
        <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
          {gapiError}
        </Alert>
      )}
    </Box>
  );

  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleBack}>
              Back to Leads
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back to Leads
        </Button>
        
        {isAuthenticated && (
          <Box>
            <Button 
              variant="outlined" 
              onClick={handleSignOut}
              disabled={isLoadingEmails}
              sx={{ mr: 2 }}
            >
              Sign Out
            </Button>
            <Button
              variant="contained"
              onClick={fetchEmails}
              disabled={isLoadingEmails}
              startIcon={isLoadingEmails ? <CircularProgress size={20} /> : <RefreshIcon />}
            >
              {isLoadingEmails ? 'Refreshing...' : 'Refresh'}
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1, overflow: 'hidden' }}>
        <Box sx={{ p: 2, bgcolor: 'primary.main' }}>
          <Typography variant="h6" color="white">
            Gmail Leads
          </Typography>
          <Typography variant="body2" color="white">
            {isAuthenticated 
              ? `Found ${emails.length} potential lead${emails.length !== 1 ? 's' : ''}`
              : 'Connect your Gmail account to find leads'}
          </Typography>
        </Box>
        
        {!isAuthenticated ? (
          renderAuthPrompt()
        ) : emails.length > 0 ? (
          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {emails.map(renderEmailItem)}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No potential leads found in your recent emails.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={fetchEmails}
              disabled={isLoadingEmails}
              startIcon={isLoadingEmails ? <CircularProgress size={20} /> : <RefreshIcon />}
              sx={{ mt: 2 }}
            >
              {isLoadingEmails ? 'Checking...' : 'Check Again'}
            </Button>
          </Box>
        )}
        
        {isLoadingEmails && (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default GmailLeadsPage;
