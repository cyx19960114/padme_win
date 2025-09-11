import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';

// Credit: https://github.com/devias-io/material-kit-react/blob/main/src/app/errors/not-found/page.tsx
export default function PageNotFound() {
  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100dvh - 250px)',
      }}
    >
      <Stack spacing={3} sx={{ alignItems: 'center', maxWidth: 'md' }}>
        <Box className="flex justify-center">
          <Box
            component="img"
            alt="Not found"
            src="/error-404.png"
            sx={{
              display: 'inline-block',
              height: 'auto',
              width: '50%',
            }}
          />
        </Box>
        <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 600 }}>
          404: The page you are looking for isn&apos;t here
        </Typography>
        <Typography
          color="text.secondary"
          variant="body1"
          sx={{ textAlign: 'center' }}
        >
          You either tried some shady route or you came here by mistake.
          Whichever it is, try using the navigation
        </Typography>
        <Button
          component={RouterLink}
          to="/dashboard"
          startIcon={<ArrowLeftIcon />}
          variant="contained"
        >
          Back to Dashboard
        </Button>
      </Stack>
    </Box>
  );
}
