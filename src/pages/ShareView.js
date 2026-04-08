import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Link,
} from '@mui/material';
import { Folder as FolderIcon, VideoLibrary as VideoIcon, Image as ImageIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { getShareByToken } from '../services/mediaService';
import { getMediaUrl } from '../config/api';

const ShareView = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await getShareByToken(token, currentFolderId);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Link not found or expired');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, currentFolderId]);

  /** Presigned B2 URLs are absolute; do not prefix with API base (would break signature). */
  const mediaUrl = (url) => {
    if (url == null || url === '') return '';
    const s = typeof url === 'string' ? url.trim() : '';
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return s;
    return getMediaUrl(s);
  };

  const handleFolderClick = (folder) => {
    setCurrentFolderId(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index) => {
    const item = breadcrumb[index];
    setCurrentFolderId(item.id);
    setBreadcrumb((prev) => prev.slice(0, index + 1));
  };

  const handleBackToRoot = () => {
    setCurrentFolderId(null);
    setBreadcrumb([]);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }
  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Not found'}</Alert>
      </Container>
    );
  }

  if (data.type === 'media') {
    const m = data.media;
    const isVideo = m.category === 'video';
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h5" gutterBottom>{m.name}</Typography>
        <Box sx={{ mt: 2 }}>
          {isVideo ? (
            <video controls src={mediaUrl(m.url)} style={{ maxWidth: '100%', borderRadius: 8 }} />
          ) : (
            <img src={mediaUrl(m.url)} alt={m.name} style={{ maxWidth: '100%', borderRadius: 8 }} />
          )}
        </Box>
      </Container>
    );
  }

  const { folder, subfolders, media } = data;
  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {breadcrumb.length > 0 ? (
          <>
            <Button size="small" startIcon={<BackIcon />} onClick={handleBackToRoot}>Root</Button>
            {breadcrumb.map((b, idx) => (
              <Typography key={b.id} component="span" variant="body2" color="text.secondary">
                / <Typography component="button" variant="body2" onClick={() => handleBreadcrumbClick(idx)} sx={{ cursor: 'pointer', border: 'none', background: 'none', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}>{b.name}</Typography>
              </Typography>
            ))}
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">Root</Typography>
        )}
      </Box>
      <Typography variant="h5" gutterBottom>📁 {folder.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>View-only shared folder</Typography>

      {subfolders && subfolders.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Folders</Typography>
          <List dense>
            {subfolders.map((f) => (
              <ListItem
                key={f.id}
                onClick={() => handleFolderClick(f)}
                sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemIcon><FolderIcon color="primary" /></ListItemIcon>
                <ListItemText primary={f.name} />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {media && media.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Files</Typography>
          <Grid container spacing={2}>
            {media.map((m) => {
              const isVideo = m.category === 'video';
              const url = mediaUrl(m.url);
              return (
                <Grid item xs={6} sm={4} md={3} key={m.id}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="none"
                      color="inherit"
                      sx={{ display: 'block', height: '100%' }}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 0, '&:hover': { bgcolor: 'action.hover' } }}>
                        <Box sx={{ width: '100%', height: 120, bgcolor: 'grey.200', overflow: 'hidden' }}>
                          {isVideo ? (
                            <Box component="video" src={url} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          ) : (
                            <Box component="img" src={url} alt={m.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                        </Box>
                        <Box sx={{ p: 2 }}>
                          <Typography variant="body2" noWrap>{m.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{(m.size / (1024 * 1024)).toFixed(2)} MB</Typography>
                          <Typography variant="caption" display="block" color="primary.main" sx={{ mt: 0.5 }}>Open file →</Typography>
                        </Box>
                      </CardContent>
                    </Link>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {(!subfolders || subfolders.length === 0) && (!media || media.length === 0) && (
        <Alert severity="info">This folder is empty.</Alert>
      )}
    </Container>
  );
};

export default ShareView;
