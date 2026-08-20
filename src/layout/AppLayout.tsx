import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PeopleIcon from '@mui/icons-material/People';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DRAWER_WIDTH_EXPANDED = 260;
const DRAWER_WIDTH_COLLAPSED = 72;

const links = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon },
  { to: '/restaurants', label: 'Restaurants', icon: StorefrontIcon },
  { to: '/users', label: 'Users', icon: PeopleIcon },
  { to: '/audit-logs', label: 'Audit logs', icon: FactCheckIcon },
];

export default function AppLayout() {
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  const activeLabel =
    links.find((l) => (l.to === '/' ? location.pathname === '/' : location.pathname.startsWith(l.to)))
      ?.label ?? 'Dashboard';

  const widthTransition = (t: any) =>
    t.transitions.create('width', {
      easing: t.transitions.easing.sharp,
      duration: t.transitions.duration.enteringScreen,
    });

  return (
    <Box sx={{ display: 'flex' }}>
      {/*
        The Drawer is taken out of normal flex flow (position: fixed) so that
        growing its Paper on hover overlays the main content instead of
        pushing it. `main` below always reserves exactly the COLLAPSED width
        and never changes, regardless of expanded state.
      */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: expanded ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
          zIndex: (t) => t.zIndex.drawer + 1,
          transition: widthTransition,
          '& .MuiDrawer-paper': {
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: expanded ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED,
            overflowX: 'hidden',
            boxSizing: 'border-box',
            transition: widthTransition,
            boxShadow: expanded ? 6 : 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: expanded ? 1.5 : 0,
            justifyContent: expanded ? 'flex-start' : 'center',
            p: 2,
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            DB
          </Box>
          {expanded && (
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                DailyBites
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Admin console
              </Typography>
            </Box>
          )}
        </Box>

        <Divider />

        <List component="nav" aria-label="Admin navigation" sx={{ flexGrow: 1 }}>
          {links.map(({ to, label, icon: Icon }) => {
            const button = (
              <ListItemButton
                key={to}
                component={NavLink}
                to={to}
                end={to === '/'}
                sx={{
                  justifyContent: expanded ? 'flex-start' : 'center',
                  '&.active': {
                    bgcolor: 'action.selected',
                    borderRight: 3,
                    borderColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: expanded ? 36 : 'auto', justifyContent: 'center' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {expanded && <ListItemText primary={label} sx={{ whiteSpace: 'nowrap' }} />}
              </ListItemButton>
            );
            return expanded ? (
              button
            ) : (
              <Tooltip title={label} placement="right" key={to}>
                {button}
              </Tooltip>
            );
          })}
        </List>

        <Divider />

        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {(() => {
            const themeLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';
            const themeButton = (
              <ListItemButton onClick={toggle} sx={{ justifyContent: expanded ? 'flex-start' : 'center' }}>
                <ListItemIcon sx={{ minWidth: expanded ? 36 : 'auto', justifyContent: 'center' }}>
                  {theme === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </ListItemIcon>
                {expanded && <ListItemText primary={themeLabel} sx={{ whiteSpace: 'nowrap' }} />}
              </ListItemButton>
            );
            return expanded ? themeButton : <Tooltip title={themeLabel} placement="right">{themeButton}</Tooltip>;
          })()}

          {(() => {
            const logoutButton = (
              <ListItemButton onClick={logout} sx={{ justifyContent: expanded ? 'flex-start' : 'center' }}>
                <ListItemIcon sx={{ minWidth: expanded ? 36 : 'auto', justifyContent: 'center' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                {expanded && <ListItemText primary="Logout" sx={{ whiteSpace: 'nowrap' }} />}
              </ListItemButton>
            );
            return expanded ? logoutButton : <Tooltip title="Logout" placement="right">{logoutButton}</Tooltip>;
          })()}
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minHeight: '100vh',
          ml: `${DRAWER_WIDTH_COLLAPSED}px`,
          bgcolor: 'background.default',
        }}
      >
        <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Operations
              </Typography>
              <Typography variant="h6" component="h1">
                {activeLabel}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}