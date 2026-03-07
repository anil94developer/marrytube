import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  CloudUpload as CloudUploadIcon,
  CreateNewFolder as CreateFolderIcon,
  DriveFileMove as MoveIcon,
  ContentCopy as CopyIcon,
  Edit as EditIcon,
  Link as ShareIcon,
  Folder as FolderIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { getMyPlans } from '../services/storageService';
import {
  getMediaList,
  deleteMedia,
  getFoldersForUser,
  createFolderForUser,
  uploadMediaForUser,
  updateFolder,
  updateMedia,
  copyMedia,
  deleteFolder,
  moveFolderToDrive,
  copyFolderToDrive,
  createShare,
} from '../services/mediaService';
import { moveMediaBetweenDrives, copyMediaToDrive } from '../services/storageService';
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
const BYTES_PER_GB = 1024 * 1024 * 1024;

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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [uploadDialogFolders, setUploadDialogFolders] = useState([]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [moveCopyDialog, setMoveCopyDialog] = useState({ open: false, type: null, targetFolderId: '', targetDriveId: '', targetFolderIdOnDrive: '', mode: 'move', item: null });
  const [moveCopyFolders, setMoveCopyFolders] = useState([]);
  const [destinationDriveFolders, setDestinationDriveFolders] = useState([]);
  const [renameDialog, setRenameDialog] = useState({ open: false, name: '', item: null, type: 'folder' });
  const [shareDialog, setShareDialog] = useState({ open: false, link: '', item: null });

  const loadDriveData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansData, foldersData, mediaData] = await Promise.all([
        getMyPlans(),
        getFoldersForUser(currentFolderId, planId),
        getMediaList(user.id, null, currentFolderId, planId),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      const p = (plansData || []).find((pl) => String(pl.id) === String(planId));
      setPlan(p || null);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
      setMedia(Array.isArray(mediaData) ? mediaData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [planId, user.id, currentFolderId]);

  useEffect(() => {
    loadDriveData();
  }, [loadDriveData]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateFilter, categoryFilter, sortOrder]);

  useEffect(() => {
    setSelectedIds([]);
    setCurrentFolderId(null);
    setBreadcrumb([{ id: null, name: 'Root' }]);
  }, [planId]);

  const getAvailableGB = useCallback((p) => {
    if (!p) return 0;
    if (p.isDefault) return parseFloat(p.availableStorage) || 0;
    const total = Number(p.totalStorage) || 0;
    const usedBytes = Number(p.usedStorage) || 0;
    return total - usedBytes / BYTES_PER_GB;
  }, []);

  const onDrop = useCallback((acceptedFiles) => {
    const items = acceptedFiles.map((file) => ({
      file,
      id: Date.now() + Math.random(),
      category: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setUploadFiles((prev) => [...prev, ...items]);
  }, []);

  const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv'], 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    multiple: true,
    noClick: true,
  });

  const removeUploadFile = (id) => setUploadFiles((prev) => prev.filter((f) => f.id !== id));

  const loadFoldersForUploadDialog = useCallback(async () => {
    const list = await getFoldersForUser(undefined, planId);
    return Array.isArray(list) ? list : [];
  }, [planId]);

  useEffect(() => {
    if (uploadDialogOpen) {
      loadFoldersForUploadDialog().then((list) => setUploadDialogFolders(list));
      setUploadFiles([]);
      setSelectedFolder(currentFolderId != null ? String(currentFolderId) : '');
      setCreateFolderOpen(false);
      setNewFolderName('');
    }
  }, [uploadDialogOpen, currentFolderId, loadFoldersForUploadDialog]);

  useEffect(() => {
    if (moveCopyDialog.open) {
      loadFoldersForUploadDialog().then((list) => setMoveCopyFolders(list));
      setDestinationDriveFolders([]);
    }
  }, [moveCopyDialog.open, loadFoldersForUploadDialog]);

  useEffect(() => {
    if (moveCopyDialog.open && moveCopyDialog.targetDriveId) {
      getFoldersForUser(undefined, moveCopyDialog.targetDriveId).then((list) => setDestinationDriveFolders(Array.isArray(list) ? list : []));
    } else {
      setDestinationDriveFolders([]);
    }
  }, [moveCopyDialog.open, moveCopyDialog.targetDriveId]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setSnackbar({ open: true, message: 'Enter a folder name', severity: 'warning' });
      return;
    }
    const pId = plan?.id ?? null;
    setCreateFolderLoading(true);
    try {
      const folder = await createFolderForUser(name, pId, currentFolderId);
      await loadDriveData();
      if (uploadDialogOpen) {
        loadFoldersForUploadDialog().then(setUploadDialogFolders);
        if (folder?.id != null) setSelectedFolder(String(folder.id));
      }
      setCreateFolderOpen(false);
      setNewFolderName('');
      setSnackbar({ open: true, message: 'Folder created', severity: 'success' });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to create folder';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleNavigateToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setPage(0);
  };

  const handleBreadcrumbClick = (index) => {
    const item = breadcrumb[index];
    setCurrentFolderId(item.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
    setPage(0);
  };

  const handleRenameSubmit = async () => {
    const { item, type, name } = renameDialog;
    if (!item || !name.trim()) return;
    try {
      if (type === 'folder') await updateFolder(item.id, { name: name.trim() });
      else await updateMedia(item.id, { name: name.trim() });
      setRenameDialog({ open: false, name: '', item: null, type: 'folder' });
      await loadDriveData();
      setSnackbar({ open: true, message: 'Renamed', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Rename failed', severity: 'error' });
    }
  };

  const handleMoveCopySubmit = async () => {
    const { type, targetFolderId, targetDriveId, mode, item } = moveCopyDialog;
    if (!item) return;
    const hasFolder = targetFolderId !== '' && targetFolderId != null;
    const hasDrive = targetDriveId !== '' && targetDriveId != null;
    if (!hasFolder && !hasDrive) return;
    try {
      const userPlanId = planId === 'default' ? 'default' : planId;
      const toFolderIdOnDrive = (moveCopyDialog.targetFolderIdOnDrive !== '' && moveCopyDialog.targetFolderIdOnDrive != null) ? moveCopyDialog.targetFolderIdOnDrive : null;
      if (type === 'folder') {
        if (hasDrive) {
          if (mode === 'move') await moveFolderToDrive(item.id, targetDriveId, toFolderIdOnDrive);
          else await copyFolderToDrive(item.id, targetDriveId, toFolderIdOnDrive);
        } else {
          await updateFolder(item.id, { parentFolderId: targetFolderId || null });
        }
      } else {
        if (hasDrive) {
          if (mode === 'move') await moveMediaBetweenDrives(userPlanId, targetDriveId, [item.id], toFolderIdOnDrive);
          else await copyMediaToDrive(userPlanId, targetDriveId, [item.id], toFolderIdOnDrive);
        } else {
          if (mode === 'move') await updateMedia(item.id, { folderId: targetFolderId || null });
          else await copyMedia(item.id, targetFolderId || null);
        }
      }
      setMoveCopyDialog({ open: false, type: null, targetFolderId: '', targetDriveId: '', targetFolderIdOnDrive: '', mode: 'move', item: null });
      await loadDriveData();
      setSnackbar({ open: true, message: mode === 'move' ? 'Moved' : 'Copied', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Failed', severity: 'error' });
    }
  };

  const handleShareClick = async (item, type) => {
    try {
      const res = await createShare(type, item.id, 30);
      setShareDialog({ open: true, link: res.shareUrl || `${window.location.origin}/share/${res.token}`, item });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Share failed', severity: 'error' });
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      if (currentFolderId === folderId) {
        setCurrentFolderId(null);
        setBreadcrumb([{ id: null, name: 'Root' }]);
      }
      await loadDriveData();
      setSnackbar({ open: true, message: 'Folder deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  const handleUploadSubmit = async () => {
    if (!plan || uploadFiles.length === 0) return;
    const userPlanId = plan.id === 'default' ? 'default' : plan.id;
    const availableGB = getAvailableGB(plan);
    if (availableGB <= 0) {
      setSnackbar({ open: true, message: 'No space in this drive', severity: 'error' });
      return;
    }
    setUploading(true);
    let success = 0;
    let failCount = 0;
    let lastError = null;
    for (const item of uploadFiles) {
      try {
        await uploadMediaForUser({
          file: item.file,
          userPlanId,
          folderId: selectedFolder || null,
        });
        success++;
      } catch (e) {
        failCount++;
        lastError = e?.response?.data?.message || e?.message || 'Upload failed';
        console.error(e);
      }
    }
    setUploading(false);
    setUploadFiles([]);
    setUploadDialogOpen(false);
    try {
      const [mediaData, plansData] = await Promise.all([
        getMediaList(user.id, null, null, planId),
        getMyPlans(),
      ]);
      setMedia(Array.isArray(mediaData) ? mediaData : []);
      const updated = (plansData || []).find((p) => String(p.id) === String(planId));
      if (updated) setPlan(updated);
    } catch (e) {
      console.error(e);
    }
    if (failCount > 0) {
      setSnackbar({ open: true, message: `${success} uploaded, ${failCount} failed. ${lastError}`, severity: 'warning' });
    } else {
      setSnackbar({ open: true, message: `${success} file(s) uploaded successfully`, severity: 'success' });
    }
  };

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
      await loadDriveData();
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
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setUploadDialogOpen(true)}
              disabled={getAvailableGB(plan) <= 0}
              title={getAvailableGB(plan) <= 0 ? 'No space in this drive' : ''}
            >
              Upload Media
            </Button>
          </Box>

          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {breadcrumb.map((b, idx) => (
              <React.Fragment key={b.id ?? 'root'}>
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => handleBreadcrumbClick(idx)}
                  sx={{
                    cursor: 'pointer',
                    border: 'none',
                    background: 'none',
                    color: idx === breadcrumb.length - 1 ? 'primary.main' : 'text.secondary',
                    fontWeight: idx === breadcrumb.length - 1 ? 600 : 400,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {b.name}
                </Typography>
                {idx < breadcrumb.length - 1 && <Typography variant="body2" color="text.secondary">/</Typography>}
              </React.Fragment>
            ))}
            <Button size="small" startIcon={<CreateFolderIcon />} onClick={() => { setNewFolderName(''); setCreateFolderOpen(true); }} sx={{ ml: 1 }}>
              New folder
            </Button>
            {createFolderOpen && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  autoFocus
                  sx={{ width: 180 }}
                />
                <Button size="small" variant="contained" onClick={handleCreateFolder} disabled={createFolderLoading || !newFolderName.trim()}>
                  Create
                </Button>
                <Button size="small" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
              </Box>
            )}
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
              {folders.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Folders</Typography>
                  <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1 }}>
                    {folders.map((f) => (
                      <ListItem
                        key={f.id}
                        secondaryAction={
                          <Box>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRenameDialog({ open: true, name: f.name, item: f, type: 'folder' }); }} title="Rename"><EditIcon /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'folder', mode: 'move', item: f }); }} title="Move"><MoveIcon /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'folder', mode: 'copy', item: f }); }} title="Copy"><CopyIcon /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleShareClick(f, 'folder'); }} title="Share"><ShareIcon /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete folder "${f.name}"?`)) handleDeleteFolder(f.id); }} title="Delete"><DeleteIcon /></IconButton>
                          </Box>
                        }
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleNavigateToFolder(f)}
                      >
                        <ListItemIcon sx={{ minWidth: 40 }}><FolderIcon color="primary" /></ListItemIcon>
                        <ListItemText primary={f.name} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              {mediaDisplayed.length === 0 && folders.length === 0 ? (
                <Alert severity="info">No folders or media in this drive.</Alert>
              ) : viewMode === 'list' ? (
                <List disablePadding>
                  {mediaDisplayed.map((item) => (
                    <ListItem
                      key={item.id}
                      sx={{ borderBottom: 1, borderColor: 'divider' }}
                      secondaryAction={
                        <Box>
                          <IconButton size="small" onClick={() => navigate(`/media/${item.id}`)}>{item.category === 'video' ? <PlayIcon /> : <ViewIcon />}</IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRenameDialog({ open: true, name: item.name, item, type: 'media' }); }}><EditIcon /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'media', mode: 'move', item }); }}><MoveIcon /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'media', mode: 'copy', item }); }}><CopyIcon /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleShareClick(item, 'media'); }}><ShareIcon /></IconButton>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, mediaId: item.id, ids: [item.id], name: item.name }); }}><DeleteIcon /></IconButton>
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
                          <Box sx={{ px: 1, pb: 1, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setRenameDialog({ open: true, name: item.name, item, type: 'media' }); }} title="Rename"><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'media', mode: 'move', item }); }} title="Move"><MoveIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMoveCopyDialog({ open: true, type: 'media', mode: 'copy', item }); }} title="Copy"><CopyIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleShareClick(item, 'media'); }} title="Share"><ShareIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, mediaId: item.id, ids: [item.id], name: item.name }); }} title="Delete"><DeleteIcon fontSize="small" /></IconButton>
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

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth TransitionComponent={Fade}>
        <DialogTitle>
          Upload Media to {plan?.isDefault ? 'Default drive' : `Plan (${plan?.totalStorage} GB)`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {plan && (
              <Typography variant="body2" color="text.secondary">
                <strong>Available:</strong>{' '}
                {formatStorageWithUnits(plan.totalStorage, plan.usedStorage, { usedIsBytes: true }).availableFormatted}
              </Typography>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>Select Folder</InputLabel>
                <Select value={selectedFolder ? String(selectedFolder) : ''} label="Select Folder" onChange={(e) => setSelectedFolder(e.target.value === '' ? '' : e.target.value)}>
                <MenuItem value="">Root</MenuItem>
                {uploadDialogFolders.map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Button size="small" startIcon={<CreateFolderIcon />} onClick={() => setCreateFolderOpen((v) => !v)} variant={createFolderOpen ? 'outlined' : 'text'}>
                {createFolderOpen ? 'Cancel new folder' : 'Create Folder'}
              </Button>
              {createFolderOpen && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    size="small"
                    label="Folder name"
                    placeholder="e.g. Wedding 2026"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    disabled={createFolderLoading}
                    sx={{ minWidth: 180 }}
                  />
                  <Button size="small" variant="contained" onClick={handleCreateFolder} disabled={createFolderLoading || !newFolderName.trim()}>
                    {createFolderLoading ? 'Creating…' : 'Create'}
                  </Button>
                </Box>
              )}
            </Box>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: 2,
                bgcolor: 'action.hover',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.selected', borderColor: 'primary.dark' },
              }}
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <CloudUploadIcon sx={{ fontSize: 56, color: 'primary.main', mb: 1 }} />
                <Typography variant="body1" color="text.primary" gutterBottom>Drag & drop files here</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>or</Typography>
                <Button variant="contained" onClick={(e) => { e.stopPropagation(); openFileDialog(); }}>
                  Browse files
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>Videos & images (e.g. MP4, JPG, PNG)</Typography>
              </Box>
            </Paper>
            {uploadFiles.length > 0 && (
              <List dense>
                {uploadFiles.map((item) => (
                  <ListItem key={item.id} secondaryAction={<Button size="small" onClick={() => removeUploadFile(item.id)}>Remove</Button>}>
                    <ListItemIcon>{item.category === 'video' ? <VideoLibraryIcon /> : <ImageIcon />}</ListItemIcon>
                    <ListItemText primary={item.file.name} secondary={`${(item.file.size / 1024 / 1024).toFixed(2)} MB`} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleUploadSubmit} disabled={uploading || uploadFiles.length === 0}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={renameDialog.open} onClose={() => setRenameDialog({ open: false, name: '', item: null, type: 'folder' })}>
        <DialogTitle>Rename {renameDialog.type === 'folder' ? 'folder' : 'file'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={renameDialog.name}
            onChange={(e) => setRenameDialog((p) => ({ ...p, name: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog({ open: false, name: '', item: null, type: 'folder' })}>Cancel</Button>
          <Button variant="contained" onClick={handleRenameSubmit} disabled={!renameDialog.name?.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={moveCopyDialog.open} onClose={() => setMoveCopyDialog({ open: false, type: null, targetFolderId: '', targetDriveId: '', targetFolderIdOnDrive: '', mode: 'move', item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{moveCopyDialog.mode === 'move' ? 'Move' : 'Copy'} {moveCopyDialog.type === 'folder' ? 'folder' : 'file'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>To folder (same drive)</InputLabel>
              <Select
                value={moveCopyDialog.targetFolderId}
                label="To folder (same drive)"
                onChange={(e) => setMoveCopyDialog((p) => ({ ...p, targetFolderId: e.target.value, targetDriveId: '' }))}
              >
                <MenuItem value="">Root</MenuItem>
                {moveCopyFolders.filter((f) => moveCopyDialog.item && moveCopyDialog.type === 'folder' ? f.id !== moveCopyDialog.item.id : true).map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">— or —</Typography>
            <FormControl size="small" fullWidth>
              <InputLabel>To drive</InputLabel>
              <Select
                value={moveCopyDialog.targetDriveId}
                label="To drive"
                onChange={(e) => setMoveCopyDialog((p) => ({ ...p, targetDriveId: e.target.value, targetFolderId: '', targetFolderIdOnDrive: '' }))}
              >
                <MenuItem value="">Select drive</MenuItem>
                {plans.filter((p) => String(p.id) !== String(planId)).map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.isDefault ? 'Default drive' : `Plan ${p.totalStorage} GB`}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {moveCopyDialog.targetDriveId && (
              <FormControl size="small" fullWidth>
                <InputLabel>Folder on destination drive</InputLabel>
                <Select
                  value={moveCopyDialog.targetFolderIdOnDrive || ''}
                  label="Folder on destination drive"
                  onChange={(e) => setMoveCopyDialog((p) => ({ ...p, targetFolderIdOnDrive: e.target.value }))}
                >
                  <MenuItem value="">Root (top level)</MenuItem>
                  {destinationDriveFolders.map((f) => (
                    <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveCopyDialog({ open: false, type: null, targetFolderId: '', targetDriveId: '', targetFolderIdOnDrive: '', mode: 'move', item: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleMoveCopySubmit} disabled={!moveCopyDialog.targetFolderId && !moveCopyDialog.targetDriveId}>
            {moveCopyDialog.mode === 'move' ? 'Move' : 'Copy'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={shareDialog.open} onClose={() => setShareDialog({ open: false, link: '', item: null })}>
        <DialogTitle>Share link</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Anyone with this link can view (no delete).</Typography>
          <TextField fullWidth size="small" value={shareDialog.link} readOnly InputProps={{ readOnly: true }} />
          <Button size="small" sx={{ mt: 1 }} onClick={() => { navigator.clipboard.writeText(shareDialog.link); setSnackbar({ open: true, message: 'Link copied', severity: 'success' }); }}>Copy link</Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialog({ open: false, link: '', item: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default MediaDriveDetail;
