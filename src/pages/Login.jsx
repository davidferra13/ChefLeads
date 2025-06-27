import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Button, Divider, TextField, Typography, InputAdornment, IconButton } from '@mui/material';
import GoogleIcon from '../assets/google-icon.svg';
import AppleIcon from '../assets/apple-icon.svg';
import FacebookIcon from '../assets/facebook-icon.svg';

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleContinue = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // TODO: Replace with real backend call
      // Simulate backend check
      setTimeout(() => {
        // For demo, always advance to dashboard
        localStorage.setItem('auth_token', 'demo-token');
        localStorage.setItem('auth_user', JSON.stringify({ email }));
        navigate('/dashboard');
      }, 700);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    // TODO: Implement OAuth popup logic for Google, Apple, Facebook
    alert(`OAuth with ${provider} not yet implemented.`);
  };

  return (
    <Box maxWidth={400} mx="auto" my={8} p={4} bgcolor="#fff" borderRadius={3} boxShadow={3}>
      <Typography variant="h5" fontWeight={600} mb={2} align="center">Sign in to Your Account</Typography>
      <form onSubmit={handleContinue}>
        <TextField
          type="email"
          label="Email Address*"
          placeholder="Email Address*"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => {
            if (email && !validateEmail(email)) setError('Please enter a valid email address.');
            else setError('');
          }}
          required
          fullWidth
          margin="normal"
          error={!!error}
          helperText={error}
          sx={{ mb: 2, background: '#fafbfc', borderRadius: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ py: 1.5, fontWeight: 600, fontSize: '1rem', background: '#2563eb', '&:hover': { background: '#1d4ed8' } }}
          disabled={loading}
        >
          Continue
        </Button>
      </form>
      <Typography variant="body2" align="center" mt={2} mb={1}>
        New to [site]?{' '}
        <Link to="/signup" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
      </Typography>
      <Box display="flex" alignItems="center" my={2}>
        <Divider sx={{ flex: 1, bgcolor: '#e5e7eb' }} />
        <Typography variant="body2" sx={{ mx: 2, color: '#6b7280' }}>OR</Typography>
        <Divider sx={{ flex: 1, bgcolor: '#e5e7eb' }} />
      </Box>
      <Button
        fullWidth
        sx={{ mb: 1, background: '#fff', color: '#222', border: '1px solid #e5e7eb', textTransform: 'none', fontWeight: 600 }}
        startIcon={<img src={GoogleIcon} alt="Google" style={{ width: 22, height: 22 }} />}
        onClick={() => handleOAuth('Google')}
      >
        Continue with Google
      </Button>
      <Button
        fullWidth
        sx={{ mb: 1, background: '#fff', color: '#222', border: '1px solid #e5e7eb', textTransform: 'none', fontWeight: 600 }}
        startIcon={<img src={AppleIcon} alt="Apple" style={{ width: 22, height: 22 }} />}
        onClick={() => handleOAuth('Apple')}
      >
        Continue with Apple
      </Button>
      <Button
        fullWidth
        sx={{ mb: 1, background: '#222', color: '#fff', border: '1px solid #222', textTransform: 'none', fontWeight: 600 }}
        startIcon={<img src={FacebookIcon} alt="Facebook" style={{ width: 22, height: 22, filter: 'invert(1)' }} />}
        onClick={() => handleOAuth('Facebook')}
      >
        Continue with Facebook
      </Button>
      <Typography variant="caption" display="block" align="center" mt={3} color="#6b7280">
        By submitting, I accept [site]’s{' '}
        <Link to="/terms-of-use" style={{ color: '#2563eb', textDecoration: 'underline' }}>terms of use</Link>.
      </Typography>
    </Box>
  );
}
