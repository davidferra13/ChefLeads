import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  Container, Typography, CircularProgress, Alert, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Divider
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Save as SaveIcon, 
  Visibility as ViewIcon, 
  Logout as LogoutIcon, 
  Login as LoginIcon, 
  Person as PersonIcon 
} from '@mui/icons-material';
import { GOOGLE_CLIENT_ID, GMAIL_SCOPES } from '../config/gmail';
import { parseEmailHeaders, formatDate } from '../utils/gmailUtils';
import { useLeads } from '../context/LeadsContext';

// Load Google Identity Services script
const loadGoogleIdentityServices = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      return resolve(true);
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(!!window.google?.accounts);
    script.onerror = () => {
      console.error('Failed to load Google Identity Services');
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

// Fetch user info using Google's userinfo endpoint
const fetchUserInfo = async (accessToken) => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch user info');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box p={3}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

const GmailLeadsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gmail_token') || '');
  const [user, setUser] = useState({ 
    email: localStorage.getItem('gmail_user_email') || '',
    name: localStorage.getItem('gmail_user_name') || 'User',
    imageUrl: localStorage.getItem('gmail_user_photo') || ''
  });
  const clientRef = useRef(null);
  const navigate = useNavigate();
  const { addLead } = useLeads();

  // Initialize Google Auth
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        const loaded = await loadGoogleIdentityServices();
        if (!loaded) {
          setError('Failed to load Google Identity Services');
          return;
        }

        clientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GMAIL_SCOPES.join(' '),
          callback: async (response) => {
            if (response.error) {
              console.error('OAuth error:', response.error);
              setError('Authentication failed. Please try again.');
              return;
            }
            
            const accessToken = response.access_token;
            setToken(accessToken);
            localStorage.setItem('gmail_token', accessToken);
            
            // Fetch user info
            const userInfo = await fetchUserInfo(accessToken);
            if (userInfo) {
              setUser({
                email: userInfo.email,
                name: userInfo.name,
                imageUrl: userInfo.picture
              });
              localStorage.setItem('gmail_user_email', userInfo.email);
              localStorage.setItem('gmail_user_name', userInfo.name);
              localStorage.setItem('gmail_user_photo', userInfo.picture || '');
            }
            
            // Fetch emails after successful auth
            fetchEmails(accessToken);
          },
        });
      } catch (error) {
        console.error('Error initializing Google Auth:', error);
        setError('Failed to initialize Google authentication');
      }
    };

    initializeGoogleAuth();
  }, []);
  
  // Keywords to identify potential leads
  const leadKeywords = [
    'catering', 'event', 'party', 'wedding', 'corporate', 'lunch', 'dinner',
    'buffet', 'menu', 'quote', 'pricing', 'booking', 'reservation', 'inquiry'
  ];

  const isPotentialLead = (email) => {
    if (!email.snippet) return false;
    
    const text = `${email.subject || ''} ${email.snippet}`.toLowerCase();
    return leadKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  };

  // Fetch emails from Gmail API
  const fetchEmails = useCallback(async (accessToken) => {
    if (!accessToken) {
      console.error('No access token provided');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=in:inbox',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to fetch emails');
      }

      const data = await response.json();
      if (!data.messages || data.messages.length === 0) {
        setEmails([]);
        return;
      }

      // Fetch full message details for each email
      const emailDetails = await Promise.all(
        data.messages.slice(0, 10).map(async (message) => {
          try {
            const emailResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From,To,Subject,Date`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!emailResponse.ok) return null;

            const emailData = await emailResponse.json();
            const headers = parseEmailHeaders(emailData.payload.headers);
            
            return {
              id: emailData.id,
              threadId: emailData.threadId,
              from: headers.From,
              to: headers.To,
              subject: headers.Subject || '(No subject)',
              date: headers.Date ? new Date(headers.Date).toLocaleString() : 'Unknown date',
              snippet: emailData.snippet,
              internalDate: emailData.internalDate,
              isLead: isPotentialLead({
                subject: headers.Subject || '',
                snippet: emailData.snippet || ''
              })
            };
          } catch (error) {
            console.error('Error fetching email details:', error);
            return null;
          }
        })
      );

      setEmails(emailDetails.filter(Boolean));
    } catch (error) {
      console.error('Error fetching emails:', error);
      setError(error.message || 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.requestAccessToken();
    }
  }, []);
  
  // Handle sign out
  const handleSignOut = useCallback(() => {
    if (token && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(token, () => {
        setUser({ email: '', name: 'User', imageUrl: '' });
        setToken('');
        setEmails([]);
        localStorage.removeItem('gmail_token');
        localStorage.removeItem('gmail_user_email');
        localStorage.removeItem('gmail_user_name');
        localStorage.removeItem('gmail_user_photo');
      });
    }
  }, [token]);
  
  // Handle save as lead
  const handleSaveAsLead = useCallback(async (email) => {
    try {
      if (!email) return;
      
      console.log('Saving email as lead:', email);
      
      // Extract name and email from the from field
      const fromName = email.from?.split('<')[0]?.trim() || 'Unknown Sender';
      const fromEmail = email.from?.match(/<([^>]+)>/)?.[1] || email.from || 'no-reply@example.com';
      
      // Create a simple lead object with required fields for the table
      const newLead = {
        id: Date.now(), // Use timestamp as ID
        host: fromName,
        title: email.subject || 'New Email Lead',
        date: new Date().toISOString().split('T')[0], // Today's date as default
        location: 'Email',
        status: 'New',
        guestCount: '0',
        // Add empty fields that the form might expect
        time: '12:00',
        servingTime: '',
        eventTheme: '',
        menuDetails: email.snippet || '',
        allergies: '',
        dietaryRestrictions: '',
        specialRequests: '',
        feedbackNotes: `Email from: ${fromEmail}\n\n${email.snippet || ''}`,
        // Include contact info
        contact: {
          name: fromName,
          email: fromEmail,
          phone: ''
        },
        source: 'Gmail',
        createdAt: new Date().toISOString(),
        // Store the raw email for reference
        rawEmail: email
      };
      
      console.log('New lead data:', newLead);
      
      // Add the lead
      addLead(newLead);
      
      // Show success message
      setError('');
      alert('Lead saved successfully!');
      
      // Optional: navigate to leads page
      // navigate('/leads');
    } catch (error) {
      console.error('Error saving lead:', error);
      setError('Failed to save lead. Please try again.');
      alert('Error saving lead. Please check the console for details.');
    }
  }, [addLead]);
  
  // Handle view email
  const handleViewEmail = useCallback((email) => {
    setSelectedEmail(email);
  }, []);
  
  // Handle close email dialog
  const handleCloseEmailDialog = useCallback(() => {
    setSelectedEmail(null);
  }, []);

  return (
    <div>
      <Navigation />
      <ErrorBoundary>
        <Container maxWidth="lg" sx={{ py: 4, pt: 12 }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Gmail Leads
            </Typography>
            
            {token ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {user.imageUrl ? (
                    <Avatar 
                      src={user.imageUrl} 
                      alt={user.name} 
                      sx={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                  <Typography variant="body1">
                    {user.name || user.email}
                  </Typography>
                </Box>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<LogoutIcon />}
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </Box>
            ) : (
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<LoginIcon />}
                onClick={handleSignIn}
                disabled={!window.google?.accounts}
              >
                Sign in with Google
              </Button>
            )}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : token && emails.length === 0 ? (
            <Alert severity="info">
              No emails found in your inbox. Try refreshing or check back later.
            </Alert>
          ) : token ? (
            <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Potential Leads from Gmail
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={() => fetchEmails(token)}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>From</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {emails.map((email) => (
                      <TableRow 
                        key={email.id}
                        sx={{ 
                          '&:hover': { 
                            backgroundColor: 'action.hover'
                          },
                          backgroundColor: email.isLead ? 'rgba(76, 175, 80, 0.08)' : 'inherit'
                        }}
                      >
                        <TableCell>{email.from}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {email.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {email.snippet}
                          </Typography>
                        </TableCell>
                        <TableCell>{email.date}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewEmail(email)}
                              title="View Email"
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<SaveIcon />}
                              onClick={() => handleSaveAsLead(email)}
                              disabled={!email.isLead}
                              title={email.isLead ? 'Save as Lead' : 'Not a potential lead'}
                            >
                              Save
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Connect Your Gmail Account
              </Typography>
              <Typography variant="body1" paragraph>
                Sign in with Google to view and manage potential leads from your Gmail inbox.
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                startIcon={<LoginIcon />}
                onClick={handleSignIn}
                disabled={!window.google?.accounts}
                sx={{ mt: 2 }}
              >
                Sign in with Google
              </Button>
            </Paper>
          )}
        </Container>

        {/* Email View Dialog */}
        <Dialog 
          open={!!selectedEmail} 
          onClose={handleCloseEmailDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedEmail?.subject || 'No Subject'}
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                From: {selectedEmail?.from}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                To: {selectedEmail?.to}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Date: {selectedEmail?.date}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" whiteSpace="pre-wrap">
              {selectedEmail?.snippet || 'No content available'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEmailDialog}>Close</Button>
            <Button 
              variant="contained" 
              onClick={() => {
                handleSaveAsLead(selectedEmail);
                handleCloseEmailDialog();
              }}
              startIcon={<SaveIcon />}
              disabled={!selectedEmail?.isLead}
            >
              Save as Lead
            </Button>
          </DialogActions>
        </Dialog>
      </ErrorBoundary>
    </div>
  );
};

export default GmailLeadsPage;
