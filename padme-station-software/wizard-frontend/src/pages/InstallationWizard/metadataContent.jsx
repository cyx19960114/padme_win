import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { grey } from "@mui/material/colors";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {
  isLoading,
  getStationIRI,
  activateNextStep,
  setMetadataFilter,
  setMetadataProvider,
  fetchPreconfiguredStationIRI,
} from "../../redux/reducers/wizardSlice";
import { showAlert } from "../../redux/reducers/alertSlice";

const MetadataContent = ({ step }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoading);
  const preStationIRI = useSelector(getStationIRI);
  const [disableFilter, setDisableFilter] = useState(true);
  const [filter, setFilter] = useState({
    eventIRIs: "",
    allowList: false,
  });
  const [metadata, setMetadata] = useState({
    stationIRI: "",
    secretKey: "",
  });

  useEffect(() => {
    dispatch(fetchPreconfiguredStationIRI());
  }, [dispatch]);

  function handleChange(evt) {
    const { name, value } = evt.target;
    setMetadata({ ...metadata, [name]: value });
  }

  function handleChangeFilter(evt) {
    const { name, value, checked } = evt.target;
    setFilter({ ...filter, [name]: checked === undefined ? value : checked });
  }

  function handleSubmitMetadata() {
    const payload = {
      station_iri: preStationIRI || metadata.stationIRI,
      secret_key: metadata.secretKey,
    };

    if (!(payload.station_iri && payload.secret_key)) {
      dispatch(
        showAlert({
          message: "Station IRI and Secret Key must not be empty",
          options: {
            key: `metadata/submit`,
            variant: "error",
          },
        })
      );
      return;
    }

    dispatch(setMetadataProvider(payload))
      .unwrap()
      .then((res) => {
        setDisableFilter(false);
        dispatch(activateNextStep(step));
      })
      .catch((err) => console.log(err));
  }

  function handleSubmitFilter() {
    const payload = {
      list: filter.eventIRIs.split("\n"),
      use_as_allow_list: filter.allowList,
    };

    if (!filter.eventIRIs) {
      dispatch(
        showAlert({
          message: "Event IRIs must not be empty",
          options: {
            key: `filter/submit`,
            variant: "error",
          },
        })
      );
      return;
    }

    dispatch(setMetadataFilter(payload));
  }

  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="info" sx={{ fontWeight: "600" }}>
        <AlertTitle sx={{ fontWeight: "600" }}>
          Setup metadata provider to communicate metadata to the store.
        </AlertTitle>
        For this you need to provide the IRI of the station and a secret key. If
        the IRI is contained in the configuration file, it does not need to be
        set manually.
      </Alert>
      <Container
        maxWidth="md"
        sx={{ py: 3, ".MuiAccordion-root": { bgcolor: grey[200] } }}
      >
        <Accordion elevation={0} defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="metadata-content"
            id="metadata-header"
          >
            <Typography fontWeight="600">Metadata Setup</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Container maxWidth="sm">
              <Stack spacing={2}>
                <TextField
                  name="stationIRI"
                  label="Station IRI"
                  variant="outlined"
                  fullWidth
                  disabled={Boolean(preStationIRI) || loading}
                  value={preStationIRI || metadata.stationIRI}
                  onChange={handleChange}
                />
                <TextField
                  name="secretKey"
                  label="Secret Key"
                  variant="outlined"
                  type="password"
                  fullWidth
                  disabled={loading}
                  value={metadata.secretKey}
                  onChange={handleChange}
                />
                <Button
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handleSubmitMetadata}
                  fullWidth
                >
                  {loading ? <CircularProgress size={24} /> : "Submit"}
                </Button>
              </Stack>
            </Container>
          </AccordionDetails>
        </Accordion>
        <Accordion
          elevation={0}
          disabled={disableFilter}
          expanded={!disableFilter}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="filter-content"
            id="filter-header"
          >
            <Typography fontWeight="600">Filter Setup</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Container maxWidth="sm">
              <Stack spacing={2}>
                <TextField
                  name="eventIRIs"
                  label="Event IRIs"
                  variant="outlined"
                  rows={2}
                  multiline
                  fullWidth
                  value={filter.eventIRIs}
                  disabled={loading}
                  onChange={handleChangeFilter}
                />
                <FormControlLabel
                  disabled={loading}
                  control={
                    <Checkbox
                      size="small"
                      name="allowList"
                      checked={filter.allowList}
                      onChange={handleChangeFilter}
                      inputProps={{ "aria-label": "controlled" }}
                    />
                  }
                  label="Use as allow list"
                />
                <Button
                  variant="contained"
                  size="large"
                  disabled={loading}
                  onClick={handleSubmitFilter}
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

export default MetadataContent;
