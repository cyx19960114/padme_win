import './styles/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StyledEngineProvider } from '@mui/material';

import App from './App.jsx';
import KeycloakService from './service/keycloak.js';
import { configureAxios } from './service/axios.js';

const renderApp = () =>
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <StyledEngineProvider injectFirst>
        <App />
      </StyledEngineProvider>
    </StrictMode>
  );

KeycloakService.initialize(renderApp);
configureAxios();
