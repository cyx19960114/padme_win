import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../services/AxiosService";

import { status } from "../../constants";
import { showAlert } from "./alertSlice";

export const fetchDecryptionLogs = createAsyncThunk(
  "wizard/fetchDecryptionLogs",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get("/setup/messagehook");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const fetchHarborCredentials = createAsyncThunk(
  "wizard/fetchHarborCredentials",
  async (_, thunkAPI) => {
    try {
      const res = await axios.get("/setup/fetchHarborCredentials");
      return res.data;
    } catch (err) {
      console.log("ERROR: ", err);
      return thunkAPI.rejectWithValue(err.message);
    }
  }
);

export const fetchPreconfiguredStationIRI = createAsyncThunk(
  "wizard/getPreconfiguredStationIRI",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.get("/setup/stationidentifier");
      const { station_iri } = res.data;
      const message = station_iri
        ? "Preconfigured station IRI found"
        : "No station IRI preconfigured!";

      dispatch(
        showAlert({
          message,
          options: {
            key: "wizard/getPreconfiguredStationIRI",
            variant: station_iri ? "success" : "warning",
          },
        })
      );
      return station_iri;
    } catch (err) {
      return rejectWithValue("Error fetching station IRI");
    }
  }
);

export const uploadAndDecrypt = createAsyncThunk(
  "wizard/uploadAndDecrypt",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post("/setup/uploadAndDecrypt", payload);
      dispatch(
        showAlert({
          message: res.data,
          options: {
            key: "wizard/uploadAndDecryptSuccess",
            variant: "success",
          },
        })
      );
    } catch (err) {
      const message =
        err?.response?.data ||
        `${err.message}. Please make sure server is running`;

      dispatch(
        showAlert({
          message,
          options: {
            key: "wizard/uploadAndDecryptError",
            variant: "error",
          },
        })
      );
      return rejectWithValue(message);
    }
  }
);

export const setNewPassword = createAsyncThunk(
  "wizard/setNewPassword",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await axios.post("/setup/HarborPassword", payload);
      dispatch(
        showAlert({
          message: "Password has been updated!",
          options: {
            key: "wizard/setNewPasswordSuccess",
            variant: "success",
          },
        })
      );
    } catch (err) {
      const { status, data } = err.response;
      dispatch(
        showAlert({
          message: `(${status}) ${data}.`,
          options: {
            key: "wizard/setNewPasswordError",
            variant: "error",
          },
        })
      );
      return rejectWithValue(err.response.message);
    }
  }
);

export const setCustomKeyPair = createAsyncThunk(
  "wizard/setCustomKeyPair",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await axios.post("/setup/keys", payload);
      dispatch(
        showAlert({
          message: "Custom Key-pair uploaded",
          options: {
            key: "wizard/setCustomKeyPairSuccess",
            variant: "success",
          },
        })
      );
    } catch (err) {
      const { status, statusText } = err.response;
      dispatch(
        showAlert({
          message: `Error while uploading key-pair (${statusText})`,
          options: {
            key: "wizard/setCustomKeyPairError",
            variant: "error",
          },
        })
      );

      return rejectWithValue(`${status}: ${statusText}`);
    }
  }
);

export const setMetadataProvider = createAsyncThunk(
  "wizard/setMetadataProvider",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post("/setup/metadatasetup", payload);
      const { provider_setup_successful } = res.data;
      dispatch(
        showAlert({
          message: `Provider setup ${
            provider_setup_successful ? "successful" : "failed"
          }`,
          options: {
            key: `wizard/setMetadataProviderSuccess`,
            variant: provider_setup_successful ? "success" : "error",
          },
        })
      );
      return res.data;
    } catch (err) {
      const { status, data } = err?.response;
      const message = `${status}: ${data}`;
      dispatch(
        showAlert({
          message,
          options: {
            key: `wizard/setMetadataProviderError`,
            variant: "error",
          },
        })
      );
      return rejectWithValue(message);
    }
  }
);

export const setMetadataFilter = createAsyncThunk(
  "wizard/setMetadataFilter",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      await axios.post("/setup/metadatafilter", payload);
      dispatch(
        showAlert({
          message: "Filter setup successful",
          options: {
            key: `wizard/setMetadataFilter`,
            variant: "success",
          },
        })
      );
    } catch (err) {
      console.log(err);
      return rejectWithValue("Error setting up metadata filter");
    }
  }
);

