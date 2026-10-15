import { createContext, useContext, useState } from 'react';
import { NavLink, Outlet, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import ReviewsIcon from '@mui/icons-material/Reviews';
import PeopleIcon from '@mui/icons-material/People';
import InsightsIcon from '@mui/icons-material/Insights';
import { useAuth } from '../../context/AuthContext';

const AdminUiContext = createContext(null);
export function useAdminUi() {
  return useContext(AdminUiContext);
}

const links = [
  { to: '/admin', label: 'Dashboard', icon: <DashboardIcon />, end: true },
  { to: '/admin/products', label: 'Products', icon: <InventoryIcon /> },
  { to: '/admin/orders', label: 'Orders', icon: <ReceiptIcon /> },
  { to: '/admin/reviews', label: 'Reviews', icon: <ReviewsIcon /> },
  { to: '/admin/users', label: 'Users', icon: <PeopleIcon /> },
  { to: '/admin/sales', label: 'Sales', icon: <InsightsIcon /> },
];

export function AdminLayout() {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const { logout } = useAuth();

  const notify = (message, severity = 'success') => setSnack({ open: true, message, severity });

  const drawer = (
    <Box sx={{ width: 240 }}>
      <Toolbar />
      <Divider />
      <List>
        {links.map((link) => (
          <ListItemButton
            key={link.to}
            component={NavLink}
            to={link.to}
            end={link.end}
            onClick={() => setOpen(false)}
            sx={{
              color: '#f6f3ee',
              '&.active': { bgcolor: 'rgba(255,90,31,0.18)', color: '#ffb000' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>{link.icon}</ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <AdminUiContext.Provider value={{ notify }}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f3f4f6', color: '#12151a' }}>
        <AppBar position="fixed" sx={{ zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1, bgcolor: '#12151a' }}>
          <Toolbar>
            {mobile && (
              <IconButton color="inherit" edge="start" onClick={() => setOpen(true)} aria-label="Open menu">
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, letterSpacing: 1, fontFamily: '"Rajdhani", sans-serif' }}>
              MOTOTECH ADMIN
            </Typography>
            <Button color="inherit" component={RouterLink} to="/">View store</Button>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Toolbar>
        </AppBar>
        <Drawer
          variant={mobile ? 'temporary' : 'permanent'}
          open={mobile ? open : true}
          onClose={() => setOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: 240, bgcolor: '#1c212b', color: '#f6f3ee', boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: '64px', ml: { md: '240px' } }}>
          <Outlet />
        </Box>
        <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack((current) => ({ ...current, open: false }))}>
          <Alert severity={snack.severity} variant="filled" onClose={() => setSnack((current) => ({ ...current, open: false }))}>
            {snack.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminUiContext.Provider>
  );
}
