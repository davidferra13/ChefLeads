import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import BusinessIcon from '@mui/icons-material/Business';
import AirbnbIcon from '@mui/icons-material/House';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import VideoLabelIcon from '@mui/icons-material/VideoLabel';
import WebIcon from '@mui/icons-material/Web';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';

const platformIcons = {
  gmail: <EmailIcon fontSize="large" sx={{ color: '#DB4437' }} />,
  facebook: <FacebookIcon fontSize="large" sx={{ color: '#4267B2' }} />,
  instagram: <InstagramIcon fontSize="large" sx={{ color: '#E1306C' }} />,
  takeachef: <BusinessIcon fontSize="large" sx={{ color: '#2E7D32' }} />,
  airbnb: <AirbnbIcon fontSize="large" sx={{ color: '#FF5A5F' }} />,
  whatsapp: <WhatsAppIcon fontSize="large" sx={{ color: '#25D366' }} />,
  sms: <PhoneIcon fontSize="large" sx={{ color: '#1976D2' }} />,
  tiktok: <VideoLabelIcon fontSize="large" sx={{ color: '#000000' }} />,
  wix: <WebIcon fontSize="large" sx={{ color: '#0C6EFC' }} />,
  manual: <AttachFileIcon fontSize="large" sx={{ color: '#757575' }} />,
  telegram: <SendIcon fontSize="large" sx={{ color: '#0088cc' }} />
};

const platformColors = {
  gmail: '#DB4437',
  facebook: '#4267B2',
  instagram: '#E1306C',
  takeachef: '#2E7D32',
  airbnb: '#FF5A5F',
  whatsapp: '#25D366',
  sms: '#1976D2',
  tiktok: '#000000',
  wix: '#0C6EFC',
  manual: '#757575',
  telegram: '#0088cc'
};

// Mock email domains for each platform
const mockEmailDomains = {
  gmail: 'gmail.com',
  facebook: 'facebook.com',
  instagram: 'instagram.com',
  takeachef: 'takeachef.com',
  airbnb: 'airbnb.com',
  whatsapp: 'whatsapp.com',
  sms: 'twilio.com',
  tiktok: 'tiktok.com', 
  wix: 'wix.com',
  telegram: 't.me',
  manual: 'local'
};

const AuthDialog = ({ 
  open, 
  platform, 
  onClose, 
  onSuccess, 
  onError 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login'); // login, mfa, success

  if (!platform) return null;

  const handleLogin = () => {
    if (!email || !password) {
      return;
    }

    setLoading(true);
    
    // Simulate API request delay
    setTimeout(() => {
      // Successful authentication
      if (email.includes('@') && password.length >= 6) {
        // 80% chance of success, 20% chance of MFA
        if (Math.random() > 0.2) {
          setStep('success');
          setTimeout(() => {
            onSuccess({
              email,
              token: `mock-token-${platform.id}-${Date.now()}`,
              name: email.split('@')[0]
            });
            onClose();
          }, 1000);
        } else {
          setStep('mfa');
        }
      } else {
        setLoading(false);
        onError('Invalid email or password. Please try again.');
      }
    }, 1500);
  };

  const handleMfaSubmit = (code) => {
    if (code === '123456') {
      setStep('success');
      setTimeout(() => {
        onSuccess({
          email,
          token: `mock-token-${platform.id}-${Date.now()}`,
          name: email.split('@')[0]
        });
        onClose();
      }, 1000);
    } else {
      onError('Invalid verification code. Please try again.');
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setLoading(false);
    setStep('login');
    onClose();
  };

  const renderLoginForm = () => (
    <>
      <DialogContent>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 2
        }}>
          {platformIcons[platform.id]}
          <Typography variant="h6" sx={{ mt: 1 }}>
            Sign in to {platform.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Connect your {platform.name} account to import leads
          </Typography>
        </Box>
        <TextField
          autoFocus
          label="Email"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="dense"
          placeholder={`your.name@${mockEmailDomains[platform.id]}`}
          disabled={loading}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="dense"
          placeholder="Enter your password"
          disabled={loading}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          This is a simulated login flow. Use any email with @ and a password of at least 6 chars.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleLogin} 
          variant="contained" 
          disabled={loading}
          sx={{ bgcolor: platformColors[platform.id] }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>
      </DialogActions>
    </>
  );

  const renderMfaForm = () => {
    const [code, setCode] = useState('');
    
    return (
      <>
        <DialogContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ mt: 1 }}>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Enter the verification code sent to your device
            </Typography>
          </Box>
          <TextField
            autoFocus
            label="Verification Code"
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            margin="dense"
            placeholder="6-digit code"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            For this demo, the code is always: 123456
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleMfaSubmit(code)} 
            variant="contained"
            sx={{ bgcolor: platformColors[platform.id] }}
          >
            Verify
          </Button>
        </DialogActions>
      </>
    );
  };

  const renderSuccessView = () => (
    <DialogContent>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        py: 2
      }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Successfully authenticated!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connecting your account...
        </Typography>
      </Box>
    </DialogContent>
  );

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : handleClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        {platform.name} Authentication
      </DialogTitle>
      {step === 'login' && renderLoginForm()}
      {step === 'mfa' && renderMfaForm()}
      {step === 'success' && renderSuccessView()}
    </Dialog>
  );
};

export default AuthDialog;
