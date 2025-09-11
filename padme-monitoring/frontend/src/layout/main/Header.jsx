import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import AccountIcon from "@mui/icons-material/AccountCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import Logout from "@mui/icons-material/Logout";

// import Logo from "../assets/react.svg";
import Logo from "../../assets/logo-only.png";
import { drawerWidth } from "../../constants";
import { LightTooltip } from "../../components/tooltip";
import KeycloakService from "../../service/keycloak";

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  variants: [
    {
      props: ({ open }) => open,
      style: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      },
    },
  ],
}));

export default function Header({ open, onSidebarOpen }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const username = KeycloakService.getUsername();

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const menuId = "account-menu";
  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      id={menuId}
      keepMounted
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      open={isMenuOpen}
      onClose={handleProfileMenuClose}
    >
      <MenuItem onClick={() => KeycloakService.doLogout()}>
        <ListItemIcon>
          <Logout color="error" fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <AppBar elevation={0} position="fixed" open={open}>
      <Toolbar sx={{ py: 1 }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onSidebarOpen}
          edge="start"
          sx={[
            {
              marginRight: 2,
            },
            open && { display: "none" },
          ]}
        >
          <MenuIcon />
        </IconButton>
        <img src={Logo} style={{ maxWidth: "60px" }} alt="PADME Monitoring" />
        <Typography variant="h6" ml={2} fontWeight="bold">
          PHT Monitoring
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          <LightTooltip title="Refresh">
            <IconButton size="large" color="inherit">
              <RefreshIcon />
            </IconButton>
          </LightTooltip>

          <Button
            aria-label="user account"
            aria-controls={menuId}
            aria-haspopup="true"
            size="large"
            startIcon={<AccountIcon />}
            onClick={handleProfileMenuOpen}
            sx={{ color: "white" }}
          >
            {username}
          </Button>
          {renderMenu}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
