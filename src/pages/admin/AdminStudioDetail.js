import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Fade,
  Alert,
  Skeleton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  CheckCircle as ApproveIcon,
  Cancel as RevokeIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { getStudioClients, approveStudio, addFundToStudio } from '../../services/adminService';

const AdminStudioDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ studio: null, clients: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [approveDialog, setApproveDialog] = useState({ open: false, action: null }); // action: 'approve' | 'revoke'
  const [approving, setApproving] = useState(false);
  const [addFundDialog, setAddFundDialog] = useState({ open: false, amount: '' });
  const [addingFund, setAddingFund] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getStudioClients(id);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (action) => {
    setApproveDialog({ open: true, action });
  };

  const handleApproveConfirm = async () => {
    if (!approveDialog.action || !data.studio) return;
    setApproving(true);
    try {
      const isActive = approveDialog.action === 'approve';
      const res = await approveStudio(id, isActive);
      if (res && res.success) {
        setData((prev) => ({ ...prev, studio: { ...prev.studio, isActive } }));
        setSnackbar({ open: true, message: isActive ? 'Studio approved.' : 'Studio approval revoked.', severity: 'success' });
        setApproveDialog({ open: false, action: null });
      } else {
        setSnackbar({ open: true, message: res?.message || 'Failed to update.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update studio.', severity: 'error' });
    } finally {
      setApproving(false);
    }
  };

  const handleAddFund = async () => {
    const amount = parseFloat(addFundDialog.amount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ open: true, message: 'Enter a valid amount', severity: 'error' });
      return;
    }
    setAddingFund(true);
    try {
      const res = await addFundToStudio(id, amount);
      if (res && res.success) {
        await loadData();
        setSnackbar({ open: true, message: `₹${amount.toLocaleString()} added to studio wallet.`, severity: 'success' });
        setAddFundDialog({ open: false, amount: '' });
      } else {
        setSnackbar({ open: true, message: res?.message || 'Failed to add fund.', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add fund.', severity: 'error' });
    } finally {
      setAddingFund(false);
    }
  };

  const studio = data.studio;
  const clients = data.clients || [];
  const filteredClients = search.trim()
    ? clients.filter((c) => {
        const u = c.user || {};
        const q = search.toLowerCase();
        return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.mobile || '').includes(q) || (c.email || '').toLowerCase().includes(q) || (c.mobile || '').includes(q);
      })
    : clients;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!studio) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="warning">Studio not found.</Alert>
        <IconButton onClick={() => navigate('/admin/studios')} sx={{ mt: 1 }}><ArrowBackIcon /> Back</IconButton>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <IconButton onClick={() => navigate('/admin/studios')}><ArrowBackIcon /></IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Studio Details</Typography>
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <BusinessIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">{studio.name || studio.email}</Typography>
                </Box>
                <Typography variant="body2"><EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />{studio.email || '—'}</Typography>
                <Typography variant="body2"><PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />{studio.mobile || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="caption" color="text.secondary">City · Pincode</Typography>
                <Typography variant="body2">{[studio.city, studio.pincode].filter(Boolean).join(' · ') || '—'}</Typography>
                {studio.address && <Typography variant="caption" color="text.secondary" display="block">{studio.address}</Typography>}
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Chip label={studio.isActive ? 'Approved' : 'Pending'} color={studio.isActive ? 'success' : 'default'} size="small" sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {studio.isActive ? (
                    <Button size="small" variant="outlined" color="warning" startIcon={<RevokeIcon />} onClick={() => handleApproveClick('revoke')}>
                      Revoke approval
                    </Button>
                  ) : (
                    <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleApproveClick('approve')}>
                      Approve studio
                    </Button>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <WalletIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" color="text.secondary">Wallet</Typography>
                </Box>
                <Typography variant="h6">₹{(parseFloat(studio.walletBalance) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Typography>
                <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setAddFundDialog({ open: true, amount: '' })} sx={{ mt: 0.5 }}>
                  Add fund
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Typography variant="h6" color="primary">{clients.length} customers</Typography>
                <Typography variant="caption" color="text.secondary">Linked to this studio</Typography>
              </Grid>
            </Grid>
          </Paper>

          <Dialog open={addFundDialog.open} onClose={() => !addingFund && setAddFundDialog({ open: false, amount: '' })} maxWidth="xs" fullWidth>
            <DialogTitle>Add fund to studio wallet</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ mb: 2 }}>
                Amount will be added to this studio&apos;s wallet. They can use it or request withdrawal.
              </DialogContentText>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                value={addFundDialog.amount}
                onChange={(e) => setAddFundDialog((d) => ({ ...d, amount: e.target.value }))}
                placeholder="e.g. 1000"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddFundDialog({ open: false, amount: '' })} disabled={addingFund}>Cancel</Button>
              <Button variant="contained" onClick={handleAddFund} disabled={addingFund || !addFundDialog.amount}>
                {addingFund ? 'Adding...' : 'Add fund'}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={approveDialog.open} onClose={() => !approving && setApproveDialog({ open: false, action: null })}>
            <DialogTitle>
              {approveDialog.action === 'approve' ? 'Approve studio?' : 'Revoke approval?'}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                {approveDialog.action === 'approve'
                  ? `Approve "${studio.name || studio.email}"? They will be able to access the studio panel and manage clients.`
                  : `Revoke approval for "${studio.name || studio.email}"? They will no longer be able to access the studio panel.`
                }
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setApproveDialog({ open: false, action: null })} disabled={approving}>Cancel</Button>
              <Button
                variant="contained"
                color={approveDialog.action === 'approve' ? 'success' : 'warning'}
                onClick={handleApproveConfirm}
                disabled={approving}
              >
                {approving ? 'Updating...' : approveDialog.action === 'approve' ? 'Approve' : 'Revoke'}
              </Button>
            </DialogActions>
          </Dialog>

          {snackbar.open && (
            <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
              {snackbar.message}
            </Alert>
          )}

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <PeopleIcon />
              <Typography variant="h6">Customers in this studio</Typography>
              <TextField
                placeholder="Search customers..."
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ minWidth: 220, ml: 'auto' }}
              />
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell><strong>Mobile</strong></TableCell>
                    <TableCell><strong>Added</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClients.length === 0 ? (
                    <TableRow><TableCell colSpan={4}><Alert severity="info">No customers found.</Alert></TableCell></TableRow>
                  ) : (
                    filteredClients.map((row) => {
                      const u = row.user || {};
                      return (
                        <TableRow key={row.id} hover>
                          <TableCell>{u.name || row.name || '—'}</TableCell>
                          <TableCell>{u.email || row.email || '—'}</TableCell>
                          <TableCell>{u.mobile || row.mobile || '—'}</TableCell>
                          <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminStudioDetail;
