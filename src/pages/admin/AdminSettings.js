import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Fade,
} from '@mui/material';
import { Settings as SettingsIcon, Email as EmailIcon, Phone as PhoneIcon, Link as LinkIcon } from '@mui/icons-material';

const STORAGE_KEY = 'adminSettings';

const defaultSettings = {
  supportEmail: '',
  supportPhone: '',
  supportEmailId: '',
  facebook: '',
  twitter: '',
  instagram: '',
  website: '',
};

const AdminSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
  };

  if (loading) return null;

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">Settings</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update support and contact details shown to users. (Stored in browser for now; connect to backend for persistence.)
          </Typography>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon /> Support & Contact
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Support email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  placeholder="support@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Support email ID (display)"
                  value={settings.supportEmailId}
                  onChange={(e) => handleChange('supportEmailId', e.target.value)}
                  placeholder="support@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Support phone number"
                  value={settings.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon /> Social & Links
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Facebook URL" value={settings.facebook} onChange={(e) => handleChange('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Twitter URL" value={settings.twitter} onChange={(e) => handleChange('twitter', e.target.value)} placeholder="https://twitter.com/..." />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Instagram URL" value={settings.instagram} onChange={(e) => handleChange('instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Website URL" value={settings.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="https://..." />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="contained" onClick={handleSave}>Save settings</Button>
              {saved && <Alert severity="success" sx={{ py: 0 }}>Saved.</Alert>}
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminSettings;
