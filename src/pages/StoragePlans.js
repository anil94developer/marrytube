import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material';
import {
  CheckCircle,
  AttachMoney,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { purchaseStorage } from '../services/storageService';

const StoragePlans = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storageAmount, setStorageAmount] = useState(1);
  const [period, setPeriod] = useState('month'); // 'month' or 'year'
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Pricing: ₹3 per GB per month, ₹30 per GB per year
  const pricePerGBMonth = 3;
  const pricePerGBYear = 30;

  const calculatePrice = () => {
    if (period === 'month') {
      return storageAmount * pricePerGBMonth;
    } else {
      return storageAmount * pricePerGBYear;
    }
  };

  const handleIncrement = () => {
    setStorageAmount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setStorageAmount((prev) => Math.max(1, prev - 1));
  };

  const handleStorageChange = (event) => {
    const value = parseInt(event.target.value) || 1;
    setStorageAmount(Math.max(1, value));
  };

  const handlePeriodChange = (event, newValue) => {
    setPeriod(newValue);
  };

  const handlePurchase = async () => {
    if (storageAmount < 1) {
      setSnackbar({ open: true, message: 'Please select at least 1 GB', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseStorage(
        {
          storage: storageAmount,
          period: period,
          price: calculatePrice(),
        },
        user.id
      );
      setSnackbar({ open: true, message: result.message, severity: 'success' });
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Purchase failed', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md">
      <Fade in timeout={600}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Storage Plans
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12}>
              <Grow in timeout={800}>
                <Card
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 12,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    {/* Period Selection */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Select Billing Period
                      </Typography>
                      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <Tabs
                          value={period}
                          onChange={handlePeriodChange}
                          variant="fullWidth"
                          sx={{
                            '& .MuiTab-root': {
                              textTransform: 'none',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                            },
                          }}
                        >
                          <Tab value="month" label="Monthly" />
                          <Tab value="year" label="Yearly" />
                        </Tabs>
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        {period === 'month' 
                          ? '₹3 per GB per month' 
                          : '₹30 per GB per year (Save 17%)'}
                      </Typography>
                    </Box>

                    {/* Storage Amount Selection */}
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                        Select Storage Amount
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        <IconButton
                          onClick={handleDecrement}
                          disabled={storageAmount <= 1}
                          color="primary"
                          sx={{
                            border: '2px solid',
                            borderColor: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                            },
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>

                        <TextField
                          type="number"
                          value={storageAmount}
                          onChange={handleStorageChange}
                          inputProps={{
                            min: 1,
                            style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' },
                          }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">GB</InputAdornment>,
                          }}
                          sx={{
                            width: { xs: '150px', sm: '200px' },
                            '& .MuiOutlinedInput-root': {
                              fontSize: '1.5rem',
                              fontWeight: 'bold',
                            },
                          }}
                        />

                        <IconButton
                          onClick={handleIncrement}
                          color="primary"
                          sx={{
                            border: '2px solid',
                            borderColor: 'primary.main',
                            '&:hover': {
                              bgcolor: 'primary.main',
                              color: 'white',
                            },
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Features */}
                    <Box sx={{ my: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1">{storageAmount} GB Storage</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1">
                          {period === 'year' ? '12 Months' : '1 Month'} Validity
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1">Unlimited Uploads</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle sx={{ color: 'success.main', mr: 1 }} />
                        <Typography variant="body1">Instant Activation</Typography>
                      </Box>
                    </Box>

                    {/* Price Display */}
                    <Box
                      sx={{
                        textAlign: 'center',
                        mt: 4,
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                      }}
                    >
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        ₹{calculatePrice()}
                      </Typography>
                      <Typography variant="body1">
                        {period === 'month' ? 'per month' : 'per year'}
                      </Typography>
                      {period === 'year' && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                          (₹{Math.round(calculatePrice() / 12)} per month)
                        </Typography>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ p: 3, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handlePurchase}
                      disabled={loading || storageAmount < 1}
                      startIcon={<AttachMoney />}
                      sx={{ py: 1.5 }}
                    >
                      {loading ? 'Processing...' : 'Purchase Now'}
                    </Button>
                  </CardActions>
                </Card>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StoragePlans;