import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Fade,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CloudUpload as CloudUploadIcon,
  Storage as StorageIcon,
  VideoLibrary as VideoLibraryIcon,
  HelpOutline as HelpIcon,
  AccountCircle,
  Logout,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-icon.png';

const drawerWidth = 220;

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    // { text: 'Upload Media', icon: <CloudUploadIcon />, path: '/upload' },
    { text: 'My Media', icon: <VideoLibraryIcon />, path: '/media' },
    { text: 'Storage Plans', icon: <StorageIcon />, path: '/storage-plans' },
    { text: 'How to use', icon: <HelpIcon />, path: '/how-to-use' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff' }}>
      <Toolbar
        sx={{
          minHeight: 56,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          component="img"
          src={logo}
          alt="MarryTube"
          sx={{ height: 32, width: 'auto' }}
        />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: 700,
            fontFamily: '"Playfair Display", "Georgia", serif',
            color: 'primary.main',
            fontSize: '1.1rem',
          }}
        >
          MarryTube
        </Typography>
      </Toolbar>
      <List sx={{ px: 1.25, py: 1.5, flex: 1 }}>
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              onClick={() => {
                navigate(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              selected={isSelected}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1,
                pl: 1.5,
                borderLeft: '3px solid',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                bgcolor: isSelected ? 'rgba(196, 92, 92, 0.1)' : 'transparent',
                '&.Mui-selected': {
                  bgcolor: 'rgba(196, 92, 92, 0.12)',
                  color: 'primary.dark',
                  '&:hover': { bgcolor: 'rgba(196, 92, 92, 0.18)' },
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                },
                '&:hover': {
                  bgcolor: isSelected ? 'rgba(196, 92, 92, 0.18)' : 'rgba(0,0,0,0.04)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isSelected ? 'primary.main' : 'text.secondary',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: 'primary.main',
            color: 'white',
            fontSize: '0.9rem',
          }}
        >
          {user?.name?.charAt(0) || 'U'}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap fontSize="0.8rem">
            {user?.name || 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: '0.7rem' }}>
            {user?.email || user?.mobile || '—'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const warmBg = 'linear-gradient(165deg, #fdf8f6 0%, #f5ebe6 50%, #ede4df 100%)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#fdf8f6' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: '0 2px 12px rgba(196, 92, 92, 0.15)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={logo}
            alt="MarryTube Logo"
            sx={{
              height: { xs: 28, sm: 32 },
              width: 'auto',
              mr: 1,
            }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'MarryTube'}
          </Typography>
          <IconButton onClick={handleMenuClick} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light', color: 'primary.dark' }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            TransitionComponent={Fade}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: '2px 0 16px rgba(0,0,0,0.04)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 8 },
          background: warmBg,
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;