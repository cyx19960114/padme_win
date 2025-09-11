import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';

import AppLayout from './layout/main';
import theme from './theme';
import AppRoutes from './routes';

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </BrowserRouter>
        <Toaster />
        <ReactQueryDevtools
          buttonPosition="bottom-left"
          initialIsOpen={false}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
