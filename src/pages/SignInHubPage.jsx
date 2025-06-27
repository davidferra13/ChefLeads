import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GOOGLE_CLIENT_ID } from '../config/gmail';
import AuthDialog from '../components/auth/AuthDialog';
import useConnections from '../hooks/useConnections';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  AppBar, 
  Toolbar, 
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Email as EmailIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Language as LanguageIcon, 
  Home as AirbnbIcon,
  WhatsApp as WhatsAppIcon,
  Sms as SmsIcon,
  MovieFilter as TikTokIcon,
  Web as WixIcon,
  CloudUpload as UploadIcon,
  Star as YelpIcon,
  Restaurant as OpenTableIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Send as TelegramIcon
} from '@mui/icons-material';

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

// Platform connection data
const platforms = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: <EmailIcon sx={{ fontSize: 40 }} />,
    description: 'Automatically detect dinner inquiries from your inbox.',
    isConnected: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <FacebookIcon sx={{ fontSize: 40 }} />,
    description: 'Sync business messages and comments.',
    isConnected: false
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <InstagramIcon sx={{ fontSize: 40 }} />,
    description: 'Import DMs and mentions as lead activity.',
    isConnected: true
  },
  {
    id: 'takeachef',
    name: 'Take a Chef',
    icon: <LanguageIcon sx={{ fontSize: 40 }} />,
    description: 'Pull direct client inquiries from Take a Chef.',
    isConnected: false
  },
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: <AirbnbIcon sx={{ fontSize: 40 }} />,
    description: 'Connect to your Airbnb host inbox for bookings.',
    isConnected: true
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    icon: <WhatsAppIcon sx={{ fontSize: 40 }} />,
    description: 'Import lead conversations from WhatsApp.',
    isConnected: false
  },
  {
    id: 'sms',
    name: 'Phone (SMS)',
    icon: <SmsIcon sx={{ fontSize: 40 }} />,
    description: 'Link your Twilio or phone provider for text leads.',
    isConnected: false
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: <TikTokIcon sx={{ fontSize: 40 }} />,
    description: 'Get lead DMs and tagged comments from TikTok.',
    isConnected: true
  },
  // Telegram integration removed per request
  {
    id: 'wix',
    name: 'Wix',
    icon: <WixIcon sx={{ fontSize: 40 }} />,
    description: 'Capture contact form submissions from your website.',
    isConnected: false
  },
  {
    id: 'manual',
    name: 'Manual Upload',
    icon: <UploadIcon sx={{ fontSize: 40 }} />,
    description: 'Import a CSV of client emails or leads.',
    isConnected: true
  },
  // Coming soon platforms (grayed out)
  {
    id: 'yelp',
    name: 'Yelp',
    icon: <YelpIcon sx={{ fontSize: 40 }} />,
    description: 'Coming Soon',
    isConnected: false,
    isDisabled: true
  },
  {
    id: 'opentable',
    name: 'OpenTable',
    icon: <OpenTableIcon sx={{ fontSize: 40 }} />,
    description: 'Coming Soon',
    isConnected: false,
    isDisabled: true
  },
];

const SignInHubPage = () => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const fileInputRef = useRef(null);
  
  const [connectedPlatforms, setConnectedPlatforms] = useState(
    platforms.filter(platform => platform.isConnected).map(platform => platform.id)
  );
  const [authDialog, setAuthDialog] = useState({ open: false, platform: null });
  // Telegram integration removed
  const [loading, setLoading] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Google Auth
  const googleClientRef = useRef();
  
  // Handle file upload for manual CSV import
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Here you would process the CSV file
    // For now, we'll just simulate a successful upload
    setTimeout(() => {
      setConnectedPlatforms(prev => {
        if (!prev.includes('manual')) {
          return [...prev, 'manual'];
        }
        return prev;
      });

      setNotification({
        open: true,
        message: `Successfully imported data from ${file.name}`,
        severity: 'success'
      });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1000);
  };
  
  // Check for auth callback parameters
  useEffect(() => {
    // Get URL search parameters
    const queryParams = new URLSearchParams(window.location.search);
    const platform = queryParams.get('platform');
    const status = queryParams.get('status');
    const error = queryParams.get('error');
    
    if (platform) {
      if (status === 'success') {
        // Handle successful authentication
        setConnectedPlatforms(prev => {
          if (!prev.includes(platform)) {
            return [...prev, platform];
          }
          return prev;
        });
        
        setNotification({
          open: true,
          message: `Successfully connected to ${platform}`,
          severity: 'success'
        });
        
        // Clear URL parameters without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        // Handle authentication error
        setNotification({
          open: true,
          message: `Failed to connect to ${platform}: ${error}`,
          severity: 'error'
        });
        
        // Clear URL parameters without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);
  
  // Initialize Google Identity Services
  useEffect(() => {
    const initializeGoogleAuth = async () => {
      try {
        const loaded = await loadGoogleIdentityServices();
        if (!loaded) {
          console.error('Failed to load Google Identity Services');
          return;
        }

        googleClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/gmail.readonly',
          prompt: 'select_account',
          callback: async (response) => {
            if (response.error) {
              console.error('Google OAuth error:', response.error);
              setNotification({
                open: true,
                message: `Failed to connect Gmail: ${response.error}`,
                severity: 'error'
              });
              return;
            }
            
            const accessToken = response.access_token;
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
                localStorage.setItem('gmail_user_email', userData.email);
                localStorage.setItem('gmail_user_name', userData.name || userData.email.split('@')[0]);
                localStorage.setItem('gmail_user_photo', userData.picture || '');
                
                // Success - update connected platforms
                setConnectedPlatforms(prev => {
                  if (!prev.includes('gmail')) {
                    return [...prev, 'gmail'];
                  }
                  return prev;
                });
                
                setNotification({
                  open: true,
                  message: 'Successfully connected to Gmail',
                  severity: 'success'
                });
              }
            } catch (err) {
              console.error('Error fetching user info:', err);
              setNotification({
                open: true,
                message: 'Failed to load user information',
                severity: 'error'
              });
            } finally {
              setLoading(prev => ({ ...prev, gmail: false }));
            }
          },
          error_callback: (error) => {
            console.error('Google OAuth error:', error);
            setNotification({
              open: true,
              message: 'Failed to sign in with Google',
              severity: 'error'
            });
            setLoading(prev => ({ ...prev, gmail: false }));
          }
        });
      } catch (err) {
        console.error('Error initializing Google Auth:', err);
      }
    };

    // Check for existing tokens from localStorage
    const checkExistingTokens = () => {
      // Check Gmail
      const googleToken = localStorage.getItem('google_token');
      if (googleToken) {
        setConnectedPlatforms(prev => {
          if (!prev.includes('gmail')) {
            return [...prev, 'gmail'];
          }
          return prev;
        });
      }
    };

    initializeGoogleAuth();
    checkExistingTokens();
  }, []);
  
  // Handle actual platform connections
  const handleConnectPlatform = (platform) => {
    // Don't do anything for disabled platforms
    if (platform.isDisabled) {
      return;
    }
    
    // If already connected, handle disconnect
    if (connectedPlatforms.includes(platform.id)) {
      handleDisconnectPlatform(platform);
      return;
    }
    
    setLoading(prev => ({ ...prev, [platform.id]: true }));
    
    // Handle different authentication methods per platform
    switch (platform.id) {
      case 'gmail':
        // Use Google's OAuth flow (real implementation)
        if (googleClientRef.current) {
          googleClientRef.current.requestAccessToken();
        } else {
          setNotification({
            open: true, 
            message: 'Google authentication not initialized',
            severity: 'error'
          });
          setLoading(prev => ({ ...prev, [platform.id]: false }));
        }
        break;
        
      case 'facebook':
        // Facebook Login - redirect to Facebook OAuth
        window.open('https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=' + 
          encodeURIComponent(window.location.origin + '/facebook-auth-callback') + 
          '&state=facebook&scope=email,pages_manage_metadata', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'instagram':
        // Instagram Login - redirect to Instagram OAuth
        window.open('https://api.instagram.com/oauth/authorize?client_id=YOUR_IG_APP_ID&redirect_uri=' + 
          encodeURIComponent(window.location.origin + '/instagram-auth-callback') + 
          '&scope=user_profile,user_media&response_type=code', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'takeachef':
        // Redirect to Take a Chef login page
        window.open('https://www.takeachef.com/en-us/login', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'airbnb':
        // Redirect to Airbnb login page
        window.open('https://www.airbnb.com/login', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'whatsapp':
        // Redirect to WhatsApp Web
        window.open('https://web.whatsapp.com/', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'sms':
        // Redirect to Twilio login page
        window.open('https://login.twilio.com/', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'tiktok':
        // TikTok Login - redirect to TikTok OAuth
        window.open('https://www.tiktok.com/auth/authorize/?client_key=YOUR_APP_KEY&response_type=code&scope=user.info.basic&redirect_uri=' + 
          encodeURIComponent(window.location.origin + '/tiktok-auth-callback'), '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      case 'wix':
        // Redirect to Wix login page
        window.open('https://users.wix.com/signin', '_blank');
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      // Telegram integration removed
        
      case 'manual':
        // Show file upload dialog
        if (fileInputRef.current) {
          fileInputRef.current.click();
        }
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
        
      // For other platforms, show platform-specific auth dialog
      default:
        // Mock authentication flow
        setAuthDialog({ open: true, platform });
        setLoading(prev => ({ ...prev, [platform.id]: false }));
        break;
    }
  };
  
  // Handle platform disconnection
  const handleDisconnectPlatform = (platform) => {
    switch (platform.id) {
      // Telegram integration removed
        
      case 'gmail':
        // Revoke Google token if available
        try {
          const token = localStorage.getItem('google_token');
          if (token && window.google?.accounts?.oauth2) {
            window.google.accounts.oauth2.revoke(token);
          }
        } catch (err) {
          console.error('Error during sign out:', err);
        } finally {
          // Clear local storage for Gmail
          localStorage.removeItem('google_token');
          localStorage.removeItem('gmail_user_email');
          localStorage.removeItem('gmail_user_name');
          localStorage.removeItem('gmail_user_photo');
        }
        break;
        
      // Handle other platform disconnections
      default:
        // For mock platforms, just remove them from state
        break;
    }
    
    // Update connected platforms state
    setConnectedPlatforms(prev => prev.filter(id => id !== platform.id));
    
    setNotification({
      open: true,
      message: `Disconnected from ${platform.name}`,
      severity: 'info'
    });
  };
  
  // Handle mock auth dialog submission
  const handleMockAuthSubmit = () => {
    const { platform } = authDialog;
    if (!platform) return;
    
    // Add platform to connected list
    setConnectedPlatforms(prev => {
      if (!prev.includes(platform.id)) {
        return [...prev, platform.id];
      }
      return prev;
    });
    
    setNotification({
      open: true,
      message: `Successfully connected to ${platform.name}`,
      severity: 'success'
    });
    
    // Close dialog
    setAuthDialog({ open: false, platform: null });
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" color="default" elevation={1} sx={{ height: 64 }}>
        <Toolbar sx={{ height: '100%', justifyContent: 'space-between' }}>
          {/* Logo and brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <LanguageIcon sx={{ mr: 1 }} /> Chef Booking
            </Typography>
          </Box>
          
          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link to="/leads" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography>Leads</Typography>
            </Link>
            <Link to="/calendar" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography>Calendar</Typography>
            </Link>
            <Link to="/account-connections" style={{ textDecoration: 'none', color: theme.palette.primary.main }}>
              <Typography sx={{ fontWeight: 'bold' }}>Account Connections</Typography>
            </Link>
            <Button 
              variant="contained" 
              color="primary" 
              component={Link} 
              to="/add-lead"
              sx={{ ml: 2, height: 36, width: 100 }}
            >
              + Add Lead
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: 32 }}>
            Account Connections
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
            Sign in to any platform below to automatically pull in leads from your inboxes, DMs, and booking tools. All connections are encrypted and secure.
          </Typography>
        </Box>
        
        {/* Platforms Grid */}
        <Grid container spacing={3} justifyContent="center">
          {platforms.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={platform.id}>
                <Card 
                  sx={{ 
                    height: 190, 
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.09)'
                    },
                    opacity: platform.isDisabled ? 0.6 : 1
                  }}
                >
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
                    {/* Icon */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      {platform.icon}
                    </Box>
                    
                    {/* Platform Name */}
                    <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {platform.name}
                    </Typography>
                    
                    {/* Description */}
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2, flexGrow: 1 }}>
                      {platform.description}
                    </Typography>
                    
                    {/* Button */}
                    <Button
                      variant={isConnected ? "outlined" : "contained"}
                      color={isConnected ? "success" : "primary"}
                      fullWidth
                      disabled={platform.isDisabled || loading[platform.id]}
                      onClick={() => handleConnectPlatform(platform)}
                      sx={{ textTransform: 'none', mt: 'auto' }}
                    >
                      {loading[platform.id] ? (
                        <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      ) : isConnected ? (
                        "Connected ✅"
                      ) : (
                        `Connect ${platform.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        
        {/* Footer */}
        <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            sx={{ mb: 2 }}
          >
            Refresh All Connections
          </Button>
          
          <Typography 
            variant="body2" 
            color="primary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            <HelpIcon sx={{ fontSize: '0.9rem', mr: 0.5 }} />
            Need help? View connection guide
          </Typography>
        </Box>
      </Container>
      
      {/* Hidden file input for CSV upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        id="csv-file-upload" 
        accept=".csv"
        style={{ display: 'none' }} 
        onChange={handleFileUpload}
      />
      
      {/* Authentication Dialog using the AuthDialog component */}
      <AuthDialog 
        open={authDialog.open} 
        platform={authDialog.platform?.id}
        onClose={() => setAuthDialog({ open: false, platform: null })} 
        onSuccess={(accountData) => {
          // Add platform to connected list
          setConnectedPlatforms(prev => {
            if (!prev.includes(authDialog.platform?.id)) {
              return [...prev, authDialog.platform?.id];
            }
            return prev;
          });
          
          // Close dialog
          setAuthDialog({ open: false, platform: null });
          
          // Show success notification
          setNotification({
            open: true,
            message: `Successfully connected to ${authDialog.platform?.name}`,
            severity: 'success'
          });
        }}
        onError={(error) => {
          // Close dialog
          setAuthDialog({ open: false, platform: null });
          
          // Show error notification
          setNotification({
            open: true,
            message: `Failed to connect to ${authDialog.platform?.name}: ${error}`,
            severity: 'error'
          });
        }}
      />
      
      {/* Telegram integration removed */}
      
      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SignInHubPage;
