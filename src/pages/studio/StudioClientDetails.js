import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  IconButton,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  LinearProgress,
  Fade,
  Grow,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Storage as StorageIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Add as AddIcon2,
  Remove as RemoveIcon,
  AttachMoney as MoneyIcon,
  Update as RenewIcon,
  DriveFileMove as MoveDataIcon,
  OpenInNew as ViewDriveIcon,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { getClientDetails, purchaseSpaceForClient, getStoragePlans as fetchStoragePlans, purchasePlanForClient, getUserPlans, moveMediaBetweenPlans } from '../../services/studioService';
import { formatStorageWithUnits, formatStorageGB } from '../../utils/storageFormat';
import StudioUpload from './StudioUpload';

const StudioClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [purchaseDialog, setPurchaseDialog] = useState({ open: false });
  const [storageAmount, setStorageAmount] = useState(1);
  const [period, setPeriod] = useState('month');
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [userPlans, setUserPlans] = useState([]);

  // Pricing: ₹3 per GB per month, ₹30 per GB per year
  const pricePerGBMonth = 3;
  const pricePerGBYear = 30;

  // Upload dialog state for plan-specific upload
  const [uploadDialog, setUploadDialog] = useState({ open: false, plan: null });
  // Move data dialog: move media from one plan to another
  const [moveDialog, setMoveDialog] = useState({ open: false, sourcePlan: null });
  const [moveToPlanId, setMoveToPlanId] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [moveSelectedIds, setMoveSelectedIds] = useState([]);
  const [moveFilter, setMoveFilter] = useState('all'); // 'all' | 'video' | 'image' - follows tabValue when dialog opens

  const BYTES_PER_GB = 1024 * 1024 * 1024;
  const EXPIRY_NEAR_DAYS = 10;
  const isExpiryNear = (plan) => {
    if (!plan?.expiryDate) return false;
    const expiry = new Date(plan.expiryDate).getTime();
    const now = Date.now();
    const daysLeft = (expiry - now) / (24 * 60 * 60 * 1000);
    return daysLeft <= EXPIRY_NEAR_DAYS; // within 10 days or already expired
  };

  const calculatePrice = () => {
    if (period === 'month') {
      return storageAmount * pricePerGBMonth;
    } else {
      return storageAmount * pricePerGBYear;
    }
  };

  useEffect(() => {
    loadClientData();
    loadUserPlans();
  }, [id]);

  const loadClientData = async () => {
    try {
      const [data, plans] = await Promise.all([
        getClientDetails(id),
        getUserPlans(id),
      ]);
      setClientData(data);
      setUserPlans(plans || []);
    } catch (error) {
      console.error('Failed to load client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPlans = async () => {
    try {
      const plans = await getUserPlans(id);
      setUserPlans(plans || []);
    } catch (error) {
      console.error('Failed to load user plans:', error);
    }
  };

  const filteredMedia = () => {
    if (!clientData?.media || !Array.isArray(clientData.media)) return [];
    let filtered = [...clientData.media];

    if (tabValue === 0) {
      filtered = filtered.filter(m => m.category === 'video');
    } else {
      filtered = filtered.filter(m => m.category === 'image');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => m.name?.toLowerCase().includes(query));
    }

    return filtered;
  };

  const handlePurchase = async () => {
    if (storageAmount < 1) {
      setSnackbar({ open: true, message: 'Please select at least 1 GB', severity: 'error' });
      return;
    }

    setPurchaseLoading(true);
    try {
      if (selectedPlanId) {
        const plan = plans.find(p => String(p.id) === String(selectedPlanId));
        if (!plan) throw new Error('Selected plan not found');

        // Add userId to payload
        const userId = clientData?.client?.id || clientData?.client?.userId;

        if (plan.category === 'per_gb') {
          if (storageAmount < 1) throw new Error('Please select at least 1 GB');
          await purchasePlanForClient(id, { planId: plan.id, storage: storageAmount, period, userId });
        } else {
          await purchasePlanForClient(id, { planId: plan.id, period, userId });
        }
      } else {
        await purchaseSpaceForClient(id, {
          storage: storageAmount,
          period: period,
          price: calculatePrice(),
        });
      }
      loadClientData();
      setPurchaseDialog({ open: false });
      setStorageAmount(1);
      setPeriod('month');
      setSelectedPlanId('');
      setSnackbar({
        open: true,
        message: `${storageAmount} GB storage purchased successfully for client`,
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
          const allPlans = await fetchStoragePlans();
          setPlans(allPlans || []);
        } catch (err) {
          console.error('Failed to load plans', err);
        }
      })();
    }
  }, [purchaseDialog.open]);

  const hasPerGbPlan = plans.some(p => p.category === 'per_gb');

  // When selected plan changes, update storage amount for fixed plans
  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans.find(p => String(p.id) === String(selectedPlanId));
    if (plan && plan.category === 'fixed') {
      setStorageAmount(parseFloat(plan.storage) || 1);
    }
  }, [selectedPlanId, plans]);

  // Derived selected plan
  const selectedPlan = selectedPlanId ? plans.find(p => String(p.id) === String(selectedPlanId)) : null;

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

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!clientData?.client) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error">Client not found</Alert>
      </Container>
    );
  }

  const videoCount = Array.isArray(clientData.media) ? clientData.media.filter(m => m.category === 'video').length : 0;
  const imageCount = Array.isArray(clientData.media) ? clientData.media.filter(m => m.category === 'image').length : 0;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
            <IconButton onClick={() => navigate('/studio/clients')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 'bold',
                flexGrow: 1,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              {clientData.client.name || 'Client Details'}
            </Typography>

          </Box>



          {/* User Purchased Plans List - Improved UI */}
          <Paper elevation={4} sx={{ mb: 3, p: 2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Purchased Plans</Typography>
            {userPlans.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No plans purchased yet.</Typography>
            ) : (
              <Grid container spacing={2}>
                {userPlans.map((plan) => (
                  <Grid item xs={12} sm={6} md={4} key={plan.id}>
                    <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <CardActionArea
                        onClick={() => navigate(`/studio/clients/${id}/drive/${plan.id}`)}
                        sx={{ flexGrow: 1, display: 'block', '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <StorageIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              Plan {plan.totalStorage} GB
                            </Typography>
                            <ViewDriveIcon sx={{ ml: 0.5, fontSize: 18, color: 'text.secondary' }} />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Chip icon={<CalendarIcon />} label={`Purchase: ${plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : '–'}`} size="small" variant="outlined" />
                            <Chip icon={<CalendarIcon />} label={`Expiry: ${new Date(plan.expiryDate).toLocaleDateString()}`} size="small" />
                            <Chip label={plan.status} color={plan.status === 'active' ? 'success' : 'default'} size="small" />
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            {(() => {
                              const fmt = formatStorageWithUnits(plan.totalStorage, plan.usedStorage, { usedIsBytes: true });
                              return (
                                <>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Total:</strong> {fmt.totalFormatted}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Used:</strong> {fmt.usedFormatted}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Available:</strong> {fmt.availableFormatted}
                                  </Typography>
                                </>
                              );
                            })()}
                          </Box>
                        </CardContent>
                      </CardActionArea>
                      <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                        {(() => {
                          const availableGB = Number(plan.totalStorage) - (Number(plan.usedStorage) / BYTES_PER_GB);
                          const noSpace = availableGB <= 0;
                          const nearExpiry = isExpiryNear(plan);
                          return (
                            <>
                              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    if (noSpace) return;
                                    loadUserPlans();
                                    setUploadDialog({ open: true, plan });
                                  }}
                                  disabled={noSpace}
                                  title={noSpace ? 'No space available for upload' : ''}
                                >
                                  {noSpace ? 'No space' : 'Upload Media'}
                                </Button>
                                {nearExpiry && (
                                  <Button
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    startIcon={<RenewIcon />}
                                    onClick={() => setPurchaseDialog({ open: true })}
                                  >
                                    Renew
                                  </Button>
                                )}
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<MoveDataIcon />}
                                  onClick={() => {
                                    setMoveDialog({ open: true, sourcePlan: plan });
                                    setMoveToPlanId('');
                                    setMoveSelectedIds([]);
                                    setMoveFilter(tabValue === 0 ? 'video' : 'image');
                                  }}
                                >
                                  Move data
                                </Button>
                              </Box>
                            </>
                          );
                        })()}
                      </Box>
                    </Card>
                  </Grid>
                ))}
                {/* Upload Media Dialog/Modal - use latest plan from userPlans so storage is current after upload/delete */}
                <Dialog
                  open={uploadDialog.open}
                  onClose={() => setUploadDialog({ open: false, plan: null })}
                  maxWidth="sm"
                  fullWidth
                  TransitionComponent={Fade}
                >
                  {(() => {
                    const currentPlan = uploadDialog.plan?.id != null
                      ? (userPlans.find((p) => p.id === uploadDialog.plan.id) || uploadDialog.plan)
                      : uploadDialog.plan;
                    const availableStorageGB = currentPlan
                      ? (Number(currentPlan.totalStorage) - (Number(currentPlan.usedStorage) / (1024 * 1024 * 1024)))
                      : 0;
                    return (
                      <>
                        <DialogTitle>Upload Media for Plan ({currentPlan?.totalStorage} GB)</DialogTitle>
                        <DialogContent>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            {currentPlan && (() => {
                              const fmt = formatStorageWithUnits(currentPlan.totalStorage, currentPlan.usedStorage, { usedIsBytes: true });
                              return (
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Available:</strong> {fmt.availableFormatted}
                                </Typography>
                              );
                            })()}
                            <StudioUpload
                              clientId={clientData.client.id}
                              selectedUserPlanId={currentPlan?.id}
                              availableStorageGB={availableStorageGB}
                              reloadPlans={loadClientData}
                              onPlanStorageUpdate={(planStorage) => {
                                if (!planStorage?.planId) return;
                                setUserPlans((prev) =>
                                  prev.map((p) =>
                                    p.id === planStorage.planId
                                      ? { ...p, usedStorage: planStorage.usedStorage, totalStorage: planStorage.totalStorage }
                                      : p
                                  )
                                );
                              }}
                            />
                          </Box>
                        </DialogContent>
                      </>
                    );
                  })()}
                  <DialogActions>
                    <Button onClick={() => setUploadDialog({ open: false, plan: null })}>Close</Button>
                  </DialogActions>
                </Dialog>

                {/* Move data: show source media, multi-select, move only selected to chosen drive */}
                <Dialog
                  open={moveDialog.open}
                  onClose={() => setMoveDialog({ open: false, sourcePlan: null })}
                  maxWidth="sm"
                  fullWidth
                  TransitionComponent={Fade}
                >
                  <DialogTitle>Move data to another drive</DialogTitle>
                  <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                      {userPlans.length < 2 && (
                        <Alert severity="info">You need at least two plans to move data. Purchase another plan first.</Alert>
                      )}
                      {moveDialog.sourcePlan && userPlans.length >= 2 && (
                        <>
                          <Typography variant="subtitle2" color="text.secondary">
                            Source: Plan {moveDialog.sourcePlan.totalStorage} GB — Expiry: {new Date(moveDialog.sourcePlan.expiryDate).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2">Filter:</Typography>
                            <ToggleButtonGroup
                              value={moveFilter}
                              exclusive
                              onChange={(e, v) => v && setMoveFilter(v)}
                              size="small"
                            >
                              <ToggleButton value="all">All</ToggleButton>
                              <ToggleButton value="video">Videos</ToggleButton>
                              <ToggleButton value="image">Images</ToggleButton>
                            </ToggleButtonGroup>
                          </Box>
                          {(() => {
                            const allInSource = Array.isArray(clientData?.media)
                              ? clientData.media.filter((m) => Number(m.userPlanId) === Number(moveDialog.sourcePlan?.id))
                              : [];
                            const filtered =
                              moveFilter === 'video'
                                ? allInSource.filter((m) => m.category === 'video')
                                : moveFilter === 'image'
                                  ? allInSource.filter((m) => m.category === 'image')
                                  : allInSource;
                            const selectedCount = moveSelectedIds.length;
                            const allFilteredIds = filtered.map((m) => m.id);
                            const allSelected = filtered.length > 0 && allFilteredIds.every((id) => moveSelectedIds.includes(id));
                            return (
                              <>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={allSelected}
                                      indeterminate={selectedCount > 0 && selectedCount < filtered.length}
                                      onChange={(e) => {
                                        if (e.target.checked)
                                          setMoveSelectedIds((prev) => [...new Set([...prev, ...allFilteredIds])]);
                                        else setMoveSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
                                      }}
                                    />
                                  }
                                  label={`Select all (${filtered.length} items)`}
                                />
                                <List dense sx={{ maxHeight: 220, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                  {filtered.length === 0 ? (
                                    <ListItem><ListItemText primary="No media in this drive for selected filter." /></ListItem>
                                  ) : (
                                    filtered.map((item) => (
                                      <ListItem
                                        key={item.id}
                                        secondaryAction={
                                          <Checkbox
                                            edge="end"
                                            checked={moveSelectedIds.includes(item.id)}
                                            onChange={(e) => {
                                              if (e.target.checked)
                                                setMoveSelectedIds((prev) => [...prev, item.id]);
                                              else setMoveSelectedIds((prev) => prev.filter((id) => id !== item.id));
                                            }}
                                          />
                                        }
                                      >
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                          {item.category === 'video' ? (
                                            <VideoLibraryIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                                          ) : (
                                            <ImageIcon sx={{ color: 'secondary.main', fontSize: 28 }} />
                                          )}
                                        </ListItemIcon>
                                        <ListItemText primary={item.name} secondary={item.size ? `${(item.size / (1024 * 1024)).toFixed(2)} MB` : ''} />
                                      </ListItem>
                                    ))
                                  )}
                                </List>
                          <FormControl fullWidth required size="small">
                            <InputLabel>To (destination) drive</InputLabel>
                            <Select
                              value={moveToPlanId}
                              label="To (destination) drive"
                              onChange={(e) => setMoveToPlanId(e.target.value)}
                            >
                              {userPlans
                                .filter((p) => p.id !== moveDialog.sourcePlan?.id)
                                .map((p) => (
                                  <MenuItem key={p.id} value={p.id}>
                                    Plan {p.totalStorage} GB — Expiry: {new Date(p.expiryDate).toLocaleDateString()}
                                  </MenuItem>
                                ))}
                            </Select>
                          </FormControl>
                          {moveToPlanId && (() => {
                            const dest = userPlans.find((p) => p.id === Number(moveToPlanId));
                            const selectedSize = filtered
                              .filter((m) => moveSelectedIds.includes(m.id))
                              .reduce((sum, m) => sum + (Number(m.size) || 0), 0);
                            const destTotalBytes = (Number(dest?.totalStorage) || 0) * BYTES_PER_GB;
                            const destUsed = Number(dest?.usedStorage) || 0;
                            const destFree = destTotalBytes - destUsed;
                            const hasSpace = destFree >= selectedSize;
                            return (
                              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" gutterBottom>Destination drive</Typography>
                                <Typography variant="body2">
                                  Plan {dest?.totalStorage} GB — Expiry: {dest ? new Date(dest.expiryDate).toLocaleDateString() : '–'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Free: {formatStorageGB(destFree / BYTES_PER_GB)} • Selected: {selectedCount} item(s), {formatStorageGB(selectedSize / BYTES_PER_GB)}
                                </Typography>
                                {selectedCount > 0 && (
                                  <Alert severity={hasSpace ? 'success' : 'warning'} sx={{ mt: 1 }}>
                                    {hasSpace ? 'Enough space for selected.' : 'Selected size may exceed free space.'}
                                  </Alert>
                                )}
                              </Paper>
                            );
                          })()}
                                </>
                            );
                          })()}
                        </>
                      )}
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setMoveDialog({ open: false, sourcePlan: null })}>Cancel</Button>
                    <Button
                      variant="contained"
                      onClick={async () => {
                        if (!moveDialog.sourcePlan?.id || !moveToPlanId) return;
                        setMoveLoading(true);
                        try {
                          await moveMediaBetweenPlans(
                            id,
                            moveDialog.sourcePlan.id,
                            Number(moveToPlanId),
                            moveSelectedIds.length > 0 ? moveSelectedIds : null
                          );
                          setSnackbar({
                            open: true,
                            message: moveSelectedIds.length > 0
                              ? `${moveSelectedIds.length} item(s) moved successfully`
                              : 'Data moved successfully',
                            severity: 'success',
                          });
                          setMoveDialog({ open: false, sourcePlan: null });
                          setMoveToPlanId('');
                          setMoveSelectedIds([]);
                          loadClientData();
                        } catch (err) {
                          setSnackbar({
                            open: true,
                            message: err.response?.data?.message || 'Failed to move data',
                            severity: 'error',
                          });
                        } finally {
                          setMoveLoading(false);
                        }
                      }}
                      disabled={!moveToPlanId || moveLoading || moveSelectedIds.length === 0}
                    >
                      {moveLoading ? 'Moving…' : `Move ${moveSelectedIds.length} selected`}
                    </Button>
                  </DialogActions>
                </Dialog>

                <Button
                  size="small"
                  variant="contained"
                  startIcon={<MoneyIcon />}
                  sx={{ mt: 2, mx: 1 }}
                  onClick={() => setPurchaseDialog({ open: true })}
                  fullWidth
                >
                  Purchase Storage
                </Button>
              </Grid>
            )}
          </Paper>

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Client Info</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {clientData.client.email || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Mobile:</strong> {clientData.client.mobile || 'N/A'}</Typography>
                </CardContent>
              </Card>
            </Grid>
            {clientData.storage && (
            <Grid item xs={12} md={4}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Storage</Typography>
                  {(() => {
                    const s = clientData.storage;
                    const fmt = formatStorageWithUnits(s.totalStorage, s.usedStorage);
                    return (
                      <>
                        <Typography variant="body2"><strong>Total:</strong> {fmt.totalFormatted}</Typography>
                        <Typography variant="body2"><strong>Used:</strong> {fmt.usedFormatted}</Typography>
                        <Typography variant="body2"><strong>Available:</strong> {fmt.availableFormatted}</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={s.totalStorage > 0 ? Math.min(100, (s.usedStorage / s.totalStorage) * 100) : 0}
                          sx={{ mt: 2, height: 8, borderRadius: 4 }}
                          color={fmt.isOverage ? 'error' : 'primary'}
                        />
                      </>
                    );
                  })()}
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<MoneyIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => setPurchaseDialog({ open: true })}
                    fullWidth
                  >
                    Purchase Storage
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            )}
            <Grid item xs={12} md={4}>
              <Card elevation={4}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Media Stats</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Box>
                      <Typography variant="h4" color="primary.main">{videoCount}</Typography>
                      <Typography variant="body2">Videos</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" color="secondary.main">{imageCount}</Typography>
                      <Typography variant="body2">Images</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Media Distribution Graph */}
            <Grid item xs={12} md={6}>
              <Card elevation={4}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Media Distribution
                  </Typography>
                  <Box sx={{ width: '100%', overflow: 'auto' }}>
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: ['Videos', 'Images'] }]}
                      series={[{ data: [videoCount, imageCount] }]}
                      width={Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 100 : 400)}
                      height={Math.min(250, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 200 : 250) : 250)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Media Overview Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card elevation={4}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Media Overview
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {(() => {
                      const pieData = [
                        { id: 0, value: Math.max(0, parseFloat(videoCount) || 0), label: 'Videos', color: '#1976d2' },
                        { id: 1, value: Math.max(0, parseFloat(imageCount) || 0), label: 'Images', color: '#dc004e' },
                      ]
                        .map(item => {
                          const numValue = isNaN(item.value) ? 0 : parseFloat(item.value);
                          return {
                            ...item,
                            value: typeof numValue === 'number' && !isNaN(numValue) ? numValue : 0,
                          };
                        })
                        .filter(item => item.value > 0 || (videoCount === 0 && imageCount === 0));

                      return pieData.length > 0 && pieData.every(item => typeof item.value === 'number' && !isNaN(item.value)) ? (
                        <PieChart
                          series={[
                            {
                              data: pieData.map(item => {
                                const numValue = parseFloat(item.value) || 0;
                                return {
                                  id: item.id,
                                  value: isNaN(numValue) ? 0 : Math.round(numValue), // Round to integer
                                  label: item.label,
                                  color: item.color,
                                };
                              }),
                              innerRadius: 50,
                              outerRadius: 85,
                              valueFormatter: (value, context) => {
                                const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                                return `${numValue}`;
                              },
                            },
                          ]}
                          width={Math.min(300, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 250 : 300) : 300)}
                          height={Math.min(250, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 200 : 250) : 250)}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No media data
                        </Typography>
                      );
                    })()}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Videos" icon={<VideoLibraryIcon />} iconPosition="start" />
              <Tab label="Images" icon={<ImageIcon />} iconPosition="start" />
            </Tabs>

            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon /> }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Date</InputLabel>
                <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                </Select>
              </FormControl>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ p: 2 }}>
              {(() => {
                const media = filteredMedia();
                if (!Array.isArray(media) || media.length === 0) {
                  return <Alert severity="info">No media found</Alert>;
                }
                return viewMode === 'grid' ? (
                  <Grid container spacing={2}>
                    {media.map((item, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                        <Grow in timeout={300 + index * 100}>
                          <Card>
                            <CardContent>
                              {item.category === 'video' ? (
                                <VideoLibraryIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                              ) : (
                                <ImageIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
                              )}
                              <Typography variant="subtitle1" noWrap sx={{ mt: 1, fontWeight: 'bold' }}>
                                {item.name}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grow>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <List>
                    {media.map((item) => (
                      <ListItem key={item.id}>
                        <ListItemIcon>
                          {item.category === 'video' ? (
                            <VideoLibraryIcon sx={{ color: 'primary.main' }} />
                          ) : (
                            <ImageIcon sx={{ color: 'secondary.main' }} />
                          )}
                        </ListItemIcon>
                        <ListItemText primary={item.name} secondary={new Date(item.uploadDate).toLocaleString()} />
                        <ListItemSecondaryAction>
                          <IconButton onClick={() => navigate(`/media/${item.id}`)}>
                            {item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                );
              })()}
            </Box>
          </Paper>
        </Box>
      </Fade>

      <Dialog
        open={purchaseDialog.open}
        onClose={() => setPurchaseDialog({ open: false })}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>Purchase Storage for Client</DialogTitle>
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
            {/* Show period selection only if no plan is selected or selected plan is per_gb */}
            {(!selectedPlan || selectedPlan.category === 'per_gb') && (
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
            )}

            {/* Storage Amount Selection: show only for per_gb plans. For fixed plans we hide quantity controls and show direct purchase. */}
            {(selectedPlan && selectedPlan.category === 'per_gb') && (
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
                    <AddIcon2 />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Price Display */}
            <Paper
              elevation={3}
              sx={{
                mt: 2,
                p: 3,
                borderRadius: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                textAlign: 'center',
              }}
            >
              {/* Display price: if a fixed plan is selected show its fixed price, otherwise show calculated per-GB price */}
              <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                ₹{selectedPlan && selectedPlan.category === 'fixed' ? selectedPlan.price : calculatePrice()}
              </Typography>
              <Typography variant="body1">
                {selectedPlan && selectedPlan.category === 'fixed'
                  ? (selectedPlan.periodLabel || (selectedPlan.period === 'month' ? 'per month' : 'per year'))
                  : (period === 'month' ? 'per month' : 'per year')}
              </Typography>
              {(!selectedPlan || selectedPlan.category !== 'fixed') && period === 'year' && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                  Save ₹{(storageAmount * pricePerGBMonth * 12) - calculatePrice()} compared to monthly
                </Typography>
              )}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPurchaseDialog({ open: false })} disabled={purchaseLoading}>
            Cancel
          </Button>
          <Button
            onClick={handlePurchase}
            variant="contained"
            disabled={purchaseLoading}
            startIcon={<MoneyIcon />}
            size="large"
          >
            {purchaseLoading ? 'Processing...' : (selectedPlan && selectedPlan.category === 'fixed' ? `Purchase Plan` : `Purchase Storage`)}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudioClientDetails;

