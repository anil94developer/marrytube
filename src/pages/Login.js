import React, { useState, useEffect } from 'react';
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
import { Phone, Email, Lock, Refresh } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { sendOTP, verifyOTP } from '../services/authService';
import logo from '../assets/logo-icon.png';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(0); // Timer in seconds
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && user.userType === 'customer') {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // OTP Timer countdown
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setIdentifier('');
    setOtp('');
    setStep('identifier');
    setError('');
    setSuccess('');
    setTimer(0);
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
      setTimer(60); // Start 60 second timer
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!identifier) {
      setError('Please enter your ' + (tabValue === 0 ? 'mobile number' : 'email'));
      return;
    }

    setResendLoading(true);
    setError('');

    try {
      const type = tabValue === 0 ? 'mobile' : 'email';
      await sendOTP(identifier, type);
      setTimer(60); // Reset timer to 60 seconds
      setSuccess('OTP sent successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const type = tabValue === 0 ? 'mobile' : 'email';
      const result = await verifyOTP(identifier, otp, type, 'customer');
      if (result.success) {
        // Show success message
        if (result.isNewUser) {
          setSuccess('Account created successfully! Redirecting...');
        } else {
          setSuccess('Login successful! Redirecting...');
        }
        
        // Login user
        login(result.user, result.token);
        
        // Navigate to home page (Dashboard) after a brief delay
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
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
            <Box
              component="img"
              src={logo}
              alt="MarryTube Logo"
              sx={{
                height: { xs: 60, sm: 80 },
                width: 'auto',
                mb: 2,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              Welcome to MarryTube
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
              Customer Login with OTP
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.location.href = '/admin/login'}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Admin Login
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => window.location.href = '/studio/login'}
                sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                Studio Login
              </Button>
            </Box>
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

            {success && (
              <Slide direction="down" in={Boolean(success)}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
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
                
                {/* Timer and Resend OTP */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {timer > 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Resend OTP in: <strong style={{ color: '#667eea' }}>{formatTime(timer)}</strong>
                    </Typography>
                  ) : (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      sx={{ 
                        color: '#667eea',
                        textTransform: 'none',
                        '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.1)' }
                      }}
                    >
                      {resendLoading ? <CircularProgress size={16} /> : 'Resend OTP'}
                    </Button>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setStep('identifier');
                    setOtp('');
                    setError('');
                    setTimer(0);
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