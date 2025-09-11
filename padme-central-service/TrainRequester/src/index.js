import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
  StyledEngineProvider,
} from "@mui/material/styles";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";

import store from "./redux/store";
import UserService from "./services/UserService";
import { configureAxios } from "./services/AxiosService";

let theme = createTheme({
  palette: {
    background: {
      default: "#eceff1",
    },
    primary: {
      main: "#1C1B22",
    },
  },
  typography: {
    fontFamily: [
      "Manrope",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(","),
    button: {
      textTransform: "none",
    },
  },
});

theme = responsiveFontSizes(theme);
const container = document.getElementById("root");
const root = createRoot(container);

const renderApp = () =>
  root.render(
    <React.StrictMode>
      <Provider store={store}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <SnackbarProvider
              maxSnack={3}
              preventDuplicate
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              style={{ minWidth: 310 }}
            >
              <App />
            </SnackbarProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </Provider>
    </React.StrictMode>
  );

UserService.initKeycloak(renderApp);
configureAxios();
