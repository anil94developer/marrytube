import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Fade,
  Slide,
} from '@mui/material';
import { Business as BusinessIcon, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { studioLogin } from '../services/authService';
import logo from '../assets/logo_512.png';

const accent = '#c45c5c';
const bgGradient = 'linear-gradient(165deg, #fdf8f6 0%, #f5ebe6 50%, #ede4df 100%)';

const StudioLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await studioLogin(email, password);
      if (result.success) {
        login(result.user, result.token);
        navigate('/studio/dashboard');
      }
    } catch (err) {
      const msg = err?.message || 'Invalid credentials';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('password')) {
        setError('Invalid email or password. Please check and try again.');
      } else {
        setError(msg);
      }
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
                  height: { xs: 72, sm: 88 },
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1.5, mb: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 28, color: accent }} />
                <Typography
                  variant="h5"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: '#2d2d2d',
                    fontFamily: '"Playfair Display", "Georgia", serif',
                  }}
                >
                  Studio Panel
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Sign in to access your dashboard
              </Typography>
            </Box>

            {error && (
              <Slide direction="down" in={Boolean(error)}>
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              </Slide>
            )}

            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="studio@marrytube.com"
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.8)',
                    '&.Mui-focused fieldset': { borderColor: accent },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: accent },
                }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
                }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
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
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Demo: studio@marrytube.com / studio123
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default StudioLogin;

