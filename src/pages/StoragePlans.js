import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Fade,
  Grow,
  Alert,
  Snackbar,
  IconButton,
  TextField,
  Tabs,
  Tab,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  AttachMoney,
  Add as AddIcon,
  Remove as RemoveIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { purchaseStorage, getStoragePlans } from '../services/storageService';

const StoragePlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [period, setPeriod] = useState('month');
  const [storageAmount, setStorageAmount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    (async () => {
      const data = await getStoragePlans();
      setPlans(Array.isArray(data) ? data : []);
    })();
  }, []);

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

  const handlePurchase = async () => {
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
      const result = await purchaseStorage(
        {
          storage: storageToAdd,
          period: getPeriodToSend(),
          price: getPrice(),
          planId: selectedPlan?.id,
        },
        user.id
      );
      setSnackbar({ open: true, message: result.message || 'Storage purchased successfully', severity: 'success' });
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Purchase failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

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
                    <CardActionArea onClick={() => setSelectedPlanId(String(p.id))} sx={{ p: 2, textAlign: 'left' }}>
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

          {/* Selection summary and purchase — like studio */}
          {selectedPlan && (
            <Grow in>
              <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Your selection
                </Typography>
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
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePurchase}
                  disabled={loading || getStorageToPurchase() < 1}
                  startIcon={<AttachMoney />}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  {loading ? 'Processing...' : 'Purchase Now'}
                </Button>
              </Paper>
            </Grow>
          )}

          {!selectedPlan && plans.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Click a plan above to see price and purchase.
            </Typography>
          )}
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
