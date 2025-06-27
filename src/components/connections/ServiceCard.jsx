import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Icon,
  CircularProgress
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { connectWithOAuth } from '../../utils/oauth';
import AuthService from '../../services/auth/AuthService';

/**
 * ServiceCard component for displaying service connection options
 * @param {Object} props Component props
 * @param {Object} props.service Service data object
 * @param {Function} props.onToggleConnection Function to handle connection toggling
 * @param {Function} props.onAuthSuccess Function called when authentication is successful
 * @param {Function} props.onAuthFailure Function called when authentication fails
 */
const ServiceCard = ({ 
  service, 
  onToggleConnection, 
  onAuthSuccess, 
  onAuthFailure 
}) => {
  const { id, name, description, iconUrl, isConnected, disabled } = service;
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);

  /**
   * Handle connect/disconnect button click
   */
  const handleConnectionToggle = async () => {
    if (disabled) return;
    
    if (isConnected) {
      // Handle disconnection
      try {
        AuthService.disconnect(id);
        onToggleConnection(id, false);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
      return;
    }
    
    // Handle new connection with OAuth
    try {
      setIsAuthenticating(true);
      setAuthError(null);
      
      // Use the new standard OAuth flow
      const success = connectWithOAuth(id);
      
      if (!success) {
        throw new Error(`Failed to initialize OAuth flow for ${name}`);
      }
      
      // Note: The actual connection update and success/failure handling 
      // will be done by the OAuthCallbackHandler component after redirect
      
      // No need to update UI state or call success handlers here
      // as the page will be redirected to the OAuth provider
    } catch (error) {
      console.error(`Authentication error for ${name}:`, error);
      setAuthError(error.message || 'Authentication failed');
      
      // Notify parent component
      if (onAuthFailure) {
        onAuthFailure(id, error);
      }
      setIsAuthenticating(false);
    }
  };
  
  return (
    <Card 
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: disabled ? 0.7 : 1,
        transition: 'transform 0.2s',
        '&:hover': {
          transform: disabled ? 'none' : 'translateY(-4px)',
          boxShadow: disabled ? 0 : 2
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Icon color="primary" sx={{ mr: 1, fontSize: 24 }}>{iconUrl}</Icon>
          <Typography variant="h6" component="div">
            {name}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 2, flexGrow: 1 }}
        >
          {description}
        </Typography>
        
        {authError && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ mb: 1, display: 'block' }}
          >
            {authError}
          </Typography>
        )}
        
        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<CheckIcon />}
              label="Connected"
              color="success"
              variant="outlined"
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleConnectionToggle}
            >
              Disconnect
            </Button>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnectionToggle}
            disabled={disabled || isAuthenticating}
            sx={{ alignSelf: 'flex-start' }}
            startIcon={isAuthenticating ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {disabled ? 'Coming Soon' : isAuthenticating ? 'Connecting...' : `Connect ${name}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceCard;
