import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { grey } from "@mui/material/colors";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CopyIcon from "@mui/icons-material/ContentCopy";

import {
  isLoading,
  activateNextStep,
  setCustomKeyPair,
  generateKeyPair,
} from "../../redux/reducers/wizardSlice";
import { showAlert } from "../../redux/reducers/alertSlice";

const GenerateKeyContent = ({ step }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoading);
  const [generatedKey, setGeneratedKey] = useState("");
  const [keys, setKeys] = useState({
    publicKey: "",
    privateKey: "",
  });

  function handleChangeKey(evt) {
    const { name, value } = evt.target;
    setKeys({ ...keys, [name]: value });
  }

  function handleSubmitKeys() {
    if (!(keys.publicKey && keys.privateKey)) {
      dispatch(
        showAlert({
          message: "Public and Private key must not be empty",
          options: {
            key: "setCustomKeyError",
            variant: "error",
          },
        })
      );
      return;
    }

    dispatch(setCustomKeyPair({ ...keys }))
      .unwrap()
      .then(() => dispatch(activateNextStep(step)))
      .catch((err) => console.log(err))
      .finally(() => setKeys({ publicKey: "", privateKey: "" })); // Reset fields
  }

  function handleGenerateKeys() {
    dispatch(generateKeyPair())
      .unwrap()
      .then((res) => {
        setGeneratedKey(res.publicKey);
        dispatch(activateNextStep(step));
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(generatedKey);
    dispatch(
      showAlert({
        message: "Public key copied to clipboard",
        options: {
          key: `copyToClipboard/publicKey`,
          variant: "info",
        },
      })
    );
  }

  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="info" sx={{ fontWeight: "600" }}>
        Please provide now a private/public key pair. You can alternatively
        generate one.
      </Alert>
      <Container
        maxWidth="md"
        sx={{ py: 3, ".MuiAccordion-root": { bgcolor: grey[200] } }}
      >
        <Accordion elevation={0} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="generate-keypair-content"
            id="generate-keypair-header"
          >
            <Typography fontWeight="600">Generate Key Pair</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Container>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <Button
                    variant="contained"
                    size="large"
                    disabled={loading}
                    onClick={handleGenerateKeys}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} /> : "Generate"}
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    size="large"
                    disabled={loading || !generatedKey}
                    onClick={copyToClipboard}
                    endIcon={<CopyIcon />}
                    fullWidth
                  >
                    Copy Public Key
                  </Button>
                </Grid>
              </Grid>
              <Stack spacing={2} pt={2}>
                <Typography variant="body2">
                  Below is the public key of the generated key pair.
                </Typography>
                <TextField
                  variant="outlined"
                  value={generatedKey}
                  multiline
                  rows={4}
                  fullWidth
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Stack>
            </Container>
          </AccordionDetails>
        </Accordion>
        <Accordion elevation={0}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="custom-keypair-content"
            id="custom-keypair-header"
          >
            <Typography fontWeight="600">Use Custom Key Pair</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Container maxWidth="sm">
              <Stack spacing={2}>
                <TextField
                  value={keys.publicKey}
                  name="publicKey"
                  label="Public key"
                  variant="outlined"
                  multiline
                  maxRows={2}
                  fullWidth
                  disabled={loading}
                  onChange={handleChangeKey}
                />
                <TextField
                  value={keys.privateKey}
                  name="privateKey"
                  label="Private key"
                  variant="outlined"
                  multiline
                  maxRows={2}
                  fullWidth
                  disabled={loading}
                  onChange={handleChangeKey}
                />
                <Button
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handleSubmitKeys}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : "Submit"}
                </Button>
              </Stack>
            </Container>
          </AccordionDetails>
        </Accordion>
      </Container>
    </Box>
  );
};

export default GenerateKeyContent;
