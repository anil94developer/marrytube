import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  CloudUpload as UploadIcon,
  VideoLibrary as MediaIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

const steps = [
  {
    label: 'Dashboard',
    description: 'View your storage usage, available space, and quick links to upload or browse media. Purchase more storage when you need it.',
    icon: <DashboardIcon />,
  },
  {
    label: 'Purchase storage',
    description: 'Go to "Storage Plans" from the menu. Choose monthly or yearly, select the amount of storage (GB), and complete the purchase. Your space is available immediately.',
    icon: <StorageIcon />,
  },
  {
    label: 'Upload media',
    description: 'Click "Upload Media" or the upload card on the dashboard. Select or drag-and-drop videos and images. You can organize files into folders. Uploads use your purchased storage.',
    icon: <UploadIcon />,
  },
  {
    label: 'My Media',
    description: 'Browse, search, and manage your uploaded files. Use list or grid view, filter by date or category (video/image). You can view or delete items. Deleted files free up storage.',
    icon: <MediaIcon />,
  },
];

const HowToUse = () => {
  return (
    <Container maxWidth="md" sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={500}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <InfoIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" fontWeight="bold">
              How to use the portal
            </Typography>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Welcome! Follow these steps to store and manage your photos and videos.
          </Typography>

          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, mb: 3 }}>
            <Stepper orientation="vertical">
              {steps.map((step, index) => (
                <Step key={step.label} active completed>
                  <StepLabel StepIconComponent={() => <Box sx={{ color: 'primary.main' }}>{step.icon}</Box>}>
                    <Typography fontWeight="bold">{step.label}</Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>

          <Card variant="outlined" sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quick tips
              </Typography>
              <List dense disablePadding>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Storage is in GB. Buy more from Storage Plans when you run out." />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Create folders in the Upload page to organize files." />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Deleting a file will ask for confirmation and frees up space." />
                </ListItem>
                <ListItem sx={{ py: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Use the Dashboard to see total files (videos and images) at a glance." />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Container>
  );
};

export default HowToUse;