export const generateKeyPair = createAsyncThunk(
  "wizard/generateKeyPair",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await axios.post("/setup/generateKeys");
      dispatch(
        showAlert({
          message: "Successfully generated key-pair",
          options: {
            key: "wizard/generateKeyPair",
            variant: "success",
          },
        })
      );
      return res.data;
    } catch (err) {
      return rejectWithValue("Error while generating keys");
    }
  }
);

export const completeSetup = createAsyncThunk(
  "wizard/completeSetup",
  async (_, thunkAPI) => {
    try {
      await axios.post("/setup/complete");
    } catch (err) {
      console.log(err);
    }
  }
);

const initialState = {
  decryptionLogs: [],
  disabledSteps: {
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  },
  stationIRI: "",
  harborCreds: {
    username: "",
    password: "",
  },
  config: {
    authServerAddr: "",
    authServerPort: "",
  },
  setupFinished: false,
  loading: false,
  status: status.IDLE,
  message: "",
};

const wizardSlice = createSlice({
  name: "wizard",
  initialState,
  reducers: {
    activateNextStep: (state, { payload }) => {
      state.disabledSteps[payload] = false;
    },
    deActivateNextStep: (state, { payload }) => {
      state.disabledSteps[payload] = true;
    },
    configurationFinished: (state) => {
      state.setupFinished = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDecryptionLogs.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.decryptionLogs = [
          ...state.decryptionLogs,
          ...payload["messages"],
        ];
      })
      .addCase(fetchDecryptionLogs.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
        state.decryptionLogs = [...state.decryptionLogs, `${payload}...`];
      })
      .addCase(fetchHarborCredentials.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.harborCreds.username = payload.username;
        state.harborCreds.password = payload.password;
        state.config.authServerAddr = payload.authServerAddr;
        state.config.authServerPort = payload.authServerPort;
      })
      .addCase(fetchHarborCredentials.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
      })
      .addCase(uploadAndDecrypt.pending, (state) => {
        state.loading = true;
        state.decryptionLogs = [];
      })
      .addCase(uploadAndDecrypt.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(uploadAndDecrypt.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
      })
      .addCase(setNewPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(setNewPassword.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(setNewPassword.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
      })
      .addCase(setCustomKeyPair.pending, (state) => {
        state.loading = true;
      })
      .addCase(setCustomKeyPair.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(setCustomKeyPair.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
      })
      .addCase(generateKeyPair.pending, (state) => {
        state.loading = true;
      })
      .addCase(generateKeyPair.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(generateKeyPair.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        // state.message = payload;
      })
      .addCase(fetchPreconfiguredStationIRI.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPreconfiguredStationIRI.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.status = status.SUCCESS;
        state.stationIRI = payload;
      })
      .addCase(fetchPreconfiguredStationIRI.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        // state.message = payload;
      })
      .addCase(setMetadataProvider.pending, (state) => {
        state.loading = true;
      })
      .addCase(setMetadataProvider.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(setMetadataProvider.rejected, (state) => {
        state.loading = false;
        state.status = status.FAILED;
      })
      .addCase(setMetadataFilter.pending, (state) => {
        state.loading = true;
      })
      .addCase(setMetadataFilter.fulfilled, (state) => {
        state.loading = false;
        state.status = status.SUCCESS;
      })
      .addCase(setMetadataFilter.rejected, (state, { payload }) => {
        state.loading = false;
        state.status = status.FAILED;
        state.message = payload;
      })
      .addCase(completeSetup.pending, (state) => {
        state.loading = true;
        state.setupFinished = true;
      });
  },
});

export const getDisabledSteps = (state) => state.wizard.disabledSteps;
export const getHarborCreds = (state) => state.wizard.harborCreds;
export const getStationIRI = (state) => state.wizard.stationIRI;
export const getConfig = (state) => state.wizard.config;
export const isLoading = (state) => state.wizard.loading;
export const isSetupFinished = (state) => state.wizard.setupFinished;
export const { activateNextStep, deActivateNextStep, configurationFinished } =
  wizardSlice.actions;
export default wizardSlice.reducer;
