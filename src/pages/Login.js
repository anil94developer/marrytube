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
import logo from '../assets/logo_512.png';

const accent = '#c45c5c';
const bgGradient = 'linear-gradient(165deg, #fdf8f6 0%, #f5ebe6 50%, #ede4df 100%)';

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
    <Box
      sx={{
        minHeight: '100vh',
        background: bgGradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 3, sm: 4 },
        px: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(196, 92, 92, 0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(196, 92, 92, 0.06) 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 4 },
              width: '100%',
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.06)',
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.06)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src={logo}
                alt="MarryTube"
                sx={{
                  height: { xs: 160, sm: 200 },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
                }}
              />
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Sign in with OTP
              </Typography>
            </Box>

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                mb: 3,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
                '& .Mui-selected': { color: accent },
                '& .MuiTabs-indicator': { backgroundColor: accent, height: 3, borderRadius: '3px 3px 0 0' },
              }}
            >
              <Tab icon={<Phone sx={{ fontSize: 20 }} />} iconPosition="start" label="Mobile" />
              <Tab icon={<Email sx={{ fontSize: 20 }} />} iconPosition="start" label="Email" />
            </Tabs>

            {error && (
              <Slide direction="down" in={Boolean(error)}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              </Slide>
            )}

            {success && (
              <Slide direction="down" in={Boolean(success)}>
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
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
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&.Mui-focused fieldset': { borderColor: accent },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: accent },
                  }}
                  disabled={loading}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendOTP}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    bgcolor: accent,
                    boxShadow: `0 4px 14px ${accent}40`,
                    '&:hover': {
                      bgcolor: '#a84d4d',
                      boxShadow: `0 6px 20px ${accent}50`,
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
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
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.8)',
                      '&.Mui-focused fieldset': { borderColor: accent },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: accent },
                  }}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                  }}
                />

                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {timer > 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                      Resend OTP in: <strong style={{ color: accent }}>{formatTime(timer)}</strong>
                    </Typography>
                  ) : (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<Refresh sx={{ fontSize: 18 }} />}
                      onClick={handleResendOTP}
                      disabled={resendLoading}
                      sx={{
                        color: accent,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: `${accent}15` },
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
                  sx={{
                    mb: 2,
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: 'divider',
                    color: 'text.secondary',
                    '&:hover': { borderColor: accent, color: accent, bgcolor: `${accent}08` },
                  }}
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
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    bgcolor: accent,
                    boxShadow: `0 4px 14px ${accent}40`,
                    '&:hover': {
                      bgcolor: '#a84d4d',
                      boxShadow: `0 6px 20px ${accent}50`,
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                  Demo: Use OTP 123456
                </Typography>
              </Box>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;