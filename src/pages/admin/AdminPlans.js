import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fade,
  Grow,
  Alert,
  Snackbar,
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { getPlans, updateStoragePlan } from '../../services/adminService';

const AdminPlans = () => {
  const [plans, setPlans] = useState([]);
  const [editDialog, setEditDialog] = useState({ open: false, plan: null });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ storage: '', price: '', period: 'month', category: 'fixed' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    (async () => {
      const data = await getPlans();
      setPlans(Array.isArray(data) ? data : []);
    })();
  };

  const handleEdit = (plan) => {
    setEditDialog({ open: true, plan: { ...plan } });
  };

  const handleSave = async () => {
    try {
      await updateStoragePlan(editDialog.plan);
      loadPlans();
      setEditDialog({ open: false, plan: null });
      setSnackbar({ open: true, message: 'Plan updated successfully' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update plan' });
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
              Storage Plans Management
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
              Add New Plan
            </Button>
          </Box>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {plans.map((plan, index) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Grow in timeout={800 + index * 200}>
                  <Card elevation={4} sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        {plan.storage} GB
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2, fontSize: { xs: '1.75rem', sm: '2.5rem' } }}>
                        ₹{plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.periodLabel}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(plan)}
                      >
                        Edit Plan
                      </Button>
                    </CardActions>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Fade>

      <Dialog 
        open={editDialog.open} 
        onClose={() => setEditDialog({ open: false, plan: null })} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
          },
        }}
      >
        <DialogTitle>Edit Storage Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Storage (GB)"
              type="number"
              value={editDialog.plan?.storage || ''}
              onChange={(e) => setEditDialog({ ...editDialog, plan: { ...editDialog.plan, storage: parseFloat(e.target.value) } })}
              fullWidth
            />
            <TextField
              label="Price (₹)"
              type="number"
              value={editDialog.plan?.price || ''}
              onChange={(e) => setEditDialog({ ...editDialog, plan: { ...editDialog.plan, price: parseFloat(e.target.value) } })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="edit-period-label">Period</InputLabel>
              <Select
                labelId="edit-period-label"
                value={editDialog.plan?.period || 'month'}
                label="Period"
                onChange={(e) => setEditDialog({ ...editDialog, plan: { ...editDialog.plan, period: e.target.value } })}
              >
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="edit-category-label">Category</InputLabel>
              <Select
                labelId="edit-category-label"
                value={editDialog.plan?.category || 'fixed'}
                label="Category"
                onChange={(e) => setEditDialog({ ...editDialog, plan: { ...editDialog.plan, category: e.target.value } })}
              >
                <MenuItem value="fixed">Fixed</MenuItem>
                <MenuItem value="per_gb">Per GB</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, plan: null })}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Storage Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Storage (GB)" type="number" value={newPlan.storage} onChange={(e) => setNewPlan({ ...newPlan, storage: e.target.value })} fullWidth />
            <TextField label="Price (₹)" type="number" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel id="new-period-label">Period</InputLabel>
              <Select labelId="new-period-label" value={newPlan.period} label="Period" onChange={(e) => setNewPlan({ ...newPlan, period: e.target.value })}>
                <MenuItem value="month">Monthly</MenuItem>
                <MenuItem value="year">Yearly</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="new-category-label">Category</InputLabel>
              <Select labelId="new-category-label" value={newPlan.category} label="Category" onChange={(e) => setNewPlan({ ...newPlan, category: e.target.value })}>
                <MenuItem value="fixed">Fixed</MenuItem>
                <MenuItem value="per_gb">Per GB</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={async () => {
            try {
              await updateStoragePlan({ storage: parseFloat(newPlan.storage), price: parseFloat(newPlan.price), period: newPlan.period, category: newPlan.category });
              setAddDialogOpen(false);
              loadPlans();
              setSnackbar({ open: true, message: 'Plan created' });
            } catch (err) {
              setSnackbar({ open: true, message: 'Failed to create plan' });
            }
          }} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="success">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPlans;

