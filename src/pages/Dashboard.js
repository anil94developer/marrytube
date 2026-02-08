import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  LinearProgress,
  Fade,
  Grow,
  Alert,
} from '@mui/material';
import {
  Storage as StorageIcon,
  CloudUpload as CloudUploadIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../contexts/AuthContext';
import { getUserStorage } from '../services/storageService';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storage, setStorage] = useState({
    totalStorage: 1,
    usedStorage: 0,
    availableStorage: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    try {
      const data = await getUserStorage(user.id);
      setStorage(data);
    } catch (error) {
      console.error('Failed to load storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const usedPercentage = storage.totalStorage > 0 
    ? (storage.usedStorage / storage.totalStorage) * 100 
    : 0;

  const pieData = [
    {
      id: 0,
      value: storage.usedStorage,
      label: 'Used',
      color: '#1976d2',
    },
    {
      id: 1,
      value: storage.availableStorage,
      label: 'Available',
      color: '#4caf50',
    },
  ];

  const canUpload = storage.availableStorage > 0;

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            Dashboard
          </Typography>

          {!canUpload && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Storage limit reached! Please purchase more storage to upload files.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Grow in timeout={800}>
                <Paper
                  elevation={4}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    height: '100%',
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                  }}
                >
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Storage Usage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 3 }}>
                    <PieChart
                      series={[
                        {
                          data: pieData,
                          innerRadius: 60,
                          outerRadius: 100,
                          paddingAngle: 2,
                        },
                      ]}
                      width={300}
                      height={250}
                      sx={{
                        '& .MuiChartsLegend-root': {
                          fill: 'white',
                        },
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                      <Typography variant="body2">Used: {storage.usedStorage.toFixed(2)} GB</Typography>
                      <Typography variant="body2">Available: {storage.availableStorage.toFixed(2)} GB</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={usedPercentage}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: 'white',
                        },
                      }}
                    />
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                      Total: {storage.totalStorage} GB
                    </Typography>
                  </Box>
                </Paper>
              </Grow>
            </Grid>

            <Grid item xs={12} md={4}>
              <Grow in timeout={1000}>
                <Paper
                  elevation={4}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    height: '100%',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <StorageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Remaining Storage
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main', my: 2 }}>
                      {storage.availableStorage.toFixed(2)} GB
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Available for upload
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => navigate('/storage-plans')}
                    sx={{ mt: 3 }}
                  >
                    Purchase More Storage
                  </Button>
                </Paper>
              </Grow>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Grow in timeout={1200}>
                <Paper
                  elevation={4}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    cursor: canUpload ? 'pointer' : 'not-allowed',
                    opacity: canUpload ? 1 : 0.6,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': canUpload ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    } : {},
                  }}
                  onClick={() => canUpload && navigate('/upload')}
                >
                  <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Upload Media
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload videos and images to your storage
                  </Typography>
                </Paper>
              </Grow>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Grow in timeout={1400}>
                <Paper
                  elevation={4}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 2,
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => navigate('/media')}
                >
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    View Media
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Browse and manage your uploaded files
                  </Typography>
                </Paper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default Dashboard;