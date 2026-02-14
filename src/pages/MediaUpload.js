import React, { useState, useCallback, useEffect } from 'react';
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
  Fade,
  Grow,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
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
import { useAuth } from '../contexts/AuthContext';
import { getUploadUrl, saveMedia, getFoldersForUser, createFolderForUser } from '../services/mediaService';
import { getUserStorage } from '../services/storageService';
import { formatStorageGB } from '../utils/storageFormat';

const MediaUpload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableStorage, setAvailableStorage] = useState(0);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folders, setFolders] = useState([]);
  const [createFolderDialog, setCreateFolderDialog] = useState({ open: false, name: '' });

  useEffect(() => {
    loadStorage();
    loadFolders();
  }, []);

  const loadStorage = async () => {
    const storage = await getUserStorage(user.id);
    setAvailableStorage(storage.availableStorage);
  };

  const loadFolders = async () => {
    try {
      const folderList = await getFoldersForUser();
      setFolders(folderList);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const handleCreateFolder = async () => {
    if (!createFolderDialog.name.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a folder name',
        severity: 'error',
      });
      return;
    }

    try {
      const newFolder = await createFolderForUser(createFolderDialog.name.trim());
      await loadFolders();
      if (newFolder && newFolder.id) setSelectedFolder(newFolder.id);
      setCreateFolderDialog({ open: false, name: '' });
      setSnackbar({
        open: true,
        message: 'Folder created successfully',
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create folder',
        severity: 'error',
      });
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (availableStorage <= 0) {
      setSnackbar({
        open: true,
        message: 'Storage limit reached! Please purchase more storage.',
        severity: 'error',
      });
      return;
    }

    const newFiles = [];
    let totalSize = 0;

    acceptedFiles.forEach((file) => {
      const fileSizeInGB = file.size / (1024 * 1024 * 1024);
      if (totalSize + fileSizeInGB > availableStorage) {
        setSnackbar({
          open: true,
          message: `Cannot add more files. Available storage: ${formatStorageGB(availableStorage)}`,
          severity: 'warning',
        });
        return;
      }
      totalSize += fileSizeInGB;
      newFiles.push({
        file,
        id: Date.now() + Math.random(),
        progress: 0,
        status: 'pending',
        category: file.type.startsWith('video/') ? 'video' : 'image',
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }, [availableStorage]);

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
    if (files.length === 0) return;

    if (availableStorage <= 0) {
      setSnackbar({
        open: true,
        message: 'Storage limit reached! Please purchase more storage.',
        severity: 'error',
      });
      return;
    }

    setUploading(true);
    let currentAvailable = availableStorage;
    const uploadPromises = files.map(async (fileItem) => {
      try {
        const fileSizeInGB = fileItem.file.size / (1024 * 1024 * 1024);
        if (fileSizeInGB > currentAvailable) {
          return { id: fileItem.id, success: false, error: 'File size exceeds available storage' };
        }

        const { uploadURL, s3Key, url } = await getUploadUrl(
          fileItem.file.name,
          fileItem.file.type,
          fileItem.file.size
        );

        setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 30 }));

        const putRes = await fetch(uploadURL, {
          method: 'PUT',
          body: fileItem.file,
          headers: { 'Content-Type': fileItem.file.type },
        });
        if (!putRes.ok) {
          throw new Error('Upload to storage failed');
        }

        setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 80 }));

        await saveMedia({
          name: fileItem.file.name,
          url,
          s3Key,
          category: fileItem.category,
          size: fileItem.file.size,
          mimeType: fileItem.file.type,
          folderId: selectedFolder || null,
        });

        currentAvailable -= fileSizeInGB;
        setUploadProgress((prev) => ({ ...prev, [fileItem.id]: 100 }));
        return { id: fileItem.id, success: true };
      } catch (error) {
        return { id: fileItem.id, success: false, error: error.response?.data?.message || error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    await loadStorage();
    setSnackbar({
      open: true,
      message: `${successCount} file(s) uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      severity: failCount > 0 ? 'warning' : 'success',
    });

    setUploading(false);
    setFiles([]);
    setUploadProgress({});
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
            Upload Media
          </Typography>

          {availableStorage <= 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Storage limit reached! Please purchase more storage to upload files.
            </Alert>
          )}

          {/* Folder Selection */}
          <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
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
                  {folders.map((folder) => (
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
              >
                Create Folder
              </Button>
            </Box>
          </Paper>

          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, sm: 4 },
              borderRadius: 3,
              mb: 3,
            }}
          >
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed',
                borderColor: isDragActive ? 'primary.main' : 'grey.300',
                borderRadius: 2,
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                cursor: availableStorage > 0 ? 'pointer' : 'not-allowed',
                bgcolor: isDragActive ? 'action.hover' : 'background.paper',
                opacity: availableStorage > 0 ? 1 : 0.6,
                transition: 'all 0.3s',
                '&:hover': availableStorage > 0 ? {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                } : {},
              }}
            >
              <input {...getInputProps()} disabled={availableStorage <= 0} />
              <CloudUploadIcon sx={{ fontSize: { xs: 48, sm: 64 }, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                or click to select files
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports: Video (MP4, AVI, MOV, MKV) and Images (JPG, PNG, GIF, WEBP)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Available Storage: {formatStorageGB(availableStorage)}
              </Typography>
            </Box>
          </Paper>

          {files.length > 0 && (
            <Grow in timeout={600}>
              <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Selected Files ({files.length})
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={uploading || availableStorage <= 0}
                    startIcon={<CloudUploadIcon />}
                  >
                    {uploading ? 'Uploading...' : 'Upload All'}
                  </Button>
                </Box>

                <List>
                  {files.map((fileItem, index) => (
                    <Grow in timeout={300 + index * 100} key={fileItem.id}>
                      <ListItem
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: 'background.paper',
                        }}
                      >
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
                              <Typography variant="caption" display="block">
                                {formatFileSize(fileItem.file.size)} • {fileItem.category.toUpperCase()}
                              </Typography>
                              {uploadProgress[fileItem.id] !== undefined && (
                                <Box sx={{ mt: 1 }}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={uploadProgress[fileItem.id]}
                                    sx={{ height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round(uploadProgress[fileItem.id])}%
                                    {uploadProgress[fileItem.id] === 100 && ' - Completed'}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(fileItem.id)}
                          disabled={uploading}
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItem>
                    </Grow>
                  ))}
                </List>
              </Paper>
            </Grow>
          )}

          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Upload Guidelines:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <li>Maximum file size: Limited by available storage</li>
              <li>Supported video formats: MP4, AVI, MOV, MKV</li>
              <li>Supported image formats: JPG, PNG, GIF, WEBP</li>
              <li>You can select multiple files at once</li>
            </Box>
          </Paper>
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialog.open}
        onClose={() => setCreateFolderDialog({ open: false, name: '' })}
        TransitionComponent={Fade}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Enter a name for the new folder to organize your media files.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={createFolderDialog.name}
            onChange={(e) => setCreateFolderDialog({ ...createFolderDialog, name: e.target.value })}
            placeholder="e.g., Vacation Photos, Work Videos"
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

export default MediaUpload;