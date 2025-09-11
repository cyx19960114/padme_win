import React from "react";
import "./styles/index.css";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { SnackbarProvider } from "notistack";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
  StyledEngineProvider,
} from "@mui/material/styles";
import App from "./App";
import store from "./redux/store";

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
root.render(
  <Provider store={store}>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
        >
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </Provider>
);
