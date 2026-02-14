import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Fade,
  Alert,
  Button,
  TablePagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  Block as BlockIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { getAllUsers } from '../../services/adminService';

const PAGE_SIZE = 50;

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0); // 0-based for MUI TablePagination
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async (pageNum = 1, search = '') => {
    setLoading(true);
    try {
      const res = await getAllUsers(pageNum, PAGE_SIZE, search);
      setUsers(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPage(Math.min((res.page || 1) - 1, Math.max(0, (res.totalPages || 1) - 1)));
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(1, searchQuery);
  }, [searchQuery, loadUsers]);

  const handlePageChange = (event, newPage) => {
    const nextPage = newPage + 1;
    loadUsers(nextPage, searchQuery);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setSearchQuery(searchInput.trim());
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
              All Users
            </Typography>
            <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Search name, email, mobile..."
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
                sx={{ minWidth: { xs: '100%', sm: 280 } }}
              />
              <Button type="submit" variant="outlined">Search</Button>
            </Box>
          </Box>

          <Paper elevation={4} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {loading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography>Loading...</Typography>
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Alert severity="info">No users found</Alert>
              </Box>
            ) : (
              <>
              <TableContainer sx={{ maxHeight: { xs: '60vh', md: 'none' }, overflowX: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: { xs: 120, sm: 150 } }}><strong>Name</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 150, sm: 200 }, display: { xs: 'none', sm: 'table-cell' } }}><strong>Email</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 120, sm: 150 } }}><strong>Mobile</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}><strong>User Type</strong></TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/users/${user.id}`)}>
                        <TableCell>{user.name || 'N/A'}</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{user.email || 'N/A'}</TableCell>
                        <TableCell>{user.mobile || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.userType || 'customer'}
                            size="small"
                            color={user.userType === 'admin' ? 'error' : user.userType === 'studio' ? 'warning' : 'primary'}
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Button size="small" startIcon={<ViewIcon />} onClick={() => navigate(`/admin/users/${user.id}`)}>View</Button>
                          <IconButton size="small" color="error" sx={{ p: { xs: 0.5, sm: 1 } }}>
                            <BlockIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" sx={{ p: { xs: 0.5, sm: 1 } }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[PAGE_SIZE]}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                backIconButtonProps={{ 'aria-label': 'Previous 50' }}
                nextIconButtonProps={{ 'aria-label': 'Next 50' }}
              />
              </>
            )}
          </Paper>
        </Box>
      </Fade>
    </Container>
  );
};

export default AdminUsers;

