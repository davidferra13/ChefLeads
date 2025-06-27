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
  Chip,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  ArrowBack as ArrowBackIcon, 
  AccountCircle, 
  Add, 
  Logout 
} from '@mui/icons-material';
import { GOOGLE_CLIENT_ID, GMAIL_SCOPES } from '../config/gmail';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error in GmailLeadsPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ mt: 4, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            We're having trouble loading the Gmail integration. Please try again later.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Container>
      );
    }
    return this.props.children;
  }
}

// Utility functions
const containsLeadKeywords = (text) => {
  if (!text) return false;
  const keywords = ['job', 'opportunity', 'hire', 'freelance', 'contract', 'work', 'project'];
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
};

const parseEmailHeaders = (headers = []) => {
  return headers.reduce((acc, header) => {
    acc[header.name.toLowerCase()] = header.value;
    return acc;
  }, {});
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

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
      console.log('Google Identity Services already loaded');
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('Google Identity Services script loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script');
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.head.appendChild(script);
  });
};

// Load Google API client
const loadGapiClient = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi?.client) {
      console.log('GAPI client already loaded');
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('GAPI script loaded, initializing client...');
      window.gapi.load('client', {
        callback: async () => {
          try {
            await window.gapi.client.init({
              apiKey: '', // Not needed for OAuth2
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
            });
            console.log('GAPI client initialized');
            resolve();
          } catch (error) {
            console.error('Error initializing GAPI client:', error);
            reject(error);
          }
        },
        onerror: (error) => {
          console.error('Error loading GAPI client:', error);
          reject(error);
        },
        timeout: 10000,
        ontimeout: () => {
          console.error('Timeout loading GAPI client');
          reject(new Error('Timeout loading GAPI client'));
        }
      });
    };
    
    script.onerror = () => {
      console.error('Failed to load GAPI script');
      reject(new Error('Failed to load GAPI script'));
    };
    
    document.head.appendChild(script);
  });
};

const GmailLeadsPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const [gapiReady, setGapiReady] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const googleAuthClient = useRef(null);
  const isMounted = useRef(true);
  const accountMenuAnchor = useRef(null);
  
  // Handle component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Fetch user info from Google API
  const fetchUserInfo = async () => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${window.gapi.client.getToken().access_token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  };
  
  // Handle token response from Google OAuth
  const handleTokenResponse = async (tokenResponse) => {
    try {
      if (!isMounted.current) return;
      
      // Set the token for GAPI
      window.gapi.client.setToken(tokenResponse);
      
      // Fetch user info
      const userInfo = await fetchUserInfo();
      
      // Create account object
      const newAccount = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split('@')[0],
        picture: userInfo.picture,
        token: tokenResponse
      };
      
      // Update accounts state
      setAccounts(prevAccounts => {
        // Check if account already exists
        const exists = prevAccounts.some(acc => acc.email === newAccount.email);
        const updatedAccounts = exists 
          ? prevAccounts.map(acc => acc.email === newAccount.email ? { ...acc, ...newAccount } : acc)
          : [...prevAccounts, newAccount];
        
        // Save to localStorage
        localStorage.setItem('gmailAccounts', JSON.stringify(updatedAccounts));
        return updatedAccounts;
      });
      
      setCurrentAccount(newAccount);
      setIsAuthenticated(true);
      setError(null);
      
      // Fetch emails for this account
      fetchEmails(tokenResponse);
      
    } catch (error) {
      console.error('Error handling token response:', error);
      if (isMounted.current) {
        setError('Failed to authenticate with Google. Please try again.');
      }
    }
  };
  
  // Fetch emails from Gmail API
  const fetchEmails = async (token) => {
    if (!isMounted.current || !token) return;
    
    try {
      setIsLoadingEmails(true);
      setError(null);
      
      // Set the token for GAPI
      window.gapi.client.setToken(token);
      
      // Fetch messages
      const response = await window.gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 20,
        q: 'in:inbox is:unread'
      });
      
      const messages = response.result.messages || [];
      const emailPromises = messages.map(msg => 
        window.gapi.client.gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'metadata',
          metadataHeaders: ['From', 'To', 'Subject', 'Date']
        })
      );
      
      const emailResponses = await Promise.all(emailPromises);
      const formattedEmails = emailResponses
        .map(res => {
          const headers = parseEmailHeaders(res.result.payload.headers);
          const snippet = res.result.snippet || '';
          const isPotentialLead = containsLeadKeywords(snippet) || 
                               containsLeadKeywords(headers.subject || '');
          
          return {
            id: res.result.id,
            from: headers.from,
            to: headers.to,
            subject: headers.subject || '(No subject)',
            date: formatDate(headers.date),
            snippet: snippet.length > 100 ? `${snippet.substring(0, 100)}...` : snippet,
            isPotentialLead,
            threadId: res.result.threadId
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (isMounted.current) {
        setEmails(formattedEmails);
      }
      
    } catch (error) {
      console.error('Error fetching emails:', error);
      if (isMounted.current) {
        setError('Failed to fetch emails. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoadingEmails(false);
      }
    }
  };
  
  // Initialize Google APIs
  useEffect(() => {
    const initializeGoogleApis = async () => {
      try {
        await Promise.all([
          loadGisScript(),
          loadGapiClient()
        ]);
        
        setGapiReady(true);
        
        // Initialize the token client
        googleAuthClient.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GMAIL_SCOPES.join(' '),
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              handleTokenResponse(tokenResponse);
            }
          },
          error_callback: (error) => {
            console.error('Error during token client initialization:', error);
            if (isMounted.current) {
              setError('Failed to initialize Google authentication');
              setIsLoading(false);
            }
          }
        });
        
        // Check for existing tokens in localStorage
        const savedAccounts = JSON.parse(localStorage.getItem('gmailAccounts') || '[]');
        if (savedAccounts.length > 0) {
          setAccounts(savedAccounts);
          setCurrentAccount(savedAccounts[0]);
          setIsAuthenticated(true);
          fetchEmails(savedAccounts[0].token);
        }
        
      } catch (error) {
        console.error('Error initializing Google APIs:', error);
        if (isMounted.current) {
          setError('Failed to load Google services. Please try again later.');
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    initializeGoogleApis();
  }, []);
  
  // Handle sign in
  const handleSignIn = () => {
    if (!gapiReady || !googleAuthClient.current) {
      setError('Google services not ready. Please try again.');
      return;
    }
    
    try {
      googleAuthClient.current.requestAccessToken({
        prompt: 'consent',
        include_granted_scopes: true
      });
    } catch (error) {
      console.error('Error during sign in:', error);
      setError('Failed to start Google sign in. Please try again.');
    }
  };
  
  // Handle sign out
  const handleSignOut = (accountId = null) => {
    if (accountId) {
      // Sign out specific account
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(updatedAccounts);
      localStorage.setItem('gmailAccounts', JSON.stringify(updatedAccounts));
      
      if (currentAccount && currentAccount.id === accountId) {
        // If current account is signed out, switch to another account or sign out completely
        if (updatedAccounts.length > 0) {
          setCurrentAccount(updatedAccounts[0]);
          fetchEmails(updatedAccounts[0].token);
        } else {
          handleSignOutAll();
        }
      }
    } else {
      // Sign out all accounts
      handleSignOutAll();
    }
    
    setAccountMenuOpen(false);
  };
  
  const handleSignOutAll = () => {
    // Revoke all tokens
    accounts.forEach(account => {
      if (account.token && account.token.access_token) {
        window.google.accounts.oauth2.revoke(account.token.access_token, () => {
          console.log(`Token revoked for ${account.email}`);
        });
      }
    });
    
    // Clear state
    setAccounts([]);
    setCurrentAccount(null);
    setIsAuthenticated(false);
    setEmails([]);
    localStorage.removeItem('gmailAccounts');
    
    // Clear GAPI token
    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken(null);
    }
  };
  
  // Handle account switch
  const handleAccountSwitch = (account) => {
    setCurrentAccount(account);
    setAccountMenuOpen(false);
    fetchEmails(account.token);
  };
  
  // Handle refresh emails
  const handleRefresh = () => {
    if (currentAccount) {
      fetchEmails(currentAccount.token);
    }
  };
  
  // Render account menu
  const renderAccountMenu = () => (
    <Menu
      anchorEl={accountMenuAnchor.current}
      open={accountMenuOpen}
      onClose={() => setAccountMenuOpen(false)}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: 'visible',
          filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
          mt: 1.5,
          '& .MuiAvatar-root': {
            width: 32,
            height: 32,
            ml: -0.5,
            mr: 1,
          },
        },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {accounts.map((account) => (
        <MenuItem 
          key={account.id} 
          onClick={() => handleAccountSwitch(account)}
          selected={currentAccount && currentAccount.id === account.id}
        >
          <ListItemIcon>
            <Avatar 
              src={account.picture} 
              alt={account.name}
              sx={{ width: 24, height: 24 }}
            >
              {getInitials(account.name)}
            </Avatar>
          </ListItemIcon>
          <ListItemText 
            primary={account.name} 
            secondary={account.email} 
            primaryTypographyProps={{ noWrap: true }}
            secondaryTypographyProps={{ noWrap: true }}
          />
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSignOut(account.id);
            }}
            edge="end"
          >
            <Logout fontSize="small" />
          </IconButton>
        </MenuItem>
      ))}
      <Divider />
      <MenuItem onClick={() => {
        setAccountMenuOpen(false);
        handleSignIn();
      }}>
        <ListItemIcon>
          <Add fontSize="small" />
        </ListItemIcon>
        Add another account
      </MenuItem>
      {accounts.length > 0 && (
        <MenuItem onClick={() => handleSignOut()}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sign out all accounts
        </MenuItem>
      )}
    </Menu>
  );
  
  // Render email list
  const renderEmailList = () => {
    if (isLoadingEmails) {
      return (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (emails.length === 0) {
      return (
        <Box my={4} textAlign="center">
          <Typography variant="body1" color="textSecondary">
            No emails found. Try refreshing the list.
          </Typography>
        </Box>
      );
    }
    
    return (
      <List>
        {emails.map((email, index) => (
          <React.Fragment key={email.id}>
            <ListItem 
              button 
              onClick={() => {
                window.open(`https://mail.google.com/mail/u/${currentAccount.email}/#inbox/${email.threadId || email.id}`, '_blank');
              }}
            >
              <ListItemAvatar>
                <Avatar>{getInitials(email.from)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    <Typography 
                      component="span" 
                      variant="subtitle2" 
                      noWrap 
                      sx={{ 
                        flex: 1,
                        fontWeight: email.isPotentialLead ? 'bold' : 'normal',
                        color: email.isPotentialLead ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {email.from}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      {email.date}
                    </Typography>
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        display: 'block',
                        fontWeight: email.isPotentialLead ? 'bold' : 'normal',
                        color: email.isPotentialLead ? 'primary.main' : 'text.primary'
                      }}
                      noWrap
                    >
                      {email.subject}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                    >
                      {email.snippet}
                    </Typography>
                  </>
                }
              />
              {email.isPotentialLead && (
                <ListItemSecondaryAction>
                  <Chip 
                    label="Potential Lead" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              )}
            </ListItem>
            {index < emails.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" mt={2}>
          Loading Gmail integration...
        </Typography>
      </Container>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>
      </Container>
    );
  }
  
  // Render main content
  return (
    <ErrorBoundary>
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center">
              <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" component="h1">
                Gmail Leads
              </Typography>
            </Box>
            
            <Box>
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={isLoadingEmails}
                    sx={{ mr: 1 }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      currentAccount?.picture ? (
                        <Avatar 
                          src={currentAccount.picture} 
                          alt={currentAccount.name}
                          sx={{ width: 24, height: 24 }}
                        />
                      ) : (
                        <AccountCircle />
                      )
                    }
                    onClick={(e) => {
                      accountMenuAnchor.current = e.currentTarget;
                      setAccountMenuOpen(true);
                    }}
                  >
                    {currentAccount?.name || 'Account'}
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AccountCircle />}
                  onClick={handleSignIn}
                  disabled={!gapiReady}
                >
                  Sign in with Google
                </Button>
              )}
            </Box>
          </Box>
          
          {renderAccountMenu()}
          
          {!isAuthenticated ? (
            <Box textAlign="center" my={8}>
              <AccountCircle sx={{ fontSize: 64, color: 'action.active', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Sign in to view your Gmail leads
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Connect your Gmail account to discover potential leads in your inbox.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AccountCircle />}
                onClick={handleSignIn}
                disabled={!gapiReady}
                sx={{ mt: 2 }}
              >
                Sign in with Google
              </Button>
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {renderEmailList()}
            </>
          )}
        </Box>
      </Container>
    </ErrorBoundary>
  );
};

export default GmailLeadsPage;
