import { useLocation, Link as RouterLink } from 'react-router-dom';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (location.pathname === '/dashboard') return null;

  return (
    <MuiBreadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      sx={{ mb: 2 }}
    >
      <Link
        sx={{ textTransform: 'capitalize' }}
        component={RouterLink}
        underline="hover"
        color="inherit"
        to="/dashboard"
      >
        Dashboard
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        return last ? (
          <Typography color="text.primary" key={to}>
            {value}
          </Typography>
        ) : (
          <Link
            component={RouterLink}
            sx={{ textTransform: 'capitalize' }}
            underline="hover"
            color="inherit"
            to={to}
            key={to}
          >
            {value}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
