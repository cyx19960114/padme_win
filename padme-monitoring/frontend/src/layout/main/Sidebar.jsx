import { Link, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import TrainIcon from '@mui/icons-material/Train';
import StationIcon from '@mui/icons-material/Warehouse';
import JobsIcon from '@mui/icons-material/WorkHistory';

import { drawerWidth } from '../../constants';
import SidebarHeader from './SidebarHeader';

const navLinks = [
  {
    title: 'Dashboard',
    index: 0,
    to: '/dashboard',
    exact: true,
    icon: <DashboardIcon />,
  },
  {
    title: 'Trains',
    index: 1,
    to: '/trains',
    icon: <TrainIcon />,
  },
  {
    title: 'Stations',
    index: 2,
    to: '/stations',
    icon: <StationIcon />,
  },
  {
    title: 'Jobs',
    index: 3,
    to: '/jobs',
    icon: <JobsIcon />,
  },
];

export default function Sidebar({ open, onSidebarClose }) {
  const theme = useTheme();
  const { pathname } = useLocation();

  return (
    <Drawer variant="permanent" open={open}>
      <SidebarHeader>
        <IconButton onClick={onSidebarClose}>
          {theme.direction === 'rtl' ? (
            <ChevronRightIcon />
          ) : (
            <ChevronLeftIcon />
          )}
        </IconButton>
      </SidebarHeader>
      <Divider />
      <List
        sx={{
          paddingTop: '19px',
          a: { textDecoration: 'none', color: 'inherit' },
        }}
      >
        {navLinks.map(({ title, to, icon, exact }) => (
          <Link key={title} to={to}>
            <ListItem disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={exact ? pathname === to : pathname.includes(to)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {icon}
                </ListItemIcon>
                <ListItemText primary={title} sx={{ opacity: open ? 1 : 0 }} />
              </ListItemButton>
            </ListItem>
          </Link>
        ))}
      </List>
    </Drawer>
  );
}

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
      },
    },
    {
      props: ({ open }) => !open,
      style: {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
      },
    },
  ],
}));
