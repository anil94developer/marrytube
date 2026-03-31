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
  Fade,
  Alert,
  Skeleton,
  Button,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Schedule as PendingIcon,
  Error as FailedIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getTransactions } from '../services/storageService';

const Transactions = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ transactions: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTransactions();
      setData({ transactions: res.transactions || [], total: res.total ?? 0 });
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '–');
  const formatAmount = (amount, currency = 'INR') => (currency === 'INR' ? `₹${Number(amount).toFixed(2)}` : `${currency} ${Number(amount).toFixed(2)}`);
  const StatusChip = ({ status }) => {
    if (status === 'success') return <Chip size="small" icon={<SuccessIcon />} label="Success" color="success" />;
    if (status === 'pending') return <Chip size="small" icon={<PendingIcon />} label="Pending" color="warning" />;
    if (status === 'failed') return <Chip size="small" icon={<FailedIcon />} label="Failed" color="error" />;
    return <Chip size="small" label={status || '–'} />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon /> Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            History of your storage plan purchases.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Skeleton height={48} sx={{ mb: 2 }} />
              <Skeleton height={200} />
            </Paper>
          ) : data.transactions.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No transactions yet.</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                When you purchase a storage plan, it will appear here.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Order ID</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Storage</strong></TableCell>
                    <TableCell><strong>Amount</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Gateway</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.transactions.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{t.orderId}</TableCell>
                      <TableCell>{formatDate(t.createdAt)}</TableCell>
                      <TableCell>{t.storage} GB {t.period ? ` / ${t.period}` : ''}</TableCell>
                      <TableCell>{formatAmount(t.amount, t.currency)}</TableCell>
                      <TableCell><StatusChip status={t.status} /></TableCell>
                      <TableCell>{t.paymentGateway || '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && data.transactions.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total: {data.total} transaction{data.total !== 1 ? 's' : ''}
              </Typography>
              <Button size="small" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
            </Box>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default Transactions;
