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
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getMyPlans } from '../services/storageService';
import { getMediaList, deleteMedia } from '../services/mediaService';
import { formatStorageWithUnits } from '../utils/storageFormat';

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

const MediaDriveDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [gridSize, setGridSize] = useState('medium');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mediaId: null, ids: [], name: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [plansData, mediaData] = await Promise.all([
          getMyPlans(),
          getMediaList(user.id, null, null, planId),
        ]);
        if (cancelled) return;
        setPlans(Array.isArray(plansData) ? plansData : []);
        const p = (plansData || []).find((pl) => String(pl.id) === String(planId));
        setPlan(p || null);
        setMedia(Array.isArray(mediaData) ? mediaData : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId, user.id]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    setSelectedIds([]);
  }, [planId]);

  const mediaFiltered = useMemo(() => {
    let list = [...(Array.isArray(media) ? media : [])];
    if (categoryFilter === 'video') list = list.filter((m) => m.category === 'video');
    else if (categoryFilter === 'image') list = list.filter((m) => m.category === 'image');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name?.toLowerCase().includes(q));
    }
    const now = new Date();
    if (dateFilter === 'today') {
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt).toDateString() === now.toDateString());
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= monthAgo);
    }
    list.sort((a, b) => {
      const da = new Date(a.uploadDate || a.createdAt || 0).getTime();
      const db = new Date(b.uploadDate || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
    return list;
  }, [media, categoryFilter, searchQuery, dateFilter, sortOrder]);

  const totalItems = mediaFiltered.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const pageSafe = Math.min(page, Math.max(0, totalPages - 1));
  const mediaDisplayed = useMemo(() => {
    const start = pageSafe * PAGE_SIZE;
    return mediaFiltered.slice(start, start + PAGE_SIZE);
  }, [mediaFiltered, pageSafe]);

  const handlePageChange = (event, newPage) => setPage(newPage);

  const handleDeleteConfirm = async () => {
    const idsToDelete = deleteDialog.ids?.length ? deleteDialog.ids : (deleteDialog.mediaId ? [deleteDialog.mediaId] : []);
    if (idsToDelete.length === 0) return;
    try {
      for (const id of idsToDelete) {
        await deleteMedia(id);
      }
      setMedia((prev) => prev.filter((m) => !idsToDelete.includes(m.id)));
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' });
      setSnackbar({ open: true, message: idsToDelete.length === 1 ? 'Deleted' : `${idsToDelete.length} item(s) deleted`, severity: 'success' });
      const plansData = await getMyPlans();
      const updated = (plansData || []).find((p) => String(p.id) === String(planId));
      if (updated) setPlan(updated);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

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

  if (!plan) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">Drive not found.</Alert>
        <IconButton onClick={() => navigate('/media')} sx={{ mt: 2 }}>
          <ArrowBackIcon /> Back to drives
        </IconButton>
      </Container>
    );
  }

  const isDefault = plan.isDefault === true;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <IconButton onClick={() => navigate('/media')} size="large">
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }} noWrap>
                {isDefault ? 'Default drive' : `Plan ${plan.totalStorage} GB`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isDefault ? 'My drive' : plan.expiryDate ? `Expiry: ${new Date(plan.expiryDate).toLocaleDateString()}` : 'My drive'}
              </Typography>
            </Box>
            <Chip icon={<StorageIcon />} label={plan.status || 'active'} color="success" />
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate('/media')}>
              Upload Media
            </Button>
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
                <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
                  <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                  <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
                </ToggleButtonGroup>
                {viewMode === 'grid' && (
                  <ToggleButtonGroup value={gridSize} exclusive onChange={(e, v) => v && setGridSize(v)} size="small">
                    <ToggleButton value="small">S</ToggleButton>
                    <ToggleButton value="medium">M</ToggleButton>
                    <ToggleButton value="large">L</ToggleButton>
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
                <Alert severity="info">No media in this drive.</Alert>
              ) : viewMode === 'list' ? (
                <List disablePadding>
                  {mediaDisplayed.map((item) => (
                    <ListItem
                      key={item.id}
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
                        secondary={`${(item.size / (1024 * 1024)).toFixed(2)} MB • ${new Date(item.uploadDate || item.createdAt).toLocaleString()}`}
                        onClick={() => navigate(`/media/${item.id}`)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Grid container spacing={2}>
                  {mediaDisplayed.map((item) => (
                    <Grid item {...gridConfig.cols} key={item.id}>
                      <Grow in timeout={80}>
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
                          <CardActionArea sx={{ height: '100%', p: 2 }} onClick={() => navigate(`/media/${item.id}`)}>
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

export default MediaDriveDetail;
