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
  AccountBalanceWallet as WalletIcon,
  TrendingUp as EarningsIcon,
} from '@mui/icons-material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../../contexts/AuthContext';
import { getStudioDashboard } from '../../services/studioService';

const StudioDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    videoCount: 0,
    imageCount: 0,
    totalClients: 0,
    totalMedia: 0,
    earnings: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await getStudioDashboard(user.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const mediaChartData = [
    { category: 'Videos', count: stats.videoCount },
    { category: 'Images', count: stats.imageCount },
  ];

  const pieData = [
    { id: 0, value: Math.max(0, parseFloat(stats.videoCount) || 0), label: 'Videos', color: '#1976d2' },
    { id: 1, value: Math.max(0, parseFloat(stats.imageCount) || 0), label: 'Images', color: '#dc004e' },
  ]
    .map(item => {
      const numValue = isNaN(item.value) ? 0 : parseFloat(item.value);
      return {
        ...item,
        value: typeof numValue === 'number' && !isNaN(numValue) ? numValue : 0,
      };
    })
    .filter(item => item.value > 0 || (stats.videoCount === 0 && stats.imageCount === 0));

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
            Studio Dashboard
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={800}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {stats.totalClients}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Clients
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
                          {stats.videoCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Client Videos
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
                          {stats.imageCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Client Images
                        </Typography>
                      </Box>
                      <ImageIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            {/* <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={1400}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          ₹{stats.earnings.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Earnings
                        </Typography>
                      </Box>
                      <EarningsIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid> */}

            <Grid item xs={12} sm={6} md={3}>
              <Grow in timeout={1600}>
                <Card elevation={4} sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                          ₹{stats.walletBalance.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Wallet Balance
                        </Typography>
                      </Box>
                      <WalletIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Grid>

            <Grid item xs={12} md={6}>
              <Grow in timeout={1800}>
                <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Media Distribution
                  </Typography>
                  <Box sx={{ width: '100%', overflow: 'auto' }}>
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: mediaChartData.map(d => d.category) }]}
                      series={[{ data: mediaChartData.map(d => d.count) }]}
                      width={Math.min(500, typeof window !== 'undefined' ? window.innerWidth - 100 : 500)}
                      height={Math.min(300, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 200 : 300) : 300)}
                    />
                  </Box>
                </Paper>
              </Grow>
            </Grid>

            <Grid item xs={12} md={6}>
              <Grow in timeout={2000}>
                <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Media Overview
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    {pieData.length > 0 && pieData.every(item => typeof item.value === 'number' && !isNaN(item.value)) ? (
                      <PieChart
                        series={[
                          {
                            data: pieData.map(item => {
                              const numValue = parseFloat(item.value) || 0;
                              return {
                                id: item.id,
                                value: isNaN(numValue) ? 0 : Math.round(numValue), // Round to integer
                                label: item.label,
                                color: item.color,
                              };
                            }),
                            innerRadius: 50,
                            outerRadius: 85,
                            valueFormatter: (value, context) => {
                              const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                              return `${numValue}`;
                            },
                          },
                        ]}
                        width={Math.min(300, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 250 : 300) : 300)}
                        height={Math.min(250, typeof window !== 'undefined' ? (window.innerWidth < 600 ? 200 : 250) : 250)}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No media data
                      </Typography>
                    )}
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

export default StudioDashboard;

