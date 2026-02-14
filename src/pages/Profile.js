import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material';
import {
  Edit as EditIcon,
  Phone as PhoneIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { sendOTP, verifyOTP, changePhoneNumber } from '../services/authService';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    alternatePhone: user?.alternatePhone || '',
  });
  const [changePhoneDialog, setChangePhoneDialog] = useState({
    open: false,
    step: 'phone', // 'phone' or 'otp'
    newPhone: '',
    otp: '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleSave = () => {
    // In production, this would call an API
    const updatedUser = { ...user, ...formData };
    updateUser(updatedUser);
    setEditMode(false);
    setSnackbar({
      open: true,
      message: 'Profile updated successfully',
      severity: 'success',
    });
  };

  const handleChangePhoneClick = () => {
    setChangePhoneDialog({ open: true, step: 'phone', newPhone: '', otp: '' });
  };

  const handleSendOTPForPhoneChange = async () => {
    if (!changePhoneDialog.newPhone) {
      setSnackbar({
        open: true,
        message: 'Please enter a phone number',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await sendOTP(changePhoneDialog.newPhone, 'mobile');
      setChangePhoneDialog({ ...changePhoneDialog, step: 'otp' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send OTP',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPForPhoneChange = async () => {
    if (!changePhoneDialog.otp) {
      setSnackbar({
        open: true,
        message: 'Please enter the OTP',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      await changePhoneNumber(changePhoneDialog.newPhone, changePhoneDialog.otp);
      const updatedUser = { ...user, mobile: changePhoneDialog.newPhone };
      updateUser(updatedUser);
      setFormData({ ...formData, mobile: changePhoneDialog.newPhone });
      setChangePhoneDialog({ open: false, step: 'phone', newPhone: '', otp: '' });
      setSnackbar({
        open: true,
        message: 'Phone number changed successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Invalid OTP. Try 123456 for demo',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setChangePhoneDialog({ open: false, step: 'phone', newPhone: '', otp: '' });
  };

  return (
    <Container maxWidth="md" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              Profile
            </Typography>
            {!editMode ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user?.name || '',
                      email: user?.email || '',
                      mobile: user?.mobile || '',
                      alternatePhone: user?.alternatePhone || '',
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Paper elevation={4} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleInputChange('mobile')}
                    disabled={!editMode}
                    variant={editMode ? 'outlined' : 'filled'}
                    sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 200 } }}
                    InputProps={{
                      startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                  {editMode && (
                    <Button
                      variant="outlined"
                      onClick={handleChangePhoneClick}
                      sx={{ mt: { xs: 0, sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
                    >
                      Change
                    </Button>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alternate Phone Number"
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={handleInputChange('alternatePhone')}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  placeholder="Optional"
                />
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Fade>

      <Dialog
        open={changePhoneDialog.open}
        onClose={handleCloseDialog}
        TransitionComponent={Fade}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>Change Phone Number</DialogTitle>
        <DialogContent>
          {changePhoneDialog.step === 'phone' ? (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Enter your new phone number. We'll send an OTP to verify it.
              </DialogContentText>
              <TextField
                fullWidth
                label="New Phone Number"
                type="tel"
                value={changePhoneDialog.newPhone}
                onChange={(e) =>
                  setChangePhoneDialog({ ...changePhoneDialog, newPhone: e.target.value })
                }
                placeholder="+91 1234567890"
                disabled={loading}
              />
            </Box>
          ) : (
            <Box>
              <DialogContentText sx={{ mb: 2 }}>
                Enter the OTP sent to {changePhoneDialog.newPhone}
              </DialogContentText>
              <TextField
                fullWidth
                label="Enter OTP"
                type="text"
                value={changePhoneDialog.otp}
                onChange={(e) =>
                  setChangePhoneDialog({ ...changePhoneDialog, otp: e.target.value })
                }
                placeholder="123456"
                disabled={loading}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Demo: Use OTP 123456
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          {changePhoneDialog.step === 'phone' ? (
            <Button
              onClick={handleSendOTPForPhoneChange}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send OTP'}
            </Button>
          ) : (
            <Button
              onClick={handleVerifyOTPForPhoneChange}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Change'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;
