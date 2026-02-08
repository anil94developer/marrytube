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
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  VideoFile as VideoFileIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { uploadToS3 } from '../services/s3Service';
import { saveMedia } from '../services/mediaService';
import { getUserStorage, updateStorageUsage } from '../services/storageService';

const MediaUpload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableStorage, setAvailableStorage] = useState(0);

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    const storage = await getUserStorage(user.id);
    setAvailableStorage(storage.availableStorage);
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
          message: `Cannot add more files. Available storage: ${availableStorage.toFixed(2)} GB`,
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
    const uploadPromises = files.map(async (fileItem) => {
      try {
        const fileSizeInGB = fileItem.file.size / (1024 * 1024 * 1024);
        
        if (fileSizeInGB > availableStorage) {
          return { id: fileItem.id, success: false, error: 'File size exceeds available storage' };
        }

        const result = await uploadToS3(fileItem.file, (progress) => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileItem.id]: progress,
          }));
        });

        await saveMedia({
          userId: user.id,
          name: fileItem.file.name,
          size: fileItem.file.size,
          category: fileItem.category,
          type: fileItem.file.type,
          url: result.url,
          key: result.key,
        });

        await updateStorageUsage(user.id, fileSizeInGB);
        await loadStorage();

        return { id: fileItem.id, success: true };
      } catch (error) {
        return { id: fileItem.id, success: false, error: error.message };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

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
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Upload Media
          </Typography>

          {availableStorage <= 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              Storage limit reached! Please purchase more storage to upload files.
            </Alert>
          )}

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
                Available Storage: {availableStorage.toFixed(2)} GB
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
    </Container>
  );
};

export default MediaUpload;