import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Fade,
  Grow,
} from '@mui/material';
import {
  People as PeopleIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { Alert } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { getAdminStats, getAllStorageUsage, getStudioCount } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalImages: 0,
    totalStorage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Quick auth check: admin endpoints require an admin token
      try {
        await axios.get('/admin/users');
      } catch (authErr) {
        // If unauthorized, surface a helpful message and abort loading stats
        if (authErr.response && (authErr.response.status === 401 || authErr.response.status === 403)) {
          setError('Admin authentication required. Please login as admin or set a valid admin token in localStorage.');
          setLoading(false);
          return;
        }
        // non-auth error: log but continue
        console.error('Admin auth check error:', authErr);
      }
      const [statsRes, storage, studioCount] = await Promise.all([
        getAdminStats(),
        getAllStorageUsage(),
        getStudioCount(),
      ]);

      const totalStorageGB = Array.isArray(storage)
        ? storage.reduce((sum, s) => sum + (Number(s.totalStorage) || 0), 0)
        : Object.values(storage || {}).reduce((sum, s) => sum + (Number(s.totalStorage) || 0), 0);

      setStats({
        totalUsers: statsRes.totalUsers ?? 0,
        totalVideos: statsRes.totalVideos ?? 0,
        totalImages: statsRes.totalImages ?? 0,
        totalStorage: totalStorageGB,
        totalStudios: typeof studioCount === 'number' ? studioCount : (statsRes.totalStudios ?? 0),
      });
    } catch (error) {
  console.error('Failed to load stats:', error);
  setError('Failed to load dashboard data. Check server logs or network.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { category: 'Videos', count: stats.totalVideos },
    { category: 'Images', count: stats.totalImages },
  ];

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
            Admin Dashboard
          </Typography>

          {error && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning">{error}</Alert>
            </Box>
          )}

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={800}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {stats.totalUsers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Users
                        </Typography>
                      </Box>
                      <PeopleIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={1000}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                          {stats.totalVideos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Videos
                        </Typography>
                      </Box>
                      <VideoLibraryIcon sx={{ fontSize: 48, color: 'secondary.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={1200}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {stats.totalImages}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Images
                        </Typography>
                      </Box>
                      <ImageIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={1400}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          {/* {stats.totalStorage.toFixed(1)} */}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Storage (GB)
                        </Typography>
                      </Box>
                      <StorageIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            {/* Studios Card */}
            <Grid item xs={12} md={4}>
              <Grow in timeout={1400}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                          {stats.totalStudios || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Studios
                        </Typography>
                      </Box>
                      <PeopleIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} md={8}>
              <Grow in timeout={1600}>
                <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Media Distribution
                  </Typography>
                  <Box sx={{ width: '100%', overflow: 'auto' }}>
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: chartData.map(d => d.category) }]}
                      series={[{ data: chartData.map(d => d.count) }]}
                      width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 100 : 600)}
                      height={Math.min(300, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 200 : 300) : 300)}
                    />
                  </Box>
                </Paper>
              </Grow>
            </Grid>
          </Grid>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminDashboard;

