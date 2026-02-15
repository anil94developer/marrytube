import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField as MuiTextField,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fade,
  Grow,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Paper as MuiPaper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getStudioClients, addStudioClient, updateStudioClient, deleteStudioClient, purchaseSpaceForClient, getStoragePlans, purchasePlanForClient, getUserPlans } from '../../services/studioService';

const StudioClients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all'); // 'all' | 'has_plans' | 'no_plans'
  const [sortBy, setSortBy] = useState('name_asc'); // 'name_asc' | 'name_desc'
  const [viewMode, setViewMode] = useState('grid');
  const [clientDialog, setClientDialog] = useState({ open: false, mode: 'add', client: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, clientId: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [purchaseDialog, setPurchaseDialog] = useState({ open: false, clientId: null, clientName: '' });
  const [storageAmount, setStorageAmount] = useState(1);
  const [period, setPeriod] = useState('month');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [clientPlans, setClientPlans] = useState({}); // { clientId: [plans] }

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await getStudioClients(user.id);
      setClients(data);
      // Fetch plans for each client
      const plansMap = {};
      await Promise.all(
        (data || []).map(async (client) => {
          try {
            const plans = await getUserPlans(client.id);
            plansMap[client.id] = plans || [];
          } catch (e) {
            plansMap[client.id] = [];
          }
        })
      );
      setClientPlans(plansMap);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlans = async (clientId) => {
    try {
      const plans = await getUserPlans(clientId);
      setClientPlans(prev => ({ ...prev, [clientId]: plans || [] }));
    } catch (error) {
      console.error('Failed to load user plans:', error);
    }
  };

  const filteredClients = useMemo(() => {
    let list = [...(clients || [])];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(client =>
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.mobile?.includes(query)
      );
    }
    if (planFilter === 'has_plans') {
      list = list.filter(client => (clientPlans[client.id] || []).length > 0);
    } else if (planFilter === 'no_plans') {
      list = list.filter(client => (clientPlans[client.id] || []).length === 0);
    }
    if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
    } else if (sortBy === 'name_desc') {
      list.sort((a, b) => (b.name || '').localeCompare(a.name || '', undefined, { sensitivity: 'base' }));
    }
    return list;
  }, [clients, searchQuery, planFilter, sortBy, clientPlans]);

  const handleAddClient = () => {
    setFormData({ name: '', email: '', mobile: '' });
    setClientDialog({ open: true, mode: 'add', client: null });
  };

  const handleEditClient = (client) => {
    setFormData({ name: client.name || '', email: client.email || '', mobile: client.mobile || '' });
    setClientDialog({ open: true, mode: 'edit', client });
  };

  const handleSaveClient = async () => {
    try {
      if (clientDialog.mode === 'add') {
        await addStudioClient({ 
          ...formData,
        });
        setSnackbar({ open: true, message: 'Client added successfully', severity: 'success' });
      } else {
        await updateStudioClient(clientDialog.client.id, formData);
        setSnackbar({ open: true, message: 'Client updated successfully', severity: 'success' });
      }
      loadClients();
      setClientDialog({ open: false, mode: 'add', client: null });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to save client', severity: 'error' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudioClient(deleteDialog.clientId);
      loadClients();
      setDeleteDialog({ open: false, clientId: null });
      setSnackbar({ open: true, message: 'Client deleted successfully', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete client', severity: 'error' });
    }
  };

  const pricePerGBMonth = 3;
  const pricePerGBYear = 30;

  const calculatePrice = () => {
    if (period === 'month') {
      return storageAmount * pricePerGBMonth;
    } else {
      return storageAmount * pricePerGBYear;
    }
  };

  const handlePurchaseStorage = async () => {
    if (storageAmount < 1) {
      setSnackbar({ open: true, message: 'Please select at least 1 GB', severity: 'error' });
      return;
    }

    setPurchaseLoading(true);
    try {
      // If a plan is selected, purchase that plan
      if (selectedPlanId) {
        const plan = plans.find(p => String(p.id) === String(selectedPlanId));
        if (!plan) throw new Error('Selected plan not found');

        if (plan.category === 'per_gb') {
          // require storageAmount
          if (storageAmount < 1) throw new Error('Please select at least 1 GB');
          await purchasePlanForClient(purchaseDialog.clientId, { planId: plan.id, storage: storageAmount, period });
        } else {
          await purchasePlanForClient(purchaseDialog.clientId, { planId: plan.id, period });
        }
      } else {
        // fallback to simple purchase endpoint
        await purchaseSpaceForClient(purchaseDialog.clientId, {
          storage: storageAmount,
          period: period,
          price: calculatePrice(),
        });
      }

      setPurchaseDialog({ open: false, clientId: null, clientName: '' });
      setStorageAmount(1);
      setPeriod('month');
      setSelectedPlanId('');
      setSnackbar({ 
        open: true, 
        message: `${storageAmount} GB storage purchased successfully for ${purchaseDialog.clientName}`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.message || 'Failed to purchase storage', 
        severity: 'error' 
      });
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Load plans when purchase dialog opens
  useEffect(() => {
    if (purchaseDialog.open) {
      (async () => {
        try {
          const allPlans = await getStoragePlans();
          setPlans(allPlans || []);
        } catch (err) {
          console.error('Failed to load plans', err);
        }
      })();
    }
  }, [purchaseDialog.open]);

  const hasPerGbPlan = plans.some(p => p.category === 'per_gb');

  // when selected plan changes, update storage amount for fixed plans
  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans.find(p => String(p.id) === String(selectedPlanId));
    if (plan && plan.category === 'fixed') {
      setStorageAmount(parseFloat(plan.storage) || 1);
    }
  }, [selectedPlanId, plans]);

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

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 700,
                fontFamily: '"Playfair Display", "Georgia", serif',
                color: '#2d2d2d',
                fontSize: { xs: '1.4rem', sm: '1.75rem', md: '2rem' },
              }}
            >
              Clients
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextField
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)' },
                }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={planFilter}
                  label="Filter"
                  onChange={(e) => setPlanFilter(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)' }}
                >
                  <MenuItem value="all">All clients</MenuItem>
                  <MenuItem value="has_plans">Has plans</MenuItem>
                  <MenuItem value="no_plans">No plans</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Sort</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.9)' }}
                >
                  <MenuItem value="name_asc">Name A–Z</MenuItem>
                  <MenuItem value="name_desc">Name Z–A</MenuItem>
                </Select>
              </FormControl>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
                sx={{ '& .MuiToggleButton-root': { borderRadius: 2 } }}
              >
                <ToggleButton value="list" aria-label="List view"><ViewListIcon /></ToggleButton>
                <ToggleButton value="grid" aria-label="Grid view"><ViewModuleIcon /></ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddClient}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(196, 92, 92, 0.3)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(196, 92, 92, 0.4)' },
                }}
              >
                Add Client
              </Button>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 2,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.06)',
              bgcolor: 'rgba(255,255,255,0.9)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            {loading ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color="text.secondary">Loading clients…</Typography>
              </Box>
            ) : filteredClients.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No clients found. Add your first client to get started.</Alert>
            ) : viewMode === 'grid' ? (
              <Grid container spacing={2}>
                {filteredClients.map((client, index) => {
                  const plansForClient = clientPlans[client.id] || [];
                  const hasPlans = plansForClient.length > 0;
                  const latestPlan = hasPlans ? plansForClient[0] : null;
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={client.id}>
                      <Grow in timeout={200 + index * 50}>
                        <Card
                          elevation={0}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#fff',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:hover': {
                              boxShadow: '0 8px 24px rgba(196, 92, 92, 0.12)',
                              transform: 'translateY(-2px)',
                            },
                          }}
                          onClick={() => navigate(`/studio/clients/${client.id}`)}
                        >
                          <CardContent sx={{ pb: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                              <Box
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(196, 92, 92, 0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <PersonIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditClient(client); }} sx={{ color: 'text.secondary' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, clientId: client.id }); }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {client.name || 'Unnamed Client'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {client.email || '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {client.mobile || '—'}
                            </Typography>
                            {hasPlans && latestPlan && (
                              <Box sx={{ mt: 1.5, py: 0.75, px: 1, bgcolor: 'rgba(196, 92, 92, 0.08)', borderRadius: 1 }}>
                                <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                                  {latestPlan.totalStorage} GB · Exp {new Date(latestPlan.expiryDate).toLocaleDateString()}
                                </Typography>
                              </Box>
                            )}
                          </CardContent>
                          <CardActions sx={{ px: 2, pb: 1.5, pt: 0 }}>
                            <Button
                              size="small"
                              fullWidth
                              onClick={(e) => { e.stopPropagation(); navigate(`/studio/clients/${client.id}`); }}
                              sx={{ textTransform: 'none', fontWeight: 600 }}
                            >
                              View Details
                            </Button>
                          </CardActions>
                        </Card>
                      </Grow>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <List disablePadding>
                {filteredClients.map((client, index) => {
                  const plansForClient = clientPlans[client.id] || [];
                  const hasPlans = plansForClient.length > 0;
                  const latestPlan = hasPlans ? plansForClient[0] : null;
                  return (
                    <Grow in timeout={200 + index * 50} key={client.id}>
                      <ListItem
                        component="div"
                        onClick={() => navigate(`/studio/clients/${client.id}`)}
                        sx={{
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          borderRadius: 1,
                          mx: 0.5,
                          '&:hover': { bgcolor: 'rgba(196, 92, 92, 0.06)' },
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2, opacity: 0.9 }} />
                        <ListItemText
                          primary={client.name || 'Unnamed Client'}
                          primaryTypographyProps={{ fontWeight: 600 }}
                          secondary={
                            <Box sx={{ mt: 0.25 }}>
                              <Typography variant="body2" color="text.secondary">{client.email || '—'} · {client.mobile || '—'}</Typography>
                              {hasPlans && latestPlan && (
                                <Typography variant="caption" sx={{ color: 'primary.dark' }}>
                                  {latestPlan.totalStorage} GB · Exp {new Date(latestPlan.expiryDate).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<MoneyIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPurchaseDialog({ open: true, clientId: client.id, clientName: client.name || client.email });
                            }}
                            sx={{ mr: 1, borderRadius: 2, textTransform: 'none' }}
                          >
                            Purchase
                          </Button>
                          <IconButton edge="end" onClick={(e) => { e.stopPropagation(); handleEditClient(client); }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, clientId: client.id }); }}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Grow>
                  );
                })}
              </List>
            )}
          </Paper>
        </Box>
      </Fade>

      {/* Add/Edit Client Dialog */}
      <Dialog
        open={clientDialog.open}
        onClose={() => setClientDialog({ open: false, mode: 'add', client: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, m: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>{clientDialog.mode === 'add' ? 'Add New Client' : 'Edit Client'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <MuiTextField
              label="Client Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <MuiTextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <MuiTextField
              label="Mobile"
              type="tel"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientDialog({ open: false, mode: 'add', client: null })}>Cancel</Button>
          <Button onClick={handleSaveClient} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, clientId: null })}
        PaperProps={{ sx: { borderRadius: 3, m: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this client? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, clientId: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Purchase Storage Dialog */}
      <Dialog
        open={purchaseDialog.open}
        onClose={() => setPurchaseDialog({ open: false, clientId: null, clientName: '' })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        PaperProps={{ sx: { borderRadius: 3, m: { xs: 1, sm: 2 } } }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600 }}>Purchase Storage for {purchaseDialog.clientName}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Plan Selection Slider */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Select Plan (optional)
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  pb: 1,
                  '&::-webkit-scrollbar': { height: 8 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8 },
                }}
              >
                {!hasPerGbPlan && (
                  <Box
                    onClick={() => setSelectedPlanId('')}
                    sx={{
                      minWidth: 180,
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: selectedPlanId === '' ? '2px solid' : '1px solid',
                      borderColor: selectedPlanId === '' ? 'primary.main' : 'divider',
                      bgcolor: 'background.paper',
                      flex: '0 0 auto',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Custom / No plan</Typography>
                    <Typography variant="body2" color="text.secondary">Enter custom GB</Typography>
                  </Box>
                )}
                {plans.map(p => (
                  <Box
                    key={p.id}
                    onClick={() => setSelectedPlanId(String(p.id))}
                    sx={{
                      minWidth: 180,
                      p: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: String(selectedPlanId) === String(p.id) ? '2px solid' : '1px solid',
                      borderColor: String(selectedPlanId) === String(p.id) ? 'primary.main' : 'divider',
                      bgcolor: 'background.paper',
                      flex: '0 0 auto',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{p.storage} GB</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>₹{p.price}</Typography>
                    <Typography variant="body2" color="text.secondary">{p.periodLabel || (p.period === 'month' ? 'per month' : 'per year')}</Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>{p.category === 'per_gb' ? 'Per GB' : 'Fixed'}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {/* Period Selection */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Select Billing Period
              </Typography>
              <Tabs
                value={period}
                onChange={(e, v) => setPeriod(v)}
                variant="fullWidth"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab label="Monthly" value="month" />
                <Tab label="Yearly" value="year" />
              </Tabs>
            </Box>

            {(hasPerGbPlan || (plans.find(p => String(p.id) === String(selectedPlanId))?.category === 'per_gb')) && (
              <Box>
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
                    sx={{ border: '2px solid', borderColor: 'primary.main' }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <TextField
                    type="number"
                    value={storageAmount}
                    onChange={handleStorageChange}
                    inputProps={{
                      min: 1,
                      style: { textAlign: 'center', fontWeight: 'bold' },
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">GB</InputAdornment>,
                    }}
                    sx={{
                      width: { xs: '120px', sm: '150px', md: '200px' },
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '1.25rem', sm: '1.5rem' },
                        fontWeight: 'bold',
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleIncrement}
                    color="primary"
                    sx={{ border: '2px solid', borderColor: 'primary.main' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Price Display */}
            <MuiPaper
              elevation={0}
              sx={{
                mt: 2,
                p: 3,
                borderRadius: 2,
                bgcolor: 'rgba(196, 92, 92, 0.12)',
                border: '1px solid',
                borderColor: 'rgba(196, 92, 92, 0.2)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.dark' }}>
                ₹{calculatePrice()}
              </Typography>
              <Typography variant="body1">
                {period === 'month' ? 'per month' : 'per year'}
              </Typography>
              {period === 'year' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Save ₹{(storageAmount * pricePerGBMonth * 12) - calculatePrice()} compared to monthly
                </Typography>
              )}
            </MuiPaper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setPurchaseDialog({ open: false, clientId: null, clientName: '' })} 
            disabled={purchaseLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePurchaseStorage} 
            variant="contained" 
            disabled={purchaseLoading}
            startIcon={<MoneyIcon />}
            size="large"
          >
            {purchaseLoading ? 'Processing...' : 'Purchase Storage'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StudioClients;

