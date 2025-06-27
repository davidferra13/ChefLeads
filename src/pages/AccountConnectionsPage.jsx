import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Container,
  Paper,
  Divider,
  Snackbar,
  Alert,
  AlertTitle,
  Link
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getServices } from '../config/services';
import ServiceCard from '../components/connections/ServiceCard';
import { loadServiceConnections, updateServiceConnection, applyConnectionStates } from '../utils/serviceConnections';
import AuthService from '../services/auth/AuthService';
import { isOAuthConfigured } from '../utils/environment';
import DemoModeBanner from '../components/ui/DemoModeBanner';

const AccountConnectionsPage = () => {
  const [services, setServices] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [isLoading, setIsLoading] = useState(false);

  // Load services and their connection states on mount
  useEffect(() => {
    const loadServices = async () => {
      setIsLoading(true);
      try {
        // Get all available services from the configuration
        const initialServices = getServices();
        
        // Load saved connection states
        const savedConnections = loadServiceConnections();
        
        // Apply connection states to services
        const updatedServices = applyConnectionStates(initialServices, savedConnections);
        setServices(updatedServices);
        
        // Validate tokens for connected services
        await validateConnectedServices(updatedServices);
      } catch (error) {
        console.error('Error loading services:', error);
        showNotification('Failed to load connected services', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadServices();
  }, []);

  /**
   * Validate all services that are marked as connected
   * @param {Array} servicesList - List of services to validate
   */
  const validateConnectedServices = async (servicesList) => {
    const connectedServices = servicesList.filter(service => service.isConnected);
    
    if (connectedServices.length === 0) return;
    
    for (const service of connectedServices) {
      const isStillValid = checkServiceConnection(service.id);
      
      if (!isStillValid) {
        // Token is no longer valid, update connection state
        updateServiceConnection(service.id, false);
        setServices(prev => 
          prev.map(s => s.id === service.id ? { ...s, isConnected: false } : s)
        );
      }
    }
  };
  
  /**
   * Check for active connections by validating tokens
   */
  const checkForActiveConnections = () => {
    // This would check if we have valid tokens for each service
    setServices(prevServices => {
      return prevServices.map(service => {
        // Check if service has valid auth in browser storage
        const isActuallyConnected = checkServiceConnection(service.id);
        
        if (service.isConnected !== isActuallyConnected) {
          // Update localStorage state to match actual auth state
          updateServiceConnection(service.id, isActuallyConnected);
        }
        
        return {
          ...service,
          isConnected: isActuallyConnected
        };
      });
    });
  };
  
  /**
   * Check if a service has valid authentication
   */
  const checkServiceConnection = (serviceId) => {
    // Check both localStorage flag and session tokens
    const hasAuthToken = localStorage.getItem(`auth_exists_${serviceId}`) === 'true';
    const sessionData = sessionStorage.getItem(`auth_${serviceId}`);
    
    if (!hasAuthToken || !sessionData) return false;
    
    try {
      // Verify token isn't expired
      const authData = JSON.parse(sessionData);
      return authData && authData.accessToken && authData.expiresAt > Date.now();
    } catch (e) {
      return false;
    }
  };

  /**
   * Handle service connection status change
   * @param {string} serviceId - ID of the service to toggle connection for
   * @param {boolean} isConnected - Optional explicit connection state
   * @returns {Promise<void>}
   */
  const handleToggleConnection = async (serviceId, isConnected) => {
    try {
      if (isConnected === undefined) {
        // Just toggle the state - used by the disconnect button
        setServices(prevServices => {
          const service = prevServices.find(s => s.id === serviceId);
          if (!service || service.disabled) return prevServices;
          
          // If currently connected, disconnect
          if (service.isConnected) {
            // Clear token from storage
            localStorage.removeItem(`auth_exists_${serviceId}`);
            sessionStorage.removeItem(`auth_${serviceId}`);
            sessionStorage.removeItem(`oauth_state_${serviceId}`);
            
            // Update local state
            updateServiceConnection(serviceId, false);
            
            // Show success notification
            showNotification(`Disconnected from ${service.name}`, 'info');
          }
          
          return prevServices.map(s => 
            s.id === serviceId
              ? { ...s, isConnected: service.isConnected ? false : true }
              : s
          );
        });
      } else {
        // Update with explicit connection state - used after OAuth callback
        setServices(prevServices => {
          return prevServices.map(s => 
            s.id === serviceId ? { ...s, isConnected } : s
          );
        });
      }
    } catch (error) {
      console.error('Error updating connection status:', error);
      showNotification(`Error updating ${serviceId} connection: ${error.message}`, 'error');
    }
  };
  
  /**
   * Handle successful authentication
   */
  const handleAuthSuccess = (serviceId, authData) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    showNotification(`Successfully connected to ${service.name}!`, 'success');
    
    // Here we would typically start importing data from the service
    fetchInitialDataFromService(serviceId, authData);
  };
  
  /**
   * Handle authentication failure
   */
  const handleAuthFailure = (serviceId, error) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    showNotification(`Failed to connect to ${service.name}: ${error.message}`, 'error');
  };
  
  /**
   * Fetch initial data from a service after successful authentication
   */
  const fetchInitialDataFromService = async (serviceId, authData) => {
    try {
      // This would fetch initial data based on the service type
      // For example, for Gmail we might fetch recent emails
      showNotification(`Importing leads from ${serviceId}...`, 'info');
      
      // In production, this would call service-specific API functions
      // to import and process leads
      
      // Simulate async data import
      setTimeout(() => {
        showNotification(`Successfully imported leads from ${serviceId}!`, 'success');
      }, 2000);
    } catch (error) {
      console.error(`Error fetching data from ${serviceId}:`, error);
      showNotification(`Error importing leads from ${serviceId}: ${error.message}`, 'error');
    }
  };
  
  /**
   * Show a notification message
   */
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  /**
   * Close notification
   */
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Group services by connection status for organization
  const connectedServices = services.filter(service => service.isConnected);
  const availableServices = services.filter(service => !service.isConnected && !service.disabled);
  const comingSoonServices = services.filter(service => service.disabled);

  // Check if OAuth is configured with real credentials
  const oauthConfigured = isOAuthConfigured();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Connections
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your accounts to import leads directly into your dashboard.
      </Typography>
      
      {/* Show demo mode banner if OAuth is not configured */}
      {!oauthConfigured && <DemoModeBanner />}
      
      {/* Connected Services Section */}
      {connectedServices.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Connected Services
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
            <Grid container spacing={3}>
              {connectedServices.map(service => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <ServiceCard 
                    service={service} 
                    onToggleConnection={handleToggleConnection}
                    onAuthSuccess={handleAuthSuccess}
                    onAuthFailure={handleAuthFailure}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
      
      {/* Available Services Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Available Services
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={3}>
            {availableServices.map(service => (
              <Grid item xs={12} sm={6} md={4} key={service.id}>
                <ServiceCard 
                  service={service} 
                  onToggleConnection={handleToggleConnection}
                  onAuthSuccess={handleAuthSuccess}
                  onAuthFailure={handleAuthFailure}
                />
              </Grid>
            ))}
            
            {availableServices.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    You've connected all available services.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>
      </Box>
      
      {/* Coming Soon Services Section */}
      {comingSoonServices.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Coming Soon
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={3}>
              {comingSoonServices.map(service => (
                <Grid item xs={12} sm={6} md={4} key={service.id}>
                  <ServiceCard 
                    service={service} 
                    onToggleConnection={handleToggleConnection}
                    onAuthSuccess={handleAuthSuccess}
                    onAuthFailure={handleAuthFailure}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>
      )}
      
      {/* Notification System */}
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
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountConnectionsPage;
