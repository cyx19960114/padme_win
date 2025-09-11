import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { grey } from "@mui/material/colors";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

import { showAlert } from "../../redux/reducers/alertSlice";
import {
  fetchDecryptionLogs,
  uploadAndDecrypt,
  activateNextStep,
} from "../../redux/reducers/wizardSlice";

const OtpDecryptionContent = ({ step }) => {
  const timeout = useRef();
  const dispatch = useDispatch();
  const [showLogs, setShowLogs] = useState(false);
  const { decryptionLogs, loading } = useSelector((state) => state.wizard);

  useEffect(() => {
    // Cleanup function for cleaning timeout
    return () => clearTimeout(timeout.current);
  }, []);

  useEffect(() => {
    const logsElement = document.getElementById("decryption-logs");
    if (logsElement) logsElement.scrollTop = logsElement?.scrollHeight;
  }, [decryptionLogs]);

  const [decrypt, setDecrypt] = useState({
    otp: "",
    file: undefined,
  });

  function handleFileUpload(e) {
    setDecrypt({ ...decrypt, file: e.target.files[0] });
  }

  function handleOtpChange(e) {
    setDecrypt({ ...decrypt, otp: e.target.value });
  }

  function handleUploadandDecrypt() {
    const { otp, file } = decrypt;
    if (!otp || !file) {
      dispatch(
        showAlert({
          message: "Please enter OTP and upload the 'env' file",
          options: {
            key: "OTP/decryptError",
            variant: "error",
          },
        })
      );
      return;
    }
    setShowLogs(true);

    // Allow polling if not already started
    if (!Boolean(timeout.current)) {
      timeout.current = setInterval(() => {
        dispatch(fetchDecryptionLogs());
      }, 1000);
    }

    let formdata = new FormData();
    formdata.append("otp", otp);
    formdata.append("envfile", file);

    dispatch(uploadAndDecrypt(formdata))
      .unwrap()
      .then(() => dispatch(activateNextStep(step)))
      .catch((err) => console.log(err));
  }

  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="info" sx={{ fontWeight: "600" }}>
        Please upload the configuration file you were provided by email and
        enter the corresponding OTP for decrypting the file.
      </Alert>
      <Container maxWidth="sm" sx={{ mt: 3 }}>
        <Grid
          container
          justifyContent="center"
          spacing={2}
          sx={{ py: 2, pb: 4 }}
        >
          <Grid item xs={12}>
            <TextField
              value={decrypt.otp}
              label="OTP"
              variant="outlined"
              type="password"
              helperText="Your OTP for decrypting the file"
              fullWidth
              disabled={loading}
              onChange={handleOtpChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="file"
              placeholder="Choose file"
              helperText="The 'env' file which you received by email"
              type="file"
              fullWidth
              disabled={loading}
              onChange={handleFileUpload}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              size="large"
              onClick={handleUploadandDecrypt}
              fullWidth
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : "Upload & decrypt"}
            </Button>
          </Grid>
        </Grid>
        {showLogs && (
          <TextField
            id="decryption-logs"
            rows={10}
            multiline
            fullWidth
            value={decryptionLogs.join("\n")}
            InputProps={{ readOnly: true }}
            sx={{
              ".MuiInputBase-root": {
                fontFamily: "monospace",
                fontSize: "14px",
                bgcolor: grey[100],
                lineHeight: "2em",
              },
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default OtpDecryptionContent;
