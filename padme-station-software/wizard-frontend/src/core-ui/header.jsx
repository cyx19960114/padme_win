import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import Logo from "../assets/logo-only.png";

export default function Header() {
  return (
    <Box sx={{ mb: 5 }}>
      <AppBar elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          <img
            src={Logo}
            style={{ maxWidth: "60px" }}
            alt="PHT STATION SOFTWARE"
          />
          <Typography variant="h6" ml={2} fontWeight="bold">
            PHT STATION SOFTWARE
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>
      <Toolbar />
    </Box>
  );
}
