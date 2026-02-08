import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fade,
  Grow,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
} from '@mui/material';
import {
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getMediaList, deleteMedia } from '../services/mediaService';

const MediaList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mediaId: null, mediaName: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month', 'year'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  useEffect(() => {
    loadMedia();
  }, [tabValue]);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const category = tabValue === 0 ? 'video' : 'image';
      const data = await getMediaList(user.id, category);
      setMedia(data);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (mediaId, mediaName) => {
    setDeleteDialog({ open: true, mediaId, mediaName });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.mediaId) {
      try {
        await deleteMedia(deleteDialog.mediaId);
        loadMedia();
        setDeleteDialog({ open: false, mediaId: null, mediaName: '' });
      } catch (error) {
        console.error('Failed to delete media:', error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, mediaId: null, mediaName: '' });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleView = (mediaId) => {
    navigate(`/media/${mediaId}`);
  };

  const handleViewModeChange = (event, newViewMode) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  // Filter media based on search query and date filter
  const filteredMedia = useMemo(() => {
    let filtered = [...media];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }

      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.uploadDate);
        return itemDate >= filterDate;
      });
    }

    return filtered;
  }, [media, searchQuery, dateFilter]);

  // Grid View Component
  const GridView = () => (
    <Grid container spacing={2} sx={{ p: 2 }}>
      {filteredMedia.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <Grow in timeout={300 + index * 100}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardMedia
                sx={{
                  height: 200,
                  bgcolor: item.category === 'video' ? 'primary.light' : 'secondary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {item.category === 'video' ? (
                  <VideoLibraryIcon sx={{ fontSize: 80, color: 'primary.main' }} />
                ) : (
                  <ImageIcon sx={{ fontSize: 80, color: 'secondary.main' }} />
                )}
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.8)',
                    },
                  }}
                  onClick={() => handleView(item.id)}
                >
                  {item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                </IconButton>
              </CardMedia>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', mb: 1 }}>
                  {item.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.category.toUpperCase()}
                    size="small"
                    color={item.category === 'video' ? 'primary' : 'secondary'}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Size: {formatFileSize(item.size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(item.uploadDate)}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                  onClick={() => handleView(item.id)}
                >
                  {item.category === 'video' ? 'Play' : 'View'}
                </Button>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteClick(item.id, item.name)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grow>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
            My Media
          </Typography>

          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                icon={<VideoLibraryIcon />}
                iconPosition="start"
                label="Videos"
                sx={{ textTransform: 'none', fontSize: '1rem' }}
              />
              <Tab
                icon={<ImageIcon />}
                iconPosition="start"
                label="Images"
                sx={{ textTransform: 'none', fontSize: '1rem' }}
              />
            </Tabs>

            {/* Search, Filter, and View Controls */}
            <Toolbar
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                flexWrap: 'wrap',
                gap: 2,
                py: 2,
              }}
            >
              <TextField
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, minWidth: 200 }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Date Filter</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Filter"
                  onChange={(e) => setDateFilter(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <CalendarIcon sx={{ ml: 1, color: 'text.secondary' }} />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                size="small"
                aria-label="view mode"
              >
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="grid view">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Toolbar>

            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : media.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">
                  No {tabValue === 0 ? 'videos' : 'images'} found. Upload some media to get started!
                </Alert>
              </Box>
            ) : filteredMedia.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">
                  No media found matching your search criteria.
                </Alert>
              </Box>
            ) : viewMode === 'grid' ? (
              <GridView />
            ) : (
              <List>
                {filteredMedia.map((item, index) => (
                  <Grow in timeout={300 + index * 100} key={item.id}>
                    <ListItem
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {item.category === 'video' ? (
                          <VideoLibraryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                        ) : (
                          <ImageIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {item.name}
                            </Typography>
                            <Chip
                              label={item.category.toUpperCase()}
                              size="small"
                              color={item.category === 'video' ? 'primary' : 'secondary'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Size: {formatFileSize(item.size)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded: {formatDate(item.uploadDate)}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            edge="end"
                            onClick={() => handleView(item.id)}
                            color="primary"
                            aria-label={item.category === 'video' ? 'play' : 'view'}
                          >
                            {item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDeleteClick(item.id, item.name)}
                            color="error"
                            aria-label="delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Grow>
                ))}
              </List>
            )}
          </Paper>
        </Box>
      </Fade>

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        TransitionComponent={Fade}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{deleteDialog.mediaName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MediaList;
