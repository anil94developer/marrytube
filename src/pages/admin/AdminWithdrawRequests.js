import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Alert,
  Fade,
  Skeleton,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  AccountBalanceWallet as WalletIcon,
} from '@mui/icons-material';
import { getAdminFundRequests, approveFundRequest, rejectFundRequest } from '../../services/adminService';

const AdminWithdrawRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, request: null, remarks: '' });
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminFundRequests();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (type, request) => {
    setActionDialog({ open: true, type, request, remarks: request?.remarks || '' });
  };

  const handleClose = () => {
    if (!submitting) setActionDialog({ open: false, type: null, request: null, remarks: '' });
  };

  const handleConfirm = async () => {
    const { type, request, remarks } = actionDialog;
    if (!request) return;
    setSubmitting(true);
    try {
      if (type === 'approve') {
        const res = await approveFundRequest(request.id, remarks);
        if (res?.success) {
          setSnackbar({ open: true, message: 'Withdraw request approved.', severity: 'success' });
          load();
          handleClose();
        } else {
          setSnackbar({ open: true, message: res?.message || 'Failed to approve', severity: 'error' });
        }
      } else {
        const res = await rejectFundRequest(request.id, remarks);
        if (res?.success) {
          setSnackbar({ open: true, message: 'Withdraw request rejected. Amount refunded to studio wallet.', severity: 'success' });
          load();
          handleClose();
        } else {
          setSnackbar({ open: true, message: res?.message || 'Failed to reject', severity: 'error' });
        }
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Request failed.', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const req = actionDialog.request;

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <WalletIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">Withdraw Requests</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Approve or reject studio withdrawal requests. Amount is deducted from studio wallet when they submit; on reject, the amount is refunded.
          </Typography>

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              </Box>
            ) : requests.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">No withdraw requests</Alert>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Studio</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Remarks</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          {row.studio ? (row.studio.name || row.studio.email || `#${row.studioId}`) : `#${row.studioId}`}
                          {row.studio?.email && (
                            <Typography variant="caption" display="block" color="text.secondary">{row.studio.email}</Typography>
                          )}
                        </TableCell>
                        <TableCell>₹{Number(row.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" color={getStatusColor(row.status)} />
                        </TableCell>
                        <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>{row.remarks || '—'}</TableCell>
                        <TableCell align="right">
                          {row.status === 'pending' && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button size="small" variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => handleOpen('approve', row)}>
                                Approve
                              </Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<RejectIcon />} onClick={() => handleOpen('reject', row)}>
                                Reject
                              </Button>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Dialog open={actionDialog.open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Approve withdraw request?' : 'Reject withdraw request?'}
            </DialogTitle>
            <DialogContent>
              {req && (
                <>
                  <DialogContentText>
                    {actionDialog.type === 'approve'
                      ? `Approve ₹${Number(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} for ${req.studio?.name || req.studio?.email || 'studio'}? Payout can be processed to their bank.`
                      : `Reject this request? ₹${Number(req.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be refunded to the studio's wallet.`
                    }
                  </DialogContentText>
                  <TextField
                    fullWidth
                    label="Message / Remarks"
                    multiline
                    rows={2}
                    value={actionDialog.remarks}
                    onChange={(e) => setActionDialog((d) => ({ ...d, remarks: e.target.value }))}
                    placeholder={actionDialog.type === 'reject' ? 'Optional reason for rejection (visible to studio)' : 'Optional note'}
                    sx={{ mt: 2 }}
                  />
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
              <Button
                variant="contained"
                color={actionDialog.type === 'approve' ? 'success' : 'error'}
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? 'Processing...' : actionDialog.type === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogActions>
          </Dialog>

          {snackbar.open && (
            <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
              {snackbar.message}
            </Alert>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminWithdrawRequests;
