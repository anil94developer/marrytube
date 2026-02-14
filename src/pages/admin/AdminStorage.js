import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Fade,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Search as SearchIcon, Storage as StorageIcon } from '@mui/icons-material';
import { getAllStorageUsage } from '../../services/adminService';
import { formatStorageGB, formatStorageWithUnits } from '../../utils/storageFormat';

const AdminStorage = () => {
  const [storageData, setStorageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalDesc'); // totalDesc | totalAsc | usedDesc | usedAsc

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    try {
      const storage = await getAllStorageUsage();

      const data = (storage || []).map((s) => {
        const user = s.user || {};
        return {
          userId: s.userId,
          userName: user.name || 'Unknown',
          email: user.email || 'N/A',
          totalStorage: Number(s.totalStorage) || 0,
          usedStorage: Number(s.usedStorage) || 0,
          availableStorage: Number(s.availableStorage) ?? Math.max(0, (Number(s.totalStorage) || 0) - (Number(s.usedStorage) || 0)),
        };
      });

      setStorageData(data);
    } catch (error) {
      console.error('Failed to load storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...storageData];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => (r.userName || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q));
    }
    if (sortBy === 'totalDesc') list.sort((a, b) => (b.totalStorage || 0) - (a.totalStorage || 0));
    else if (sortBy === 'totalAsc') list.sort((a, b) => (a.totalStorage || 0) - (b.totalStorage || 0));
    else if (sortBy === 'usedDesc') list.sort((a, b) => (b.usedStorage || 0) - (a.usedStorage || 0));
    else if (sortBy === 'usedAsc') list.sort((a, b) => (a.usedStorage || 0) - (b.usedStorage || 0));
    return list;
  }, [storageData, searchQuery, sortBy]);

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
              mb: 2,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
            }}
          >
            Storage Usage
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Customers sorted by largest storage first. Use search and sort to find who purchased large storage.
          </Typography>

          {!loading && storageData.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                placeholder="Search by name or email..."
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                sx={{ minWidth: 260 }}
              />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                  <MenuItem value="totalDesc">Total storage (largest first)</MenuItem>
                  <MenuItem value="totalAsc">Total storage (smallest first)</MenuItem>
                  <MenuItem value="usedDesc">Used (most used first)</MenuItem>
                  <MenuItem value="usedAsc">Used (least used first)</MenuItem>
                </Select>
              </FormControl>
              <Chip icon={<StorageIcon />} label={`${filteredAndSorted.length} customers`} size="small" />
            </Box>
          )}

          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : filteredAndSorted.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">No storage data found</Alert>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: { xs: '60vh', md: 'none' }, overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>#</strong></TableCell>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Total Storage</strong></TableCell>
                      <TableCell><strong>Used</strong></TableCell>
                      <TableCell><strong>Available</strong></TableCell>
                      <TableCell><strong>Usage %</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredAndSorted.map((row, index) => {
                      const usagePercent = row.totalStorage > 0 
                        ? (row.usedStorage / row.totalStorage) * 100 
                        : 0;
                      return (
                        <TableRow key={row.userId} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{row.userName}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{row.email}</TableCell>
                          <TableCell>{formatStorageGB(row.totalStorage)}</TableCell>
                          <TableCell>{formatStorageGB(row.usedStorage)}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {formatStorageWithUnits(row.totalStorage, row.usedStorage).availableFormatted}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                              <LinearProgress
                                variant="determinate"
                                value={usagePercent}
                                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                                color={usagePercent > 80 ? 'error' : usagePercent > 50 ? 'warning' : 'success'}
                              />
                              <Typography variant="body2" sx={{ minWidth: 40 }}>
                                {usagePercent.toFixed(1)}%
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminStorage;

