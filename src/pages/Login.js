import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Fade,
  Slide,
} from '@mui/material';
import { Phone, Email, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { sendOTP, verifyOTP } from '../services/authService';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setIdentifier('');
    setOtp('');
    setStep('identifier');
    setError('');
  };

  const handleSendOTP = async () => {
    if (!identifier) {
      setError('Please enter your ' + (tabValue === 0 ? 'mobile number' : 'email'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const type = tabValue === 0 ? 'mobile' : 'email';
      await sendOTP(identifier, type);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const type = tabValue === 0 ? 'mobile' : 'email';
      const result = await verifyOTP(identifier, otp, type);
      if (result.success) {
        login(result.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Try 123456 for demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
      <Fade in timeout={800}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to MarryTube
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Login with OTP to continue
            </Typography>
          </Box>

          <Paper sx={{ p: 3, bgcolor: 'white', color: 'text.primary' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ mb: 3 }}
            >
              <Tab icon={<Phone />} iconPosition="start" label="Mobile" />
              <Tab icon={<Email />} iconPosition="start" label="Email" />
            </Tabs>

            {error && (
              <Slide direction="down" in={Boolean(error)}>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              </Slide>
            )}

            {step === 'identifier' ? (
              <Box>
                <TextField
                  fullWidth
                  label={tabValue === 0 ? 'Mobile Number' : 'Email Address'}
                  type={tabValue === 0 ? 'tel' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={tabValue === 0 ? '+91 1234567890' : 'user@example.com'}
                  sx={{ mb: 3 }}
                  disabled={loading}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendOTP}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Send OTP'}
                </Button>
              </Box>
            ) : (
              <Box>
                <TextField
                  fullWidth
                  label="Enter OTP"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  sx={{ mb: 2 }}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setStep('identifier');
                    setOtp('');
                    setError('');
                  }}
                  sx={{ mb: 2 }}
                  disabled={loading}
                >
                  Change {tabValue === 0 ? 'Mobile' : 'Email'}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Demo: Use OTP 123456
                </Typography>
              </Box>
            )}
          </Paper>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Login;