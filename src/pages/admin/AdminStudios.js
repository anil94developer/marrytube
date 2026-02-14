import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  TablePagination,
} from '@mui/material';
import { Search as SearchIcon, Business as BusinessIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { getAllStudios, approveStudio, createStudio } from '../../services/adminService';

const PAGE_SIZE = 50;

const AdminStudios = () => {
  const navigate = useNavigate();
  const [studios, setStudios] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Add studio form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [adding, setAdding] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  const fetch = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await getAllStudios(pageNum, PAGE_SIZE, search);
      setStudios(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(Math.min((res.page || 1) - 1, Math.max(0, (res.totalPages || 1) - 1)));
    } catch (e) {
      setError('Failed to load studios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(1, searchQuery); }, [searchQuery, fetch]);

  const handlePageChange = (event, newPage) => {
    fetch(newPage + 1, searchQuery);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleApprove = async (studioId, current) => {
    const next = !current;
    try {
      const res = await approveStudio(studioId, next);
      if (res && res.success) {
        setStudios((s) => s.map(st => (st.id === studioId ? res.studio : st)));
      } else {
        setError('Failed to update studio status');
      }
    } catch (err) {
      setError('Failed to update studio status');
    }
  };

  const handleAdd = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAdding(true);
    setError('');
    try {
      const payload = { name, email, mobile, password, city, address, pincode };
      const res = await createStudio(payload);
      
      if (res && res.success) {
        fetch(1, searchQuery);
        // clear
        setName(''); setEmail(''); setMobile(''); setPassword(''); setCity(''); setAddress(''); setPincode('');
        setOpenAdd(false);
      } else {
        setError(res.message || 'Failed to create studio');
      }
    } catch (err) {
      setError('Failed to create studio');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Studios</Typography>
      <Paper sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">Create new studio</Typography>
        <Button variant="contained" onClick={() => setOpenAdd(true)}>Add Studio</Button>
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
          <DialogTitle>Add Studio</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}><TextField label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Email" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Mobile" fullWidth value={mobile} onChange={(e) => setMobile(e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Password" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="City" fullWidth value={city} onChange={(e) => setCity(e.target.value)} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Pincode" fullWidth value={pincode} onChange={(e) => setPincode(e.target.value)} /></Grid>
              <Grid item xs={12}><TextField label="Address" fullWidth multiline rows={3} value={address} onChange={(e) => setAddress(e.target.value)} /></Grid>
            </Grid>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} variant="contained" disabled={adding}>{adding ? <CircularProgress size={18} /> : 'Create'}</Button>
          </DialogActions>
        </Dialog>
      </Paper>

      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          placeholder="Search studios..."
          size="small"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 280 }}
        />
        <Button type="submit" variant="outlined">Search</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', p: 2 }}><CircularProgress /></Box>
        ) : (
          <>
          <Grid container spacing={2}>
            {studios.map((studio) => (
              <Grid item xs={12} sm={6} md={4} key={studio.id}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardActionArea onClick={() => navigate(`/admin/studios/${studio.id}`)} sx={{ p: 2, height: '100%', alignItems: 'flex-start' }}>
                    <CardContent sx={{ width: '100%', textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon color="primary" />
                        <Typography variant="subtitle1" fontWeight="bold">{studio.name || studio.email}</Typography>
                        <ViewIcon fontSize="small" color="action" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{studio.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{studio.mobile || '—'} {studio.city ? ` · ${studio.city}` : ''}</Typography>
                      <Chip size="small" label={studio.isActive ? 'Approved' : 'Pending'} color={studio.isActive ? 'success' : 'default'} sx={{ mt: 1 }} />
                    </CardContent>
                  </CardActionArea>
                  <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <FormControlLabel
                      control={<Switch checked={Boolean(studio.isActive)} onChange={() => handleApprove(studio.id, studio.isActive)} />}
                      label={studio.isActive ? 'Approved' : 'Pending'}
                    />
                    <Button size="small" variant="outlined" onClick={() => navigate(`/admin/studios/${studio.id}`)}>View details</Button>
                  </Box>
                </Card>
              </Grid>
            ))}
            {studios.length === 0 && (
              <Grid item xs={12}><Typography>No studios yet.</Typography></Grid>
            )}
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
        )}
      </Paper>
    </Box>
  );
};

export default AdminStudios;
