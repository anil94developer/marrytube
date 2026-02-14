import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Fade,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Storage as StorageIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { getAdminUserById, getAllMedia } from '../../services/adminService';
import { formatStorageGB, formatStorageWithUnits } from '../../utils/storageFormat';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userDetail, setUserDetail] = useState(null);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [detail, mediaRes] = await Promise.all([
          getAdminUserById(id),
          getAllMedia({ userId: id, page: 1, limit: 500 }),
        ]);
        if (cancelled) return;
        setUserDetail(detail);
        setMedia(mediaRes?.data ? mediaRes.data : []);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const filteredMedia = useMemo(() => {
    let list = [...media];
    if (categoryFilter === 'video') list = list.filter((m) => m.category === 'video');
    else if (categoryFilter === 'image') list = list.filter((m) => m.category === 'image');
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.name?.toLowerCase().includes(q));
    }
    const now = new Date();
    if (dateFilter === 'today') {
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt).toDateString() === now.toDateString());
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter((m) => new Date(m.uploadDate || m.createdAt) >= monthAgo);
    }
    list.sort((a, b) => {
      const da = new Date(a.uploadDate || a.createdAt || 0).getTime();
      const db = new Date(b.uploadDate || b.createdAt || 0).getTime();
      return sortOrder === 'desc' ? db - da : da - db;
    });
    return list;
  }, [media, categoryFilter, searchQuery, dateFilter, sortOrder]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }

  if (!userDetail) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="warning">Customer not found.</Alert>
        <IconButton onClick={() => navigate('/admin/users')} sx={{ mt: 1 }}><ArrowBackIcon /> Back</IconButton>
      </Container>
    );
  }

  const storage = userDetail.storage || {};
  const fmt = formatStorageWithUnits(Number(storage.totalStorage) || 0, Number(storage.usedStorage) || 0);

  return (
    <Container maxWidth="lg" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <IconButton onClick={() => navigate('/admin/users')}><ArrowBackIcon /></IconButton>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Customer Details</Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6">{userDetail.name || 'N/A'}</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    <TableRow><TableCell><EmailIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} /> Email</TableCell><TableCell>{userDetail.email || '—'}</TableCell></TableRow>
                    <TableRow><TableCell><PhoneIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} /> Mobile</TableCell><TableCell>{userDetail.mobile || '—'}</TableCell></TableRow>
                    <TableRow><TableCell>Joined</TableCell><TableCell>{userDetail.createdAt ? new Date(userDetail.createdAt).toLocaleDateString() : '—'}</TableCell></TableRow>
                  </TableBody>
                </Table>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <StorageIcon color="primary" />
                  <Typography variant="h6">Storage</Typography>
                </Box>
                <Typography variant="body2">Total: {fmt.totalFormatted}</Typography>
                <Typography variant="body2">Used: {fmt.usedFormatted}</Typography>
                <Typography variant="body2">Available: {fmt.availableFormatted}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Media</Typography>
                <Chip label={`${userDetail.videoCount || 0} Videos`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                <Chip label={`${userDetail.imageCount || 0} Images`} size="small" />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Total: {userDetail.mediaCount || 0} files</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search media..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ minWidth: 200 }}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Date</InputLabel>
                <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 days</MenuItem>
                  <MenuItem value="month">Last month</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Sort</InputLabel>
                <Select value={sortOrder} label="Sort" onChange={(e) => setSortOrder(e.target.value)}>
                  <MenuItem value="desc">Newest first</MenuItem>
                  <MenuItem value="asc">Oldest first</MenuItem>
                </Select>
              </FormControl>
              <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
                <ToggleButton value="list"><ViewListIcon /></ToggleButton>
                <ToggleButton value="grid"><ViewModuleIcon /></ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ p: 2 }}>
              {filteredMedia.length === 0 ? (
                <Alert severity="info">No media match filters.</Alert>
              ) : viewMode === 'list' ? (
                <List dense>
                  {filteredMedia.map((item) => (
                    <ListItem key={item.id}>
                      <ListItemIcon>
                        {item.category === 'video' ? <VideoLibraryIcon color="primary" /> : <ImageIcon color="secondary" />}
                      </ListItemIcon>
                      <ListItemText primary={item.name} secondary={`${(item.size / (1024 * 1024)).toFixed(2)} MB · ${new Date(item.uploadDate || item.createdAt).toLocaleString()}`} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Grid container spacing={2}>
                  {filteredMedia.map((item) => (
                    <Grid item xs={6} sm={4} md={3} key={item.id}>
                      <Card variant="outlined">
                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                          {item.category === 'video' ? <VideoLibraryIcon sx={{ fontSize: 48, color: 'primary.main' }} /> : <ImageIcon sx={{ fontSize: 48, color: 'secondary.main' }} />}
                          <Typography variant="body2" noWrap sx={{ mt: 1 }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{(item.size / (1024 * 1024)).toFixed(2)} MB</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminUserDetail;
