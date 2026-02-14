import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  Fade,
  Grow,
  Alert,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { getAllMedia, deleteMediaAdmin, blockMedia } from '../../services/adminService';

const PAGE_SIZE = 50;

const AdminMedia = () => {
  const [media, setMedia] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mediaId: null });

  const loadMedia = useCallback(async (pageNum = 1, search = '', category = 'all') => {
    setLoading(true);
    try {
      const filters = { page: pageNum, limit: PAGE_SIZE };
      if (search.trim()) filters.search = search;
      if (category && category !== 'all') filters.category = category;
      const res = await getAllMedia(filters);
      setMedia(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(Math.min((res.page || 1) - 1, Math.max(0, (res.totalPages || 1) - 1)));
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia(1, searchQuery, categoryFilter);
  }, [searchQuery, categoryFilter, loadMedia]);

  const handlePageChange = (event, newPage) => {
    loadMedia(newPage + 1, searchQuery, categoryFilter);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleDelete = async () => {
    if (deleteDialog.mediaId) {
      try {
        await deleteMediaAdmin(deleteDialog.mediaId);
        loadMedia(page + 1, searchQuery, categoryFilter);
        setDeleteDialog({ open: false, mediaId: null });
      } catch (error) {
        console.error('Failed to delete:', error);
      }
    }
  };

  const handleBlock = async (mediaId) => {
    try {
      await blockMedia(mediaId);
      loadMedia(page + 1, searchQuery, categoryFilter);
    } catch (error) {
      console.error('Failed to block:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
      <Fade in timeout={600}>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3, md: 4 }, flexWrap: 'wrap', gap: 2 }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              All Media
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  placeholder="Search media..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: { xs: 160, sm: 200 } }}
                />
                <Button type="submit" variant="outlined" size="small">Search</Button>
              </Box>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                </Select>
              </FormControl>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="list">
                  <ViewListIcon />
                </ToggleButton>
                <ToggleButton value="grid">
                  <ViewModuleIcon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Paper elevation={4} sx={{ borderRadius: 3, p: 2 }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : media.length === 0 ? (
              <Alert severity="info">No media found</Alert>
            ) : viewMode === 'grid' ? (
              <>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {media.map((item, index) => (
                  <Grid item xs={6} sm={6} md={4} lg={3} key={item.id}>
                    <Grow in timeout={300 + index * 100}>
                      <Card>
                        <CardMedia
                          sx={{
                            height: 200,
                            bgcolor: item.category === 'video' ? 'primary.light' : 'secondary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.category === 'video' ? (
                            <PlayIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                          ) : (
                            <ViewIcon sx={{ fontSize: 60, color: 'secondary.main' }} />
                          )}
                        </CardMedia>
                        <CardContent>
                          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                            {item.name}
                          </Typography>
                          <Chip label={item.category} size="small" sx={{ mt: 1 }} />
                          {item.blocked && <Chip label="Blocked" color="error" size="small" sx={{ mt: 1, ml: 1 }} />}
                        </CardContent>
                        <CardActions>
                          <Button size="small">View</Button>
                          <IconButton size="small" color="error" onClick={() => handleBlock(item.id)}>
                            <BlockIcon />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, mediaId: item.id })}>
                            <DeleteIcon />
                          </IconButton>
                        </CardActions>
                      </Card>
                    </Grow>
                  </Grid>
                ))}
              </Grid>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
              />
              </>
            ) : (
              <>
              <Box>
                {media.map((item) => (
                  <Paper key={item.id} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        {item.name}
                      </Typography>
                      <Chip label={item.category} size="small" sx={{ mt: 1 }} />
                      {item.blocked && <Chip label="Blocked" color="error" size="small" sx={{ mt: 1, ml: 1 }} />}
                    </Box>
                    <Box>
                      <IconButton size="small" color="error" onClick={() => handleBlock(item.id)}>
                        <BlockIcon />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, mediaId: item.id })}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
              />
              </>
            )}
          </Paper>
        </Box>
      </Fade>

      <Dialog 
        open={deleteDialog.open} 
        onClose={() => setDeleteDialog({ open: false, mediaId: null })}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this media? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, mediaId: null })}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminMedia;

