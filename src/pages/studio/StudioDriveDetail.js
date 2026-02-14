import React, { useState, useEffect, useMemo } from 'react';
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
  IconButton,
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
  Chip,
  Fade,
  Grow,
  Alert,
  Skeleton,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CropFree as SizeSmallIcon,
  AspectRatio as SizeMediumIcon,
  Dashboard as SizeLargeIcon,
} from '@mui/icons-material';
import { getClientDetails, getUserPlans, deleteClientMedia } from '../../services/studioService';
import { formatStorageWithUnits, formatStorageGB } from '../../utils/storageFormat';

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last Month' },
];

const GRID_SIZES = {
  small: { cols: { xs: 3, sm: 4, md: 6 }, iconSize: 40, titleVariant: 'caption' },
  medium: { cols: { xs: 2, sm: 3, md: 4 }, iconSize: 56, titleVariant: 'body2' },
  large: { cols: { xs: 1, sm: 2, md: 3 }, iconSize: 72, titleVariant: 'subtitle1' },
};

const PAGE_SIZE = 50;

const StudioDriveDetail = () => {
  const { id: clientId, planId } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all | video | image
  const [viewMode, setViewMode] = useState('grid');
  const [gridSize, setGridSize] = useState('medium'); // small | medium | large
  const [sortOrder, setSortOrder] = useState('desc'); // desc | asc
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mediaId: null, ids: [], name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [data, plans] = await Promise.all([
          getClientDetails(clientId),
          getUserPlans(clientId),
        ]);
        if (cancelled) return;
        setClientData(data);
        const p = (plans || []).find((pl) => String(pl.id) === String(planId));
        setPlan(p || null);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, planId]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    setSelectedIds([]);
  }, [clientId, planId]);

  const mediaFiltered = useMemo(() => {
    if (!clientData?.media || !plan) return [];
    let list = clientData.media.filter((m) => Number(m.userPlanId) === Number(plan.id));

    if (categoryFilter === 'video') list = list.filter((m) => m.category === 'video');
    else if (categoryFilter === 'image') list = list.filter((m) => m.category === 'image');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name?.toLowerCase().includes(q));
    }

    const now = new Date();
    if (dateFilter === 'today') {
      list = list.filter((m) => {
        const d = new Date(m.uploadDate || m.createdAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= monthAgo);
    }

    list = [...list].sort((a, b) => {
      const da = new Date(a.uploadDate || a.createdAt || 0).getTime();
      const db = new Date(b.uploadDate || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });

    return list;
  }, [clientData?.media, plan, categoryFilter, searchQuery, dateFilter, sortOrder]);

  // Pagination: show only current page (50 items)
  const totalItems = mediaFiltered.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const pageSafe = Math.min(page, Math.max(0, totalPages - 1));
  const mediaDisplayed = useMemo(() => {
    const start = pageSafe * PAGE_SIZE;
    return mediaFiltered.slice(start, start + PAGE_SIZE);
  }, [mediaFiltered, pageSafe]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    const displayIds = mediaDisplayed.map((m) => m.id);
    const allSelected = displayIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !displayIds.includes(id)) : [...new Set([...prev, ...displayIds])]
    );
  };
  const allDisplayedSelected = mediaDisplayed.length > 0 && mediaDisplayed.every((m) => selectedIds.includes(m.id));

  const handleDeleteConfirm = async () => {
    const idsToDelete = deleteDialog.ids?.length ? deleteDialog.ids : (deleteDialog.mediaId ? [deleteDialog.mediaId] : []);
    if (idsToDelete.length === 0) return;
    try {
      for (const id of idsToDelete) {
        await deleteClientMedia(clientId, id);
      }
      setClientData((prev) => prev ? { ...prev, media: (prev.media || []).filter((m) => !idsToDelete.includes(m.id)) } : null);
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' });
      setSnackbar({ open: true, message: idsToDelete.length === 1 ? 'Deleted' : `${idsToDelete.length} item(s) deleted`, severity: 'success' });
      const [data, plans] = await Promise.all([getClientDetails(clientId), getUserPlans(clientId)]);
      setClientData(data);
      const p = (plans || []).find((pl) => String(pl.id) === String(planId));
      if (p) setPlan(p);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const gridConfig = GRID_SIZES[gridSize] || GRID_SIZES.medium;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!clientData || !plan) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">Drive or client not found.</Alert>
        <IconButton onClick={() => navigate(`/studio/clients/${clientId}`)} sx={{ mt: 2 }}>
          <ArrowBackIcon /> Back to client
        </IconButton>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <IconButton onClick={() => navigate(`/studio/clients/${clientId}`)} size="large">
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }} noWrap>
                {clientData.client?.name || 'Client'} — Drive
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plan {plan.totalStorage} GB • Expiry: {new Date(plan.expiryDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Chip icon={<StorageIcon />} label={plan.status} color={plan.status === 'active' ? 'success' : 'default'} />
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            {(() => {
              const fmt = formatStorageWithUnits(plan.totalStorage, plan.usedStorage, { usedIsBytes: true });
              return (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                    <Typography variant="h6">{fmt.totalFormatted}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Used</Typography>
                    <Typography variant="h6">{fmt.usedFormatted}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Available</Typography>
                    <Typography variant="h6">{fmt.availableFormatted}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">Items</Typography>
                    <Typography variant="h6">{totalItems}</Typography>
                  </Grid>
                </Grid>
              );
            })()}
          </Paper>

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                <TextField
                  placeholder="Search by name..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 220, flexGrow: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Date</InputLabel>
                  <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                    {DATE_FILTERS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="video">Videos</MenuItem>
                    <MenuItem value="image">Images</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select value={sortOrder} label="Sort" onChange={(e) => setSortOrder(e.target.value)}>
                    <MenuItem value="desc">Newest first</MenuItem>
                    <MenuItem value="asc">Oldest first</MenuItem>
                  </Select>
                </FormControl>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, v) => v && setViewMode(v)}
                  size="small"
                >
                  <ToggleButton value="list" aria-label="List"><ViewListIcon /></ToggleButton>
                  <ToggleButton value="grid" aria-label="Grid"><ViewModuleIcon /></ToggleButton>
                </ToggleButtonGroup>
                {viewMode === 'grid' && (
                  <ToggleButtonGroup
                    value={gridSize}
                    exclusive
                    onChange={(e, v) => v && setGridSize(v)}
                    size="small"
                  >
                    <ToggleButton value="small" aria-label="Small"><SizeSmallIcon /></ToggleButton>
                    <ToggleButton value="medium" aria-label="Medium"><SizeMediumIcon /></ToggleButton>
                    <ToggleButton value="large" aria-label="Large"><SizeLargeIcon /></ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>
              {mediaDisplayed.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allDisplayedSelected}
                        indeterminate={selectedIds.some((id) => mediaDisplayed.some((m) => m.id === id)) && !allDisplayedSelected}
                        onChange={toggleSelectAll}
                      />
                    }
                    label="Select all"
                  />
                  {selectedIds.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => setDeleteDialog({ open: true, mediaId: null, ids: [...selectedIds], name: '' })}
                    >
                      Delete selected ({selectedIds.length})
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            <Box sx={{ p: 2 }}>
              {mediaDisplayed.length === 0 ? (
                <Alert severity="info">No media match the current filters.</Alert>
              ) : viewMode === 'list' ? (
                <List disablePadding>
                  {mediaDisplayed.map((item, index) => (
                    <Grow in key={item.id} timeout={80 * Math.min(index, 20)}>
                      <ListItem
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" onClick={() => navigate(`/media/${item.id}`)}>
                              {item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                            </IconButton>
                            <IconButton edge="end" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, mediaId: item.id, ids: [item.id], name: item.name }); }}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <Checkbox
                          edge="start"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <ListItemIcon sx={{ minWidth: 44 }}>
                          {item.category === 'video' ? (
                            <VideoLibraryIcon sx={{ color: 'primary.main', fontSize: 36 }} />
                          ) : (
                            <ImageIcon sx={{ color: 'secondary.main', fontSize: 36 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          secondary={
                            <>
                              {(item.size / (1024 * 1024)).toFixed(2)} MB • {new Date(item.uploadDate || item.createdAt).toLocaleString()}
                            </>
                          }
                          onClick={() => navigate(`/media/${item.id}`)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </ListItem>
                    </Grow>
                  ))}
                </List>
              ) : (
                <Grid container spacing={2}>
                  {mediaDisplayed.map((item, index) => (
                    <Grid item {...gridConfig.cols} key={item.id}>
                      <Grow in timeout={80 * Math.min(index, 24)}>
                        <Card
                          elevation={2}
                          sx={{
                            height: '100%',
                            borderRadius: 2,
                            position: 'relative',
                            border: selectedIds.includes(item.id) ? 2 : 0,
                            borderColor: 'primary.main',
                          }}
                        >
                          <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              size="small"
                              sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                            />
                          </Box>
                          <CardActionArea
                            sx={{ height: '100%', p: 2 }}
                            onClick={() => navigate(`/media/${item.id}`)}
                          >
                            <CardContent sx={{ textAlign: 'center', p: 2, pt: 4 }}>
                              {item.category === 'video' ? (
                                <VideoLibraryIcon sx={{ fontSize: gridConfig.iconSize, color: 'primary.main' }} />
                              ) : (
                                <ImageIcon sx={{ fontSize: gridConfig.iconSize, color: 'secondary.main' }} />
                              )}
                              <Typography variant={gridConfig.titleVariant} sx={{ mt: 1, fontWeight: 600 }} noWrap>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {(item.size / (1024 * 1024)).toFixed(2)} MB
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {new Date(item.uploadDate || item.createdAt).toLocaleDateString()}
                              </Typography>
                            </CardContent>
                          </CardActionArea>
                          <Box sx={{ px: 1, pb: 1, display: 'flex', justifyContent: 'center' }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, mediaId: item.id, ids: [item.id], name: item.name }); }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Card>
                      </Grow>
                    </Grid>
                  ))}
                </Grid>
              )}
              {totalItems > PAGE_SIZE && (
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={pageSafe}
                  onPageChange={handlePageChange}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                />
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' })}>
        <DialogTitle>Delete media?</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog.ids?.length > 1
              ? `Delete ${deleteDialog.ids.length} selected item(s)? This cannot be undone.`
              : `Delete "${deleteDialog.name}"? This cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StudioDriveDetail;
