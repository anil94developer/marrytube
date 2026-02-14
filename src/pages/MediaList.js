import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Skeleton,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Add as AddIcon,
  DriveFileMove as MoveDataIcon,
  OpenInNew as ViewDriveIcon,
  CalendarToday as CalendarIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  CloudUpload as CloudUploadIcon,
  CreateNewFolder as CreateFolderIcon,
  Refresh as RefreshIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { getMyPlans, moveMediaBetweenDrives } from '../services/storageService';
import { getMediaList, uploadMediaForUser, getFoldersForUser, createFolderForUser } from '../services/mediaService';
import { formatStorageWithUnits } from '../utils/storageFormat';

const BYTES_PER_GB = 1024 * 1024 * 1024;

const MediaList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [uploadDialog, setUploadDialog] = useState({ open: false, plan: null });
  const [moveDialog, setMoveDialog] = useState({ open: false, sourcePlan: null });
  const [moveToPlanId, setMoveToPlanId] = useState('');
  const [moveSelectedIds, setMoveSelectedIds] = useState([]);
  const [moveFilter, setMoveFilter] = useState('all');
  const [moveLoading, setMoveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Upload state (inside dialog)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('all');
  const [mediaInPlans, setMediaInPlans] = useState({});

  const loadPlans = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getMyPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setLoadError(e?.response?.data?.message || e?.message || 'Failed to load drives');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const loadMediaForPlan = async (planId) => {
    const id = planId === 'default' ? 'default' : planId;
    const list = await getMediaList(user.id, null, null, id);
    setMediaInPlans((prev) => ({ ...prev, [id]: list }));
  };

  useEffect(() => {
    if (moveDialog.open && moveDialog.sourcePlan) {
      const id = moveDialog.sourcePlan.id;
      loadMediaForPlan(id);
    }
  }, [moveDialog.open, moveDialog.sourcePlan?.id]);

  const getAvailableGB = (plan) => {
    if (!plan) return 0;
    if (plan.isDefault) return parseFloat(plan.availableStorage) || 0;
    const total = Number(plan.totalStorage) || 0;
    const usedBytes = Number(plan.usedStorage) || 0;
    return total - usedBytes / BYTES_PER_GB;
  };

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

  const loadFolders = async () => {
    const list = await getFoldersForUser();
    setFolders(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    if (uploadDialog.open) {
      loadFolders();
      setUploadFiles([]);
      setSelectedFolder('');
      setUploadCategory('all');
      setCreateFolderOpen(false);
      setNewFolderName('');
    }
  }, [uploadDialog.open]);

  const handleCreateFolder = async () => {
    console.log(uploadDialog);
    const name = newFolderName.trim();
    if (!name) {
      setSnackbar({ open: true, message: 'Enter a folder name', severity: 'warning' });
      return;
    }
    const planId = uploadDialog.plan.id ?? null;
    setCreateFolderLoading(true);
    try {
      const folder = await createFolderForUser(name, planId);
      await loadFolders();
      if (folder?.id != null) setSelectedFolder(String(folder.id));
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

  const handleUploadSubmit = async () => {
    const plan = uploadDialog.plan;
    if (!plan || uploadFiles.length === 0) return;
    const planId = plan.id === 'default' ? 'default' : plan.id;
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
          userPlanId: planId,
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
    setUploadDialog({ open: false, plan: null });
    await loadPlans();
    if (failCount > 0) {
      setSnackbar({ open: true, message: `${success} uploaded, ${failCount} failed. ${lastError}`, severity: 'warning' });
    } else {
      setSnackbar({ open: true, message: `${success} file(s) uploaded successfully`, severity: 'success' });
    }
  };

  const handleMoveSubmit = async () => {
    if (!moveDialog.sourcePlan || !moveToPlanId) return;
    try {
      setMoveLoading(true);
      await moveMediaBetweenDrives(
        moveDialog.sourcePlan.id,
        moveToPlanId,
        moveSelectedIds.length > 0 ? moveSelectedIds : null
      );
      setSnackbar({
        open: true,
        message: moveSelectedIds.length > 0 ? `${moveSelectedIds.length} item(s) moved` : 'Data moved',
        severity: 'success',
      });
      setMoveDialog({ open: false, sourcePlan: null });
      setMoveToPlanId('');
      setMoveSelectedIds([]);
      await loadPlans();
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Move failed', severity: 'error' });
    } finally {
      setMoveLoading(false);
    }
  };

  const sourceMedia = moveDialog.sourcePlan
    ? (mediaInPlans[moveDialog.sourcePlan.id] || [])
    : [];
  const filteredMoveMedia =
    moveFilter === 'video'
      ? sourceMedia.filter((m) => m.category === 'video')
      : moveFilter === 'image'
        ? sourceMedia.filter((m) => m.category === 'image')
        : sourceMedia;
  const allFilteredIds = filteredMoveMedia.map((m) => m.id);
  const allSelected = filteredMoveMedia.length > 0 && allFilteredIds.every((id) => moveSelectedIds.includes(id));

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 2, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' } }}>
            My Drives
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click a drive to view files. Upload media or move data between drives.
          </Typography>

          {loading ? (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Purchased Plans</Typography>
              <Grid container spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 2 }} />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ) : loadError ? (
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Alert severity="error" action={<Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={loadPlans}>Retry</Button>}>
                {loadError}
              </Alert>
            </Paper>
          ) : (
            <Paper elevation={4} sx={{ mb: 3, p: 2, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Purchased Plans
              </Typography>
              {plans.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
                  <FolderOpenIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>No drives yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Purchase storage to get a drive and start uploading.</Typography>
                  <Button variant="contained" startIcon={<StorageIcon />} onClick={() => navigate('/storage-plans')}>
                    Purchase Storage
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {plans.map((plan) => {
                    const planId = plan.id;
                    const availableGB = getAvailableGB(plan);
                    const noSpace = availableGB <= 0;
                    const isDefault = plan.isDefault === true;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={planId}>
                        <Card elevation={3} sx={{ borderRadius: 3, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <CardActionArea
                            onClick={() => navigate(`/media/drive/${planId}`)}
                            sx={{ flexGrow: 1, display: 'block', '&:hover': { bgcolor: 'action.hover' } }}
                          >
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <StorageIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                  {isDefault ? 'Default drive' : `Plan ${plan.totalStorage} GB`}
                                </Typography>
                                <ViewDriveIcon sx={{ ml: 0.5, fontSize: 18, color: 'text.secondary' }} />
                              </Box>
                              {!isDefault && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                  {plan.createdAt && (
                                    <Chip icon={<CalendarIcon />} label={`Purchase: ${new Date(plan.createdAt).toLocaleDateString()}`} size="small" variant="outlined" />
                                  )}
                                  {plan.expiryDate && (
                                    <Chip icon={<CalendarIcon />} label={`Expiry: ${new Date(plan.expiryDate).toLocaleDateString()}`} size="small" />
                                  )}
                                  <Chip label={plan.status || 'active'} color={plan.status === 'active' ? 'success' : 'default'} size="small" />
                                </Box>
                              )}
                              <Box sx={{ mt: 1 }}>
                                {(() => {
                                  const fmt = formatStorageWithUnits(plan.totalStorage, plan.usedStorage, { usedIsBytes: true });
                                  return (
                                    <>
                                      <Typography variant="body2" color="text.secondary"><strong>Total:</strong> {fmt.totalFormatted}</Typography>
                                      <Typography variant="body2" color="text.secondary"><strong>Used:</strong> {fmt.usedFormatted}</Typography>
                                      <Typography variant="body2" color="text.secondary"><strong>Available:</strong> {fmt.availableFormatted}</Typography>
                                    </>
                                  );
                                })()}
                              </Box>
                            </CardContent>
                          </CardActionArea>
                          <Box sx={{ p: 2, pt: 0, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={(e) => { e.stopPropagation(); if (!noSpace) setUploadDialog({ open: true, plan: plan}); }}
                                disabled={noSpace}
                                title={noSpace ? 'No space' : ''}
                              >
                                {noSpace ? 'No space' : 'Upload Media'}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<MoveDataIcon />}
                                onClick={(e) => { e.stopPropagation(); setMoveDialog({ open: true, sourcePlan: plan }); setMoveToPlanId(''); setMoveSelectedIds([]); setMoveFilter('all'); }}
                              >
                                Move data
                              </Button>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Paper>
          )}

          {!loading && !loadError && plans.length > 0 && (
            <Button variant="contained" startIcon={<StorageIcon />} onClick={() => navigate('/storage-plans')} sx={{ mb: 2 }}>
              Purchase Storage
            </Button>
          )}
        </Box>
      </Fade>

      {/* Upload Media Dialog */}
      <Dialog open={uploadDialog.open} onClose={() => setUploadDialog({ open: false, plan: null })} maxWidth="sm" fullWidth TransitionComponent={Fade}>
        <DialogTitle>
          Upload Media for {uploadDialog.plan?.isDefault ? 'Default drive' : `Plan (${uploadDialog.plan?.totalStorage} GB)`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {uploadDialog.plan && (
              <Typography variant="body2" color="text.secondary">
                <strong>Available:</strong>{' '}
                {formatStorageWithUnits(uploadDialog.plan.totalStorage, uploadDialog.plan.usedStorage, { usedIsBytes: true }).availableFormatted}
              </Typography>
            )}
            <FormControl size="small" fullWidth>
              <InputLabel>Select Folder</InputLabel>
              <Select value={selectedFolder ? String(selectedFolder) : ''} label="Select Folder" onChange={(e) => setSelectedFolder(e.target.value === '' ? '' : e.target.value)}>
                <MenuItem value="">Root</MenuItem>
                {folders.map((f) => (
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
            <Typography variant="body2">Category filter for new files:</Typography>
            <ToggleButtonGroup value={uploadCategory} exclusive onChange={(e, v) => v != null && setUploadCategory(v)} size="small">
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="video">Videos only</ToggleButton>
              <ToggleButton value="image">Images only</ToggleButton>
            </ToggleButtonGroup>
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
          <Button onClick={() => setUploadDialog({ open: false, plan: null })}>Close</Button>
          <Button variant="contained" onClick={handleUploadSubmit} disabled={uploading || uploadFiles.length === 0}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move Data Dialog */}
      <Dialog open={moveDialog.open} onClose={() => setMoveDialog({ open: false, sourcePlan: null })} maxWidth="sm" fullWidth TransitionComponent={Fade}>
        <DialogTitle>Move data to another drive</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {plans.length < 2 && <Alert severity="info">You need at least two drives to move data.</Alert>}
            {moveDialog.sourcePlan && plans.length >= 2 && (
              <>
                <Typography variant="body2" color="text.secondary">
                  Source: {moveDialog.sourcePlan.isDefault ? 'Default drive' : `Plan ${moveDialog.sourcePlan.totalStorage} GB`}
                </Typography>
                <ToggleButtonGroup value={moveFilter} exclusive onChange={(e, v) => v != null && setMoveFilter(v)} size="small">
                  <ToggleButton value="all">All</ToggleButton>
                  <ToggleButton value="video">Videos</ToggleButton>
                  <ToggleButton value="image">Images</ToggleButton>
                </ToggleButtonGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filteredMoveMedia.length > 0 && allSelected}
                      indeterminate={moveSelectedIds.length > 0 && moveSelectedIds.length < filteredMoveMedia.length}
                      onChange={(e) => {
                        if (e.target.checked) setMoveSelectedIds((prev) => [...new Set([...prev, ...allFilteredIds])]);
                        else setMoveSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
                      }}
                    />
                  }
                  label={`Select all (${filteredMoveMedia.length} items)`}
                />
                <List dense sx={{ maxHeight: 220, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  {filteredMoveMedia.length === 0 ? (
                    <ListItem><ListItemText primary="No media in this drive for selected filter." /></ListItem>
                  ) : (
                    filteredMoveMedia.map((item) => (
                      <ListItem
                        key={item.id}
                        secondaryAction={
                          <Checkbox
                            edge="end"
                            checked={moveSelectedIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setMoveSelectedIds((prev) => [...prev, item.id]);
                              else setMoveSelectedIds((prev) => prev.filter((id) => id !== item.id));
                            }}
                          />
                        }
                      >
                        <ListItemIcon>{item.category === 'video' ? <VideoLibraryIcon /> : <ImageIcon />}</ListItemIcon>
                        <ListItemText primary={item.name} secondary={item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : ''} />
                      </ListItem>
                    ))
                  )}
                </List>
                <FormControl fullWidth size="small">
                  <InputLabel>To (destination) drive</InputLabel>
                  <Select value={moveToPlanId ? String(moveToPlanId) : ''} label="To (destination) drive" onChange={(e) => setMoveToPlanId(e.target.value)}>
                    {plans.filter((p) => p.id !== moveDialog.sourcePlan?.id).map((p) => (
                      <MenuItem key={String(p.id)} value={String(p.id)}>
                        {p.isDefault ? 'Default drive' : `Plan ${p.totalStorage} GB`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialog({ open: false, sourcePlan: null })}>Cancel</Button>
          <Button variant="contained" onClick={handleMoveSubmit} disabled={!moveToPlanId || moveLoading}>
            {moveLoading ? 'Moving...' : 'Move'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default MediaList;
