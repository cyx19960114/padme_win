import React from "react";
import "./styles/index.css";
import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider,
  responsiveFontSizes,
} from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { Provider } from "react-redux";
import store from "./redux/store";
import App from "./App";
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

const notistackRef = React.createRef();
const root = ReactDOM.createRoot(document.getElementById("root"));

const renderApp = () => {
  console.log("🎨 Rendering React app...");
  root.render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          ref={notistackRef}
          preventDuplicate
          maxSnack={3}
          style={{ fontWeight: 500 }}
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
        >
          <App />
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  );
};

const initApp = async () => {
  try {
    console.log("🚀 Starting application initialization...");
    
    // 先配置axios
    configureAxios();
    console.log("✅ Axios configured");
    
    // 初始化Keycloak
    await UserService.initKeycloak(renderApp);
    console.log("✅ Keycloak initialization completed");
    
  } catch (error) {
    console.error("❌ App initialization failed:", error);
    // 即使Keycloak失败也要渲染应用
    renderApp();
  }
};

// 启动应用
initApp();
