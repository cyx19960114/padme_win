import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  isLoading,
  activateNextStep,
  setNewPassword,
} from "../../redux/reducers/wizardSlice";
import { showAlert } from "../../redux/reducers/alertSlice";

const SetNewPasswordContent = ({ step }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoading);
  const [newPassword, setPassword] = useState("");

  function handleChange(evt) {
    setPassword(evt.target.value);
  }

  function handleSetPassword() {
    if (!newPassword) {
      dispatch(
        showAlert({
          message: "Password field cannot be empty",
          options: {
            key: "setNewPasswordError",
            variant: "error",
          },
        })
      );
      return;
    }

    dispatch(setNewPassword({ newPassword }))
      .unwrap()
      .then(() => {
        dispatch(activateNextStep(step));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="info" sx={{ fontWeight: "600" }}>
        Please type the new password which you just entered in our IAM entity
        i.e. Keycloak.{" "}
      </Alert>
      <Container maxWidth="sm" sx={{ mt: 3 }}>
        <Stack spacing={2}>
          <Typography variant="body2">
            Below, enter your new password.
          </Typography>
          <TextField
            label="New password"
            variant="outlined"
            type="password"
            value={newPassword}
            onChange={handleChange}
            disabled={loading}
            fullWidth
          />
          <Button
            variant="contained"
            size="large"
            disabled={loading}
            onClick={handleSetPassword}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : "Set new password"}
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default SetNewPasswordContent;
