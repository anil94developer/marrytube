import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardActionArea,
  Fade,
  Grow,
  Alert,
  Snackbar,
  IconButton,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  AttachMoney,
  Add as AddIcon,
  Remove as RemoveIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getStoragePlans, createPaymentOrder, confirmPaymentSuccess } from '../services/storageService';

const CASHFREE_SCRIPT = 'https://sdk.cashfree.com/js/v3/cashfree.js';
const loadCashfree = () => {
  if (window.Cashfree) return Promise.resolve(window.Cashfree);
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${CASHFREE_SCRIPT}"]`)) {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error('Cashfree not ready'));
      return;
    }
    const s = document.createElement('script');
    s.src = CASHFREE_SCRIPT;
    s.async = true;
    s.onload = () => resolve(window.Cashfree);
    s.onerror = () => reject(new Error('Failed to load Cashfree'));
    document.head.appendChild(s);
  });
};

const StoragePlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [period, setPeriod] = useState('month');
  const [storageAmount, setStorageAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const paymentReturnHandled = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await getStoragePlans();
      setPlans(Array.isArray(data) ? data : []);
    })();
  }, []);

  // Handle return from Cashfree: ?order_id=...&payment=success
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    const paymentSuccess = searchParams.get('payment') === 'success';
    if (!orderId || !paymentSuccess || paymentReturnHandled.current) return;
    paymentReturnHandled.current = true;

    (async () => {
      setLoading(true);
      try {
        const result = await confirmPaymentSuccess(orderId);
        setDialogOpen(false);
        setSearchParams({});
        navigate('/', { replace: true });
        setSnackbar({ open: true, message: result.message || 'Payment successful! Storage activated.', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: err.message || 'Payment confirmation failed', severity: 'error' });
        setSearchParams({});
        paymentReturnHandled.current = false;
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, navigate, setSearchParams]);

  const selectedPlan = selectedPlanId ? plans.find((p) => String(p.id) === String(selectedPlanId)) : null;
  const perGbPlans = plans.filter((p) => p.category === 'per_gb');
  const fixedPlans = plans.filter((p) => p.category === 'fixed');
  const perGbPlanForPeriod = perGbPlans.find((p) => p.period === period) || perGbPlans[0];

  useEffect(() => {
    if (selectedPlan && selectedPlan.category === 'fixed') {
      setStorageAmount(Math.max(1, parseFloat(selectedPlan.storage) || 1));
    }
  }, [selectedPlanId, selectedPlan]);

  const getPrice = () => {
    if (!selectedPlan) return 0;
    if (selectedPlan.category === 'fixed') return parseFloat(selectedPlan.price) || 0;
    return (storageAmount || 1) * (parseFloat(perGbPlanForPeriod?.price) || 0);
  };

  const getStorageToPurchase = () => {
    if (!selectedPlan) return 0;
    if (selectedPlan.category === 'fixed') return parseFloat(selectedPlan.storage) || 0;
    return storageAmount;
  };

  const getPeriodToSend = () => {
    if (!selectedPlan) return 'month';
    if (selectedPlan.category === 'fixed') return selectedPlan.period || 'month';
    return period;
  };

  const handleIncrement = () => setStorageAmount((prev) => prev + 1);
  const handleDecrement = () => setStorageAmount((prev) => Math.max(1, prev - 1));
  const handleStorageChange = (e) => {
    const v = parseInt(e.target.value, 10);
    setStorageAmount(isNaN(v) ? 1 : Math.max(1, v));
  };

  const handlePurchase = useCallback(async () => {
    if (!selectedPlan) {
      setSnackbar({ open: true, message: 'Please select a plan', severity: 'error' });
      return;
    }
    const storageToAdd = getStorageToPurchase();
    if (storageToAdd < 1) {
      setSnackbar({ open: true, message: 'Please select at least 1 GB', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Use http for localhost so Cashfree redirect works (no SSL error); production keeps https
      const origin = window.location.origin;
      const isLocalhost = /localhost|127\.0\.0\.1/i.test(window.location.hostname);
      const base = isLocalhost ? origin.replace(/^https:/, 'http:') : origin;
      const returnUrl = `${base}${window.location.pathname}?order_id={order_id}&payment=success`;
      const result = await createPaymentOrder(
        {
          storage: storageToAdd,
          period: getPeriodToSend(),
          price: getPrice(),
          planId: selectedPlan?.id,
        },
        returnUrl
      );
      const Cashfree = await loadCashfree();
      const mode = result.cashfreeMode || (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox');
      const cashfree = Cashfree({ mode });
      await cashfree.checkout({
        paymentSessionId: result.paymentSessionId,
        returnUrl: result.returnUrl,
      });
      setDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Payment failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, period, storageAmount, perGbPlanForPeriod]);

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3, md: 4 }, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}
          >
            Storage Plans
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a plan below. Same plans as offered to studio clients — select one and purchase for your account.
          </Typography>

          {/* Plan cards — like studio client page */}
          <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
            Select a plan
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {plans.map((p, idx) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Grow in timeout={300 + idx * 80}>
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 2,
                      border: String(selectedPlanId) === String(p.id) ? '2px solid' : '1px solid',
                      borderColor: String(selectedPlanId) === String(p.id) ? 'primary.main' : 'divider',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { boxShadow: 6 },
                    }}
                  >
                    <CardActionArea
                      onClick={() => {
                        setSelectedPlanId(String(p.id));
                        setDialogOpen(true);
                      }}
                      sx={{ p: 2, textAlign: 'left' }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <StorageIcon color="primary" />
                        <Chip label={p.category === 'per_gb' ? 'Per GB' : 'Fixed'} size="small" color={p.category === 'per_gb' ? 'secondary' : 'primary'} />
                      </Box>
                      <Typography variant="h5" fontWeight="bold">
                        {p.category === 'fixed' ? `${p.storage} GB` : 'Custom GB'}
                      </Typography>
                      <Typography variant="h6" color="primary.main" sx={{ mt: 0.5 }}>
                        ₹{p.price}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {p.periodLabel || (p.period === 'year' ? 'per year' : 'per month')}
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grow>
              </Grid>
            ))}
            {plans.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">No plans available. Contact support.</Alert>
              </Grid>
            )}
          </Grid>

          {plans.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Click a plan to open options and purchase.
            </Typography>
          )}

          {/* Plan selection dialog */}
          <Dialog
            open={dialogOpen && !!selectedPlan}
            onClose={() => setDialogOpen(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 'bold' }}>
              Your selection
            </DialogTitle>
            <DialogContent>
              {selectedPlan && (
                <>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
                    <Chip label={selectedPlan.category === 'fixed' ? 'Fixed' : 'Per GB'} color="primary" size="small" />
                    {selectedPlan.category === 'per_gb' && (
                      <>
                        <Tabs value={period} onChange={(e, v) => setPeriod(v)} variant="standard" sx={{ minHeight: 40 }}>
                          <Tab label="Monthly" value="month" />
                          <Tab label="Yearly" value="year" />
                        </Tabs>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton onClick={handleDecrement} disabled={storageAmount <= 1} color="primary" size="small">
                            <RemoveIcon />
                          </IconButton>
                          <TextField
                            type="number"
                            value={storageAmount}
                            onChange={handleStorageChange}
                            inputProps={{ min: 1 }}
                            size="small"
                            sx={{ width: 80 }}
                            InputProps={{ endAdornment: <InputAdornment position="end">GB</InputAdornment> }}
                          />
                          <IconButton onClick={handleIncrement} color="primary" size="small">
                            <AddIcon />
                          </IconButton>
                        </Box>
                      </>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2">
                      {getStorageToPurchase()} GB · {getPeriodToSend() === 'year' ? '12 months' : '1 month'} · Instant activation
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', py: 2, px: 2, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 2 }}>
                    <Typography variant="h4" fontWeight="bold">
                      ₹{getPrice()}
                    </Typography>
                    <Typography variant="body2">
                      {getPeriodToSend() === 'year' ? 'per year' : 'per month'}
                    </Typography>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 0, flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={() => setDialogOpen(false)} color="inherit">
                Cancel
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handlePurchase}
                disabled={loading || !selectedPlan || getStorageToPurchase() < 1}
                startIcon={<AttachMoney />}
                sx={{ py: 1.25 }}
              >
                {loading ? 'Processing...' : 'Purchase Now'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StoragePlans;
