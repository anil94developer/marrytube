import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Grow,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Folder as FolderIcon,
  CreateNewFolder as CreateFolderIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { getFolders, createFolder, uploadMediaForClient } from '../../services/mediaService';
import { formatStorageGB } from '../../utils/storageFormat';

const StudioUpload = (props) => {
  const { clientId, selectedUserPlanId, availableStorageGB = 0 } = props;
  const availableBytes = availableStorageGB * (1024 ** 3);
  const noSpaceAvailable = availableStorageGB <= 0;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
 
 
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [createFolderDialog, setCreateFolderDialog] = useState({ open: false, name: '' });
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'video', 'image'

  useEffect(() => {
    loadFolders();
     
  }, [clientId]);
 

  const loadFolders = async () => {
    if (!clientId || !selectedUserPlanId) return;
    try {
      // Get folders for the selected client and plan
      const allFolders = await getFolders(clientId, selectedUserPlanId);
      setFolders(allFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleCreateFolder = async () => {
     
    if (!createFolderDialog.name.trim() || !clientId) {
      setSnackbar({
        open: true,
        message: 'Please enter a folder name and select a client',
        severity: 'error',
      });
      return;
    }

    try {
      const newFolder = await createFolder({
        clientId: clientId,
        name: createFolderDialog.name.trim(),
        userPlanId: selectedUserPlanId, // add this if you have plan selection in UI
      });
      await loadFolders();
      setSelectedFolder(newFolder.id);
      setCreateFolderDialog({ open: false, name: '' });
      setSnackbar({
        open: true,
        message: 'Folder created successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to create folder',
        severity: 'error',
      });
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (!clientId) {
      setSnackbar({
        open: true,
        message: 'Please select a client first',
        severity: 'error',
      });
      return;
    }

    const newFiles = acceptedFiles.map((file) => {
      let category = file.type.startsWith('video/') ? 'video' : 'image';
      
      // Apply category filter if set
      if (categoryFilter !== 'all' && category !== categoryFilter) {
        return null;
      }
      
      return {
        file,
        id: Date.now() + Math.random(),
        progress: 0,
        status: 'pending',
        category: category,
      };
    }).filter(f => f !== null);

    setFiles((prev) => [...prev, ...newFiles]);
  }, [clientId, categoryFilter]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    multiple: true,
  });

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[id];
      return newProgress;
    });
  };

  const handleUpload = async () => {
    if (noSpaceAvailable) {
      setSnackbar({
        open: true,
        message: 'No space available for upload. You have exceeded your plan limit. Please purchase more storage.',
        severity: 'error',
      });
      return;
    }

    const totalFileSize = files.reduce((acc, item) => acc + (item.file?.size || 0), 0);
    if (availableBytes < totalFileSize) {
      setSnackbar({
        open: true,
        message: 'Not enough storage available for the selected files. Free up space or purchase more storage.',
        severity: 'error',
      });
      return;
    }

    if (files.length === 0 || !clientId) return;

    setUploading(true);
    const uploadPromises = files.map(async (fileItem) => {
      try {
        const data = await uploadMediaForClient(clientId, {
          file: fileItem.file,
          userPlanId: selectedUserPlanId,
          folderId: selectedFolder || null,
        });
        return { id: fileItem.id, success: true, planStorage: data?.planStorage };
      } catch (error) {
        return { id: fileItem.id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter((r) => r.success).length;
    const lastWithStorage = [...results].reverse().find((r) => r.success && r.planStorage);

    setSnackbar({
      open: true,
      message: `${successCount} file(s) uploaded successfully`,
      severity: 'success',
    });

    setUploading(false);
    setFiles([]);
    setUploadProgress({});

    // Update plan storage in parent (immediate UI) then refetch for full sync
    if (lastWithStorage?.planStorage && props.onPlanStorageUpdate) {
      props.onPlanStorageUpdate(lastWithStorage.planStorage);
    }
    if (props.reloadPlans) {
      await props.reloadPlans();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold', 
              mb: { xs: 2, sm: 3, md: 4 },
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Upload Media for Client ({availableStorageGB >= 0 ? formatStorageGB(availableStorageGB) : `Over by ${formatStorageGB(-availableStorageGB)}`})
          </Typography>

          {noSpaceAvailable && (
            <Alert severity="error" sx={{ mb: 2 }}>
              No space available for upload. You have exceeded your plan limit. Please purchase more storage to upload files.
            </Alert>
          )}

          <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 }, borderRadius: 2, opacity: noSpaceAvailable ? 0.7 : 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
               
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <FormControl fullWidth sx={{ minWidth: { xs: '100%', sm: 200 } }}>
                      <InputLabel>Select Folder</InputLabel>
                      <Select
                        value={selectedFolder}
                        label="Select Folder"
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        startAdornment={
                          <InputAdornment position="start">
                            <FolderIcon sx={{ ml: 1, color: 'text.secondary' }} />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="">
                          <em>Root (No Folder)</em>
                        </MenuItem>
                        {(folders || []).map((folder) => (
                          <MenuItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      startIcon={<CreateFolderIcon />}
                      onClick={() => setCreateFolderDialog({ open: true, name: '' })}
                      sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
                    >
                      Create Folder
                    </Button>
                  </Box>

                  <Paper sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Category Filter
                    </Typography>
                    <Tabs
                      value={categoryFilter}
                      onChange={(e, v) => setCategoryFilter(v)}
                      variant="fullWidth"
                      sx={{ mb: 1 }}
                    >
                      <Tab value="all" label="All" />
                      <Tab value="video" label="Videos Only" />
                      <Tab value="image" label="Images Only" />
                    </Tabs>
                  </Paper>
                
            </Box>
          </Paper>

          <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, mb: 3 }}>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: noSpaceAvailable ? 'error.main' : isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                cursor: clientId && !noSpaceAvailable ? 'pointer' : 'not-allowed',
                bgcolor: isDragActive && !noSpaceAvailable ? 'action.hover' : 'background.paper',
                opacity: clientId && !noSpaceAvailable ? 1 : 0.6,
                transition: 'all 0.3s',
              }}
            >
              <input {...getInputProps()} disabled={!clientId || noSpaceAvailable} />
              <CloudUploadIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to select files
              </Typography>
            </Box>
          </Paper>

          {files.length > 0 && (
            <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Selected Files ({files.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={uploading || !clientId || noSpaceAvailable}
                  startIcon={<CloudUploadIcon />}
                >
                  {uploading ? 'Uploading...' : noSpaceAvailable ? 'No space available' : 'Upload All'}
                </Button>
              </Box>

              <List>
                {files.map((fileItem, index) => (
                  <Grow in timeout={300 + index * 100} key={fileItem.id}>
                    <ListItem sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 1 }}>
                      <ListItemIcon>
                        {fileItem.category === 'video' ? (
                          <VideoFileIcon sx={{ color: 'primary.main', fontSize: 40 }} />
                        ) : (
                          <ImageIcon sx={{ color: 'secondary.main', fontSize: 40 }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={fileItem.file.name}
                        secondary={
                          <Box>
                            <Typography variant="caption">{formatFileSize(fileItem.file.size)} • {fileItem.category.toUpperCase()}</Typography>
                            {uploadProgress[fileItem.id] !== undefined && (
                              <Box sx={{ mt: 1 }}>
                                <LinearProgress variant="determinate" value={uploadProgress[fileItem.id]} sx={{ height: 6, borderRadius: 3 }} />
                                <Typography variant="caption">{Math.round(uploadProgress[fileItem.id])}%</Typography>
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <IconButton edge="end" onClick={() => removeFile(fileItem.id)} disabled={uploading}>
                        <CloseIcon />
                      </IconButton>
                    </ListItem>
                  </Grow>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialog.open}
        onClose={() => setCreateFolderDialog({ open: false, name: '' })}
        TransitionComponent={Fade}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a name for the new folder to organize client media files.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={createFolderDialog.name}
            onChange={(e) => setCreateFolderDialog({ ...createFolderDialog, name: e.target.value })}
            placeholder="e.g., Wedding Photos, Event Videos"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderDialog({ open: false, name: '' })}>
            Cancel
          </Button>
          <Button onClick={handleCreateFolder} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudioUpload;

