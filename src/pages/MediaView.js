import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  IconButton,
  Fade,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { getMediaById } from '../services/mediaService';

const MediaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMedia();
  }, [id]);

  const loadMedia = async () => {
    try {
      const data = await getMediaById(id);
      if (data) {
        setMedia(data);
      } else {
        setError('Media not found');
      }
    } catch (err) {
      setError('Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleFullscreen = () => {
    const element = document.getElementById('media-viewer');
    if (element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.mozRequestFullscreen) {
        element.mozRequestFullscreen();
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !media) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          {error || 'Media not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => navigate('/media')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
              {media.name}
            </Typography>
            {media.category === 'video' && (
              <IconButton onClick={handleFullscreen} color="primary">
                <FullscreenIcon />
              </IconButton>
            )}
          </Box>

          <Paper
            elevation={4}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            {media.category === 'video' ? (
              <Box
                id="media-viewer"
                sx={{
                  width: '100%',
                  maxHeight: '80vh',
                  display: 'flex',
                  justifyContent: 'center',
                  bgcolor: 'black',
                }}
              >
                <video
                  controls
                  autoPlay
                  style={{
                    width: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                  }}
                  src={media.url}
                >
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : (
              <Box
                id="media-viewer"
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  minHeight: '400px',
                  alignItems: 'center',
                }}
              >
                <img
                  src={media.url}
                  alt={media.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '80vh',
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Category: <strong>{media.category.toUpperCase()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Size: <strong>{(media.size / (1024 * 1024)).toFixed(2)} MB</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Uploaded: <strong>{new Date(media.uploadDate).toLocaleString()}</strong>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default MediaView;
