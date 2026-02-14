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
  CircularProgress,
} from '@mui/material';
import { AccountBalance as BankIcon } from '@mui/icons-material';
import { getBankDetails, saveBankDetails } from '../../services/studioService';

const StudioBankDetails = () => {
  const [form, setForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifsc: '',
    bankName: '',
    branch: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getBankDetails();
        if (mounted && data) {
          setForm({
            accountHolderName: data.accountHolderName || '',
            accountNumber: data.accountNumber || '',
            ifsc: data.ifsc || '',
            bankName: data.bankName || '',
            branch: data.branch || '',
          });
        }
      } catch (e) {
        if (mounted) setMessage({ type: 'error', text: 'Failed to load bank details' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    setSaving(true);
    try {
      await saveBankDetails(form);
      setMessage({ type: 'success', text: 'Bank details saved. Withdrawals will be sent to this account.' });
    } catch (e) {
      setMessage({ type: 'error', text: e.response?.data?.message || 'Failed to save' });
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
            <BankIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">Bank Details</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add your bank account for receiving withdrawal payouts from fund requests.
          </Typography>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <TextField
              fullWidth
              label="Account holder name"
              value={form.accountHolderName}
              onChange={handleChange('accountHolderName')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Account number"
              value={form.accountNumber}
              onChange={handleChange('accountNumber')}
              inputProps={{ maxLength: 24 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="IFSC code"
              value={form.ifsc}
              onChange={handleChange('ifsc')}
              placeholder="e.g. SBIN0001234"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Bank name"
              value={form.bankName}
              onChange={handleChange('bankName')}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Branch"
              value={form.branch}
              onChange={handleChange('branch')}
              sx={{ mb: 2 }}
            />
            {message.text && (
              <Alert severity={message.type === 'error' ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save bank details'}
            </Button>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default StudioBankDetails;
