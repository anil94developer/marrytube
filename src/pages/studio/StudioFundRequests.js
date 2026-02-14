import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fade,
  Grow,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getFundRequests, createFundRequest } from '../../services/studioService';

const StudioFundRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requestDialog, setRequestDialog] = useState({ open: false });
  const [formData, setFormData] = useState({ amount: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getFundRequests();
      setRequests(Array.isArray(data.requests) ? data.requests : data);
      if (data && typeof data.walletBalance === 'number') {
        setWalletBalance(data.walletBalance);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      setSnackbar({ open: true, message: 'Enter a valid amount', severity: 'error' });
      return;
    }
    if (amount > walletBalance) {
      setSnackbar({ open: true, message: 'Amount cannot exceed wallet balance (₹' + walletBalance.toLocaleString() + ')', severity: 'error' });
      return;
    }

    try {
      await createFundRequest({ amount });
      loadRequests();
      setRequestDialog({ open: false });
      setFormData({ amount: '' });
      setSnackbar({ open: true, message: 'Withdraw request submitted successfully', severity: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create request';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
              Fund Requests
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Paper variant="outlined" sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WalletIcon color="primary" />
                <Typography variant="body1"><strong>Wallet balance:</strong> ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
              </Paper>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRequestDialog({ open: true })} disabled={walletBalance <= 0}>
                Withdraw Request
              </Button>
            </Box>
          </Box>

          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : requests.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">No fund requests found</Alert>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: { xs: '60vh', md: 'none' }, overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}><strong>Amount</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}><strong>Status</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}><strong>Date</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow key={request.id} hover>
                        <TableCell>₹{Number(request.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            size="small"
                            color={getStatusColor(request.status)}
                          />
                        </TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Fade>

      <Dialog 
        open={requestDialog.open} 
        onClose={() => setRequestDialog({ open: false })} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>Withdraw Request</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">Available: ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
            <TextField
              label="Amount (₹)"
              type="number"
              inputProps={{ min: 0, max: walletBalance, step: 0.01 }}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleCreateRequest} variant="contained">Submit Withdraw Request</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StudioFundRequests;

