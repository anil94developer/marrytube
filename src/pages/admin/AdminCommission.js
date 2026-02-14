import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Fade,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Paid as PaidIcon } from '@mui/icons-material';
import { getCommission, saveCommission } from '../../services/adminService';

const AdminCommission = () => {
  const [amount, setAmount] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const val = await getCommission();
        if (mounted) setAmount(val > 0 ? String(val) : '');
      } catch (e) {
        if (mounted) setError('Failed to load commission');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) return;
    setError('');
    setSaving(true);
    try {
      const updated = await saveCommission(val);
      if (updated !== null) {
        setAmount(String(updated));
        setSaved(true);
      } else {
        setError('Failed to save');
      }
    } catch (e) {
      setError('Failed to save commission');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PaidIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">Commission</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set how much to pay the studio per 1 GB of data uploaded on drive. This rate is used for studio payouts.
          </Typography>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <TextField
              fullWidth
              label="Commission per 1 GB (₹)"
              type="number"
              inputProps={{ min: 0, step: 0.5 }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              }}
              placeholder="e.g. 2.50"
              sx={{ mb: 2 }}
            />
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save commission'}
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
            {saved && !error && <Alert severity="success" sx={{ mt: 2 }}>Saved. Studio earnings are calculated as upload size (GB) × this rate per GB.</Alert>}
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminCommission;
