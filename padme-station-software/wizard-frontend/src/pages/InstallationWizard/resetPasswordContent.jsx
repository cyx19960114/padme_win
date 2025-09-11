import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import CopyIcon from "@mui/icons-material/ContentCopy";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";

import {
  getConfig,
  getHarborCreds,
  activateNextStep,
  deActivateNextStep,
  fetchHarborCredentials,
} from "../../redux/reducers/wizardSlice";
import { showAlert } from "../../redux/reducers/alertSlice";

const ResetPasswordContent = ({ step }) => {
  const dispatch = useDispatch();
  const { authServerAddr, authServerPort } = useSelector(getConfig);
  const harborCreds = useSelector(getHarborCreds);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    dispatch(fetchHarborCredentials());
  }, [dispatch]);

  const copyToClipboard =
    (text) =>
    ({ currentTarget }) => {
      navigator.clipboard.writeText(text);
      dispatch(
        showAlert({
          message: `${currentTarget.id} copied to clipboard`,
          options: {
            key: `copyToClipboard/${currentTarget.id}`,
            variant: "info",
          },
        })
      );
    };

  function handleChange(evt) {
    const { checked } = evt.target;
    const { username, password } = harborCreds;
    if (!(checked && username && password)) dispatch(deActivateNextStep(step));
    else dispatch(activateNextStep(step));
    setChecked(checked);
  }

  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="warning" sx={{ fontWeight: "600" }}>
        Please reset your tempory password{" "}
        <Link
          href={`https://${authServerAddr}:${authServerPort}/auth/realms/pht/account`}
          underline="hover"
          color="blue"
          target="_blank"
        >
          here.
        </Link>{" "}
        Use the following temporary credentials for signing in.
      </Alert>
      <Box sx={{ py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography fontWeight="bold">username:</Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>{harborCreds.username || "unavailable"}</Typography>
            <Tooltip title="Copy username" placement="right">
              <span>
                <IconButton
                  id="username"
                  size="small"
                  onClick={copyToClipboard(harborCreds.username)}
                  disabled={Boolean(!harborCreds.username)}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography fontWeight="bold">password:</Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>{harborCreds.password || "unavailable"}</Typography>
            <Tooltip title="Copy password" placement="right">
              <span>
                <IconButton
                  id="password"
                  size="small"
                  onClick={copyToClipboard(harborCreds.password)}
                  disabled={Boolean(!harborCreds.password)}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
        <FormControl error={!checked} component="fieldset" variant="standard">
          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Checkbox
                size="small"
                name="allowList"
                checked={checked}
                onChange={handleChange}
                inputProps={{ "aria-label": "controlled" }}
              />
            }
            label="Please check if temporary password has been reset in keycloak."
          />
          {!checked && <FormHelperText>This field is required*</FormHelperText>}
        </FormControl>
      </Box>
    </Box>
  );
};

export default ResetPasswordContent;
