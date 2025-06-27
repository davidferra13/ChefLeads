import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import {
  Container, Typography, CircularProgress, Alert, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Button, IconButton, 
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Save as SaveIcon, 
  Visibility as ViewIcon, 
  Logout as LogoutIcon, 
  Login as LoginIcon, 
  Person as PersonIcon,
  People as PeopleIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  RestaurantMenu as MenuIcon,
  Warning as AllergyIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { GOOGLE_CLIENT_ID, GMAIL_SCOPES } from '../config/gmail';
import { useLeads } from '../context/LeadsContext';
import { formatDate } from '../utils/gmailUtils';
// Direct Gmail API integration

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
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('google_token') || '');
  const [user, setUser] = useState({ 
    email: localStorage.getItem('gmail_user_email') || '',
    name: localStorage.getItem('gmail_user_name') || 'User',
    imageUrl: localStorage.getItem('gmail_user_photo') || ''
  });
  
  const { addLead } = useLeads();
  const clientRef = useRef();
  const navigate = useNavigate();

  const fetchLeads = useCallback(async (accessToken) => {
    if (!accessToken) {
      console.error('No access token provided for fetching leads');
      return;
    }
    
    console.log('Fetching emails from Gmail API...');
    setLoading(true);
    setError('');
    
    try {
      // First, get the list of messages
      const messagesResponse = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        throw new Error(errorData.error?.message || 'Failed to fetch messages');
      }
      
      const { messages = [] } = await messagesResponse.json();
      console.log(`Found ${messages.length} messages`);
      
      // Get full message details for each message
      const messagePromises = messages.map(async (message) => {
        const messageResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!messageResponse.ok) {
          console.error(`Failed to fetch message ${message.id}`);
          return null;
        }
        
        return messageResponse.json();
      });
      
      const messagesData = (await Promise.all(messagePromises)).filter(Boolean);
      console.log(`Successfully fetched ${messagesData.length} messages`);
      
      // Process messages into leads
      const leads = messagesData.map(message => {
        const headers = message.payload.headers.reduce((acc, header) => {
          acc[header.name.toLowerCase()] = header.value;
          return acc;
        }, {});
        
        return {
          id: message.id,
          subject: headers.subject || 'No Subject',
          from: headers.from || 'Unknown Sender',
          to: headers.to || '',
          date: headers.date || '',
          snippet: message.snippet,
          rawEmail: message
        };
      });
      
      setLeads(leads);
    } catch (err) {
      console.error('Error fetching leads:', err);
      setError(`Failed to fetch emails: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Initialize Google Identity Services
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
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
          prompt: 'select_account',
          callback: async (response) => {
            if (response.error) {
              setError(response.error);
              return;
            }
            
            const accessToken = response.access_token;
            setToken(accessToken);
            localStorage.setItem('google_token', accessToken);
            
            // Get user info
            try {
              const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });
              
              if (userInfoResponse.ok) {
                const userData = await userInfoResponse.json();
                setUser({
                  email: userData.email,
                  name: userData.name || userData.email.split('@')[0],
                  imageUrl: userData.picture || ''
                });
                
                localStorage.setItem('gmail_user_email', userData.email);
                localStorage.setItem('gmail_user_name', userData.name || userData.email.split('@')[0]);
                localStorage.setItem('gmail_user_photo', userData.picture || '');
              }
              
              // Fetch leads after successful login
              fetchLeads(accessToken);
              
            } catch (err) {
              console.error('Error fetching user info:', err);
              setError('Failed to load user information');
            }
          },
          error_callback: (error) => {
            console.error('Google OAuth error:', error);
            setError('Failed to sign in with Google');
          }
        });
      } catch (err) {
        console.error('Error initializing Google Auth:', err);
        setError('Failed to initialize Google authentication');
      }
    };

    // Check for existing token
    const checkExistingToken = () => {
      const storedToken = localStorage.getItem('google_token');
      if (storedToken) {
        setToken(storedToken);
        setUser({
          email: localStorage.getItem('gmail_user_email') || '',
          name: localStorage.getItem('gmail_user_name') || 'User',
          imageUrl: localStorage.getItem('gmail_user_photo') || ''
        });
        fetchLeads(storedToken);
      }
    };

    initializeGoogleAuth();
    checkExistingToken();
  }, [fetchLeads]);
  
  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.requestAccessToken();
    }
  }, []);
  
  // Handle sign out
  const handleSignOut = useCallback(() => {
    try {
      // Revoke the Google token if available
      if (window.google?.accounts?.oauth2) {
        window.google.accounts.oauth2.revoke(token);
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    } finally {
      // Clear local state and storage
      setUser({ email: '', name: 'User', imageUrl: '' });
      setToken('');
      setLeads([]);
      localStorage.removeItem('google_token');
      localStorage.removeItem('gmail_user_email');
      localStorage.removeItem('gmail_user_name');
      localStorage.removeItem('gmail_user_photo');
    }
  }, [token]);

  // Handle save as lead
  const handleSaveAsLead = useCallback((leadToSave) => {
    if (!leadToSave) return;
    
    console.log('Saving parsed lead:', leadToSave);
    
    const newLead = {
      ...leadToSave,
      id: Date.now(), // Ensure a unique ID for the context
      status: 'New',
    };
    
    addLead(newLead);
    navigate('/leads');
  }, [addLead, navigate]);

  const handleCloseDialog = () => {
    setSelectedLead(null);
  };

  const renderDetail = (Icon, primary, secondary) => (
    secondary && (
      <ListItem>
        <ListItemIcon><Icon /></ListItemIcon>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    )
  );

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex' }}>
        <Navigation />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography component="h1" variant="h5" color="primary" gutterBottom>
                Gmail Leads
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {user.email ? (
                  <>
                    <Avatar src={user.imageUrl} sx={{ width: 32, height: 32, mr: 1 }} />
                    <Typography variant="body1" sx={{ mr: 2 }}>{user.name}</Typography>
                    <IconButton onClick={() => fetchLeads(token)} disabled={loading}><RefreshIcon /></IconButton>
                    <IconButton onClick={handleSignOut}><LogoutIcon /></IconButton>
                  </>
                ) : (
                  <Button startIcon={<LoginIcon />} onClick={handleSignIn} variant="contained">
                    Sign in with Google
                  </Button>
                )}
              </Box>
            </Box>

            {loading && <CircularProgress sx={{ alignSelf: 'center', my: 4 }} />}
            {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
            
            {!loading && !error && token && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Host</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Guests</TableCell>
                      <TableCell>Event Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leads.length > 0 ? leads.map((lead) => (
                      <TableRow key={lead.rawEmail.id}>
                        <TableCell>{lead.hostName || 'N/A'}</TableCell>
                        <TableCell>{lead.eventTitle || 'N/A'}</TableCell>
                        <TableCell>{lead.guestCount || 'N/A'}</TableCell>
                        <TableCell>{lead.eventDate ? formatDate(lead.eventDate) : 'N/A'}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => setSelectedLead(lead)}><ViewIcon /></IconButton>
                          <IconButton size="small" onClick={() => handleSaveAsLead(lead)}><SaveIcon /></IconButton>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No potential leads found in the last 14 days.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {/* View Lead Dialog */}
          <Dialog open={!!selectedLead} onClose={handleCloseDialog} fullWidth maxWidth="sm">
            <DialogTitle>Lead Details</DialogTitle>
            <DialogContent dividers>
              {selectedLead && (
                <List dense>
                  {renderDetail(PersonIcon, "Host", selectedLead.hostName)}
                  {renderDetail(EventIcon, "Event Title", selectedLead.eventTitle)}
                  {renderDetail(PeopleIcon, "Guest Count", selectedLead.guestCount)}
                  {renderDetail(EventIcon, "Event Date", selectedLead.eventDate)}
                  {renderDetail(TimeIcon, "Event Time", selectedLead.eventTime)}
                  {renderDetail(LocationIcon, "Location", selectedLead.location)}
                  {renderDetail(MenuIcon, "Menu Details", selectedLead.menuDetails)}
                  {renderDetail(AllergyIcon, "Allergies", selectedLead.allergies)}
                  {renderDetail(InfoIcon, "Dietary Restrictions", selectedLead.dietaryRestrictions)}
                  {renderDetail(InfoIcon, "Special Requests", selectedLead.specialRequests)}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button 
                onClick={() => { 
                  handleSaveAsLead(selectedLead); 
                  handleCloseDialog(); 
                }} 
                variant="contained"
                startIcon={<SaveIcon />}
              >
                Save as Lead
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </ErrorBoundary>
  );
};

export default GmailLeadsPage;
