import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { styled, alpha } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import AddIcon from "@mui/icons-material/AddCircleOutline";
import AccountIcon from "@mui/icons-material/AccountCircle";
import Logout from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/HomeRounded";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

import Tooltip from "../../../components/Tooltip";
import TrainRequestModal from "../../../components/train-request-modal";
import FederatedTrainRequestModal from "../../../components/federated-train-request-modal";
import UserService from "../../../services/UserService";
import { learningType } from "../constants";
import {
  setRequestModal,
  setFederatedRequestModal,
  setLearningType,
  fetchJobs,
} from "../trainsSlice";

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginLeft: theme.spacing(3),
  "& .MuiInputBase-input, .MuiSelect-icon": {
    color: theme.palette.common.white,
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.23),
    },
    "&:hover fieldset, &.Mui-focused fieldset": {
      borderColor: alpha(theme.palette.common.white, 0.7),
    },
  },
}));

export default function NavBar() {
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const { openRequestModal, openFederatedRequestModal, learning } = useSelector(
    (state) => state.trains
  );
  const isMenuOpen = Boolean(anchorEl);

  const handleChangeLearning = (event) => {
    dispatch(setLearningType(event.target.value));
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenTrainRequest = () => {
    if (learning === learningType.INCREMENTAL) {
      dispatch(setRequestModal(true));
    } else {
      dispatch(setFederatedRequestModal(true));
    }
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
      <MenuItem onClick={() => UserService.doLogout()}>
        <ListItemIcon>
          <Logout color="error" fontSize="small" />
        </ListItemIcon>
        Logout
      </MenuItem>
    </Menu>
  );

  return (
    <>
      <AppBar elevation={0}>
        <Toolbar sx={{ py: 1 }}>
          <img
            src="./logo-only.png"
            style={{ maxWidth: "60px" }}
            alt="PHT CENTER SERVICE"
          />
          <Typography variant="h6" ml={2} fontWeight="bold">
            PHT CENTER SERVICE
          </Typography>
          <StyledFormControl size="small">
            <Select
              id="select-learning-type"
              value={learning}
              onChange={handleChangeLearning}
            >
              <MenuItem value={learningType.INCREMENTAL}>
                Incremental Learning
              </MenuItem>
              <MenuItem value={learningType.FEDERATED}>
                Federated Learning
              </MenuItem>
            </Select>
          </StyledFormControl>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            <Tooltip title="Home">
              <IconButton
                href={process.env.REACT_APP_CS_PORTAL_ENDPOINT}
                target="_blank"
                size="large"
                color="inherit"
              >
                <HomeIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton
                onClick={() => dispatch(fetchJobs())}
                size="large"
                color="inherit"
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="New Train Request">
              <IconButton
                onClick={handleOpenTrainRequest}
                size="large"
                color="inherit"
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Button
              aria-label="user account"
              aria-controls={menuId}
              aria-haspopup="true"
              size="large"
              startIcon={<AccountIcon />}
              onClick={handleProfileMenuOpen}
              sx={{ color: "white" }}
            >
              {UserService.getUsername()}
            </Button>
            {renderMenu}
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <TrainRequestModal
        open={openRequestModal}
        handleClose={() => dispatch(setRequestModal(false))}
      />
      <FederatedTrainRequestModal
        open={openFederatedRequestModal}
        handleClose={() => dispatch(setFederatedRequestModal(false))}
      />
    </>
  );
}
