import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import Header from './Header';
import Sidebar from './Sidebar';
import SidebarHeader from './SidebarHeader';
import Breadcrumbs from './Breadcrumbs';

export default function AppLayout({ children }) {
  const [open, setOpen] = React.useState(false);

  function toggleSidebar() {
    setOpen(!open);
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Header open={open} onSidebarOpen={toggleSidebar} />
      <Sidebar open={open} onSidebarClose={toggleSidebar} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'hidden' }}>
        <SidebarHeader />
        <Breadcrumbs />
        {children}
      </Box>
    </Box>
  );
}
