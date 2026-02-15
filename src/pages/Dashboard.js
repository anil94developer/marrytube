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
import { getDashboard } from '../services/storageService';
import { formatStorageWithUnits, formatStorageGB } from '../utils/storageFormat';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storage, setStorage] = useState({
    totalStorage: 1,
    usedStorage: 0,
    availableStorage: 1,
  });
  const [videoCount, setVideoCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      if (data.storage) {
        setStorage(data.storage);
      }
      setVideoCount(data.videoCount ?? 0);
      setImageCount(data.imageCount ?? 0);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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
      value: Math.max(0, parseFloat(storage.usedStorage) || 0),
      label: 'Used',
      color: '#c45c5c',
    },
    {
      id: 1,
      value: Math.max(0, parseFloat(storage.availableStorage) || 0),
      label: 'Available',
      color: '#7a9e7e',
    },
  ]
    .map(item => {
      const numValue = isNaN(item.value) ? 0 : parseFloat(item.value);
      return {
        ...item,
        value: typeof numValue === 'number' && !isNaN(numValue) ? numValue : 0,
      };
    })
    .filter(item => item.value > 0 || storage.totalStorage === 0); // Show at least one item if total is 0

  const canUpload = storage.availableStorage > 0;

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
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.06)',
                    background: 'linear-gradient(145deg, #c45c5c 0%, #a84d4d 100%)',
                    color: 'white',
                    boxShadow: '0 8px 32px rgba(196, 92, 92, 0.25)',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 'bold',
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    Storage Usage
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: { xs: 2, sm: 3 } }}>
                    <Box sx={{ width: { xs: '100%', sm: 300 }, maxWidth: 300, height: { xs: 200, sm: 250 } }}>
                      {pieData.length > 0 && pieData.every(item => typeof item.value === 'number' && !isNaN(item.value)) ? (
                        <PieChart
                          series={[
                            {
                              data: pieData.map(item => {
                                const numValue = parseFloat(item.value) || 0;
                                return {
                                  id: item.id,
                                  value: isNaN(numValue) ? 0 : Math.round(numValue * 100) / 100, // Round to 2 decimal places
                                  label: item.label,
                                  color: item.color,
                                };
                              }),
                              innerRadius: 50,
                              outerRadius: 85,
                              paddingAngle: 2,
                              valueFormatter: (value, context) => {
                                const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                                return `${numValue} GB`;
                              },
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
                      ) : (
                        <Box sx={{ textAlign: 'center', color: 'white' }}>
                          <Typography>No storage data</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    {(() => {
                      const fmt = formatStorageWithUnits(storage.totalStorage, storage.usedStorage);
                      return (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="body2">Used: {fmt.usedFormatted}</Typography>
                            <Typography variant="body2">Available: {fmt.availableFormatted}</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, usedPercentage)}
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
                            Total: {fmt.totalFormatted}
                          </Typography>
                        </>
                      );
                    })()}
                  </Box>
                </Paper>
              </Grow>
            </Grid>

            <Grid item xs={12} md={4}>
              <Grow in timeout={1000}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    height: '100%',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                  }}
                >
                  <Box>
                    <StorageIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                      Remaining Storage
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: storage.availableStorage < 0 ? 'error.main' : 'primary.main', 
                        my: 2,
                        fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' }
                      }}
                    >
                      {formatStorageWithUnits(storage.totalStorage, storage.usedStorage).availableFormatted}
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

            {/* <Grid item xs={12} sm={6}>
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
            </Grid> */}

            <Grid item xs={12} sm={6}>
              <Grow in timeout={1400}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    cursor: 'pointer',
                    bgcolor: 'rgba(255,255,255,0.9)',
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(196, 92, 92, 0.15)',
                    },
                  }}
                  onClick={() => navigate('/media')}
                >
                  <TrendingUpIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    View Media
                  </Typography>
                  <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', my: 1 }}>
                    {videoCount + imageCount} files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {videoCount} videos, {imageCount} images · Browse and manage
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