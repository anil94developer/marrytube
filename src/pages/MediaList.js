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
  Apps as AppsSmallIcon,
  ViewComfy as AppsMediumIcon,
  ViewComfyOutlined as AppsLargeIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getMediaList, deleteMedia, getFolders } from '../services/mediaService';

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
  const [gridSize, setGridSize] = useState('medium'); // 'small', 'medium', 'large'
  const [currentFolderId, setCurrentFolderId] = useState(null); // null for root, folderId for specific folder
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    loadMedia();
    loadFolders();
  }, [tabValue, currentFolderId]);

  const loadFolders = async () => {
    try {
      const folderList = await getFolders(user.id);
      setFolders(folderList);
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadMedia = async () => {
    setLoading(true);
    try {
      const category = tabValue === 0 ? 'video' : 'image';
      // currentFolderId is null for root, or folderId for specific folder
      const data = await getMediaList(user.id, category, currentFolderId);
      setMedia(data);
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderId) => {
    setCurrentFolderId(folderId);
  };

  const handleBackToRoot = () => {
    setCurrentFolderId(null);
  };

  const getCurrentFolder = () => {
    if (currentFolderId === null) return null;
    return folders.find(f => f.id === currentFolderId);
  };

  // Get folders to display (all folders at root, or empty when inside a folder)
  const getDisplayFolders = () => {
    if (currentFolderId !== null) return []; // Don't show folders when inside a folder
    return folders;
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

  const handleGridSizeChange = (event, newSize) => {
    if (newSize !== null) {
      setGridSize(newSize);
    }
  };

  // Get grid column sizes based on grid size setting
  const getGridColumns = () => {
    switch (gridSize) {
      case 'small':
        return { xs: 12, sm: 6, md: 4, lg: 3, xl: 2 }; // 6 items per row on large screens
      case 'medium':
        return { xs: 12, sm: 6, md: 4, lg: 3 }; // 4 items per row on large screens
      case 'large':
        return { xs: 12, sm: 6, md: 6, lg: 4 }; // 3 items per row on large screens
      default:
        return { xs: 12, sm: 6, md: 4, lg: 3 };
    }
  };

  // Get card media height based on grid size
  const getCardMediaHeight = () => {
    switch (gridSize) {
      case 'small':
        return 150;
      case 'medium':
        return 200;
      case 'large':
        return 280;
      default:
        return 200;
    }
  };

  // Get icon size based on grid size
  const getIconSize = () => {
    switch (gridSize) {
      case 'small':
        return 50;
      case 'medium':
        return 80;
      case 'large':
        return 120;
      default:
        return 80;
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

  // Folder Grid Item Component
  const FolderGridItem = ({ folder, index }) => {
    const gridColumns = getGridColumns();
    const cardHeight = getCardMediaHeight();
    const iconSize = getIconSize();

    return (
      <Grid item {...gridColumns} key={`folder-${folder.id}`}>
        <Grow in timeout={300 + index * 100}>
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
            onClick={() => handleFolderClick(folder.id)}
          >
            <CardMedia
              sx={{
                height: cardHeight,
                bgcolor: 'warning.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpenIcon sx={{ fontSize: iconSize, color: 'warning.main' }} />
            </CardMedia>
            <CardContent sx={{ flexGrow: 1, p: gridSize === 'small' ? 1.5 : 2 }}>
              <Typography
                variant={gridSize === 'large' ? 'h5' : gridSize === 'medium' ? 'h6' : 'subtitle1'}
                noWrap={gridSize === 'small'}
                sx={{
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: gridSize === 'small' ? '0.9rem' : gridSize === 'large' ? '1.25rem' : '1rem',
                }}
              >
                {folder.name}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: gridSize === 'small' ? '0.75rem' : '0.875rem' }}
              >
                Folder
              </Typography>
            </CardContent>
          </Card>
        </Grow>
      </Grid>
    );
  };

  // Grid View Component
  const GridView = () => {
    const gridColumns = getGridColumns();
    const cardHeight = getCardMediaHeight();
    const iconSize = getIconSize();
    const displayFolders = getDisplayFolders();

    return (
      <Grid container spacing={2} sx={{ p: 2 }}>
        {/* Render Folders */}
        {displayFolders.map((folder, index) => (
          <FolderGridItem folder={folder} index={index} key={folder.id} />
        ))}
        
        {/* Render Media Items */}
        {filteredMedia.map((item, index) => (
          <Grid item {...gridColumns} key={item.id}>
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
                    height: cardHeight,
                    bgcolor: item.category === 'video' ? 'primary.light' : 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {item.category === 'video' ? (
                    <VideoLibraryIcon sx={{ fontSize: iconSize, color: 'primary.main' }} />
                  ) : (
                    <ImageIcon sx={{ fontSize: iconSize, color: 'secondary.main' }} />
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
                <CardContent sx={{ flexGrow: 1, p: gridSize === 'small' ? 1.5 : 2 }}>
                  <Typography
                    variant={gridSize === 'large' ? 'h5' : gridSize === 'medium' ? 'h6' : 'subtitle1'}
                    noWrap={gridSize === 'small'}
                    sx={{
                      fontWeight: 'bold',
                      mb: 1,
                      fontSize: gridSize === 'small' ? '0.9rem' : gridSize === 'large' ? '1.25rem' : '1rem',
                    }}
                  >
                    {item.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={item.category.toUpperCase()}
                      size="small"
                      color={item.category === 'video' ? 'primary' : 'secondary'}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                    sx={{ fontSize: gridSize === 'small' ? '0.75rem' : '0.875rem' }}
                  >
                    Size: {formatFileSize(item.size)}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: gridSize === 'small' ? '0.75rem' : '0.875rem' }}
                  >
                    {formatDate(item.uploadDate)}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size={gridSize === 'small' ? 'small' : 'medium'}
                    variant="outlined"
                    startIcon={item.category === 'video' ? <PlayIcon /> : <ViewIcon />}
                    onClick={() => handleView(item.id)}
                  >
                    {item.category === 'video' ? 'Play' : 'View'}
                  </Button>
                  <IconButton
                    size={gridSize === 'small' ? 'small' : 'medium'}
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
  };

  return (
    <Container maxWidth="lg">
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              My Media
            </Typography>
            
            {/* Breadcrumb Navigation */}
            {currentFolderId !== null && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  startIcon={<HomeIcon />}
                  onClick={handleBackToRoot}
                  variant="outlined"
                  size="small"
                >
                  Root
                </Button>
                <Typography variant="body2" color="text.secondary">
                  /
                </Typography>
                <Button
                  startIcon={<FolderOpenIcon />}
                  variant="text"
                  size="small"
                  disabled
                >
                  {getCurrentFolder()?.name || 'Folder'}
                </Button>
              </Box>
            )}
          </Box>

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

              {viewMode === 'grid' && (
                <ToggleButtonGroup
                  value={gridSize}
                  exclusive
                  onChange={handleGridSizeChange}
                  size="small"
                  aria-label="grid size"
                  sx={{ ml: 1 }}
                >
                  <ToggleButton value="small" aria-label="small grid" title="Small Grid">
                    <AppsSmallIcon />
                  </ToggleButton>
                  <ToggleButton value="medium" aria-label="medium grid" title="Medium Grid">
                    <AppsMediumIcon />
                  </ToggleButton>
                  <ToggleButton value="large" aria-label="large grid" title="Large Grid">
                    <AppsLargeIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
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
            ) : filteredMedia.length === 0 && getDisplayFolders().length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">
                  {searchQuery || dateFilter !== 'all' 
                    ? 'No media found matching your search criteria.'
                    : currentFolderId 
                      ? 'This folder is empty.'
                      : 'No media found. Upload some media to get started!'}
                </Alert>
              </Box>
            ) : viewMode === 'grid' ? (
              <GridView />
            ) : (
              <List>
                {/* Render Folders in List View */}
                {getDisplayFolders().map((folder, index) => (
                  <Grow in timeout={300 + index * 100} key={`folder-${folder.id}`}>
                    <ListItem
                      button
                      onClick={() => handleFolderClick(folder.id)}
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        <FolderOpenIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {folder.name}
                            </Typography>
                            <Chip label="FOLDER" size="small" color="warning" />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            Click to open folder
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleFolderClick(folder.id)}>
                          <ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Grow>
                ))}
                
                {/* Render Media Items in List View */}
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
