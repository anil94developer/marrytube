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
import { AdminPanelSettings as AdminIcon, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { adminLogin } from '../services/authService';
import logo from '../assets/logo-icon.png';

const AdminLogin = () => {
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
      const result = await adminLogin(email, password);
      if (result.success) {
        login(result.user, result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        navigate('/admin/dashboard');

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
              Admin Panel Login
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Access admin dashboard
            </Typography>
          </Box>

          <Paper sx={{ p: 3, bgcolor: 'white', color: 'text.primary' }}>
            {error && (
              <Slide direction="down" in={Boolean(error)}>
                <Alert severity="error" sx={{ mb: 2 }}>
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
                placeholder="admin@marrytube.com"
                sx={{ mb: 3 }}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin123"
                sx={{ mb: 3 }}
                disabled={loading}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Demo: admin@marrytube.com / admin123
              </Typography>
            </Box>
          </Paper>
        </Paper>
      </Fade>
    </Container>
  );
};

export default AdminLogin;

