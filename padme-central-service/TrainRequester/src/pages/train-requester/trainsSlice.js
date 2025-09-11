import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import axios from "../../services/AxiosService";
import { createData, createDataFL } from "./utils";
import { resultTab, resultItemSupportedTypes, learningType } from "./constants";

const imageRegex = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
const textFileRegex = /\.(txt|csv)$/i;

/**
 * Async Thunk functions
 */
export const fetchJobs = createAsyncThunk(
  "trains/fetchJobs",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const response = await axios.get(
        `/api/${isIncremental ? "jobinfo" : "federatedjobinfo"}`
      );
      return response.data;
    } catch (error) {
      const errorMessage = `Failed to fetch jobs. ${error.message}`;
      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/fetchJobs",
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const fetchStations = createAsyncThunk(
  "trains/fetchStations",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`/api/stations`);
      return [...response.data];
    } catch (error) {
      const errorMessage = `Failed to fetch stations. ${error.message}`;
      thunkAPI.dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/fetchStations",
            variant: "error",
          },
        })
      );

      return thunkAPI.rejectWithValue({ error: errorMessage });
    }
  }
);

export const fetchJobResult = createAsyncThunk(
  "trains/fetchJobResult",
  async (jobId, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const response = await axios.get(
        `/api/${isIncremental ? "jobresult" : "federatedjobresult"}/${jobId}`
      );
      return response.data;
    } catch (error) {
      const vaultStatus = error?.response?.data?.response?.statusCode;
      const vaultError = Boolean(error?.response?.data?.response?.body?.errors);
      const errorMessage = vaultError
        ? `(${vaultStatus}) Vault is sealed. Please unseal vault to view job results.`
        : `Job results not available for id: ${jobId}`;
      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: jobId,
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const fetchTrains = createAsyncThunk(
  "trains/fetchTrains",
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const response = await axios.get(
        `/api/harbor/${isIncremental ? "trains" : "federatedtrains"}`
      );
      return response.data;
    } catch (error) {
      const errorMessage = `Failed to fetch trains. ${error.message}`;
      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/fetchTrains",
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const requestTrain = createAsyncThunk(
  "trains/requestTrain",
  async (payload, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const response = await axios.post(
        `/api/${isIncremental ? "jobinfo" : "federatedjobinfo"}`,
        { ...payload }
      );
      dispatch(
        showAlert({
          message: "The train request has been successfully sent.",
          options: {
            key: "trains/requestTrain",
            variant: "success",
          },
        })
      );
      return response.data;
    } catch (error) {
      const errorMessage =
        "Job could not be created, please look at the log files.";

      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/requestTrain",
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const rejectTrain = createAsyncThunk(
  "trains/rejectTrain",
  async (payload, thunkAPI) => {
    try {
      // eslint-disable-next-line
      const response = await axios.post(`/api/jobinfo/skipCurrentStation`, {
        ...payload,
      });
      thunkAPI.dispatch(
        showAlert({
          message: "The request has been successfully sent.",
          options: {
            key: "trains/rejectTrain",
            variant: "success",
          },
        })
      );
      thunkAPI.dispatch(fetchJobs());
    } catch (error) {
      const errorMessage = `Something went wrong. ${error.message}`;
      thunkAPI.dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/rejectTrain",
            variant: "error",
          },
        })
      );

      return thunkAPI.rejectWithValue({ error: errorMessage });
    }
  }
);

export const downloadJobResult = createAsyncThunk(
  "trains/downloadJobResult",
  async ({ jobId, file = null }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const downloadLink = isIncremental
        ? `/api/jobresult/${jobId}/download`
        : `/api/federatedjobresult/${jobId}/download`;

      const response = await axios.get(
        !file ? downloadLink : `${downloadLink}/?path=${file}`,
        { responseType: "blob" }
      );
      // Create file link in browser's memory
      const href = URL.createObjectURL(response.data);
      const contentDisposition = response.headers["content-disposition"];
      const filename = contentDisposition.match(/filename=(.+)/)[1];

      var anchor = document.createElement("a");
      anchor.setAttribute("href", href);
      anchor.setAttribute("download", filename);
      anchor.setAttribute("target", "_blank");
      anchor.click();

      // Release object to prevent memory leak
      URL.revokeObjectURL(href);
    } catch (error) {
      const errorMessage = `Download failed for job id: ${jobId}`;
      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/downloadJobResult",
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

export const downloadResultItem = createAsyncThunk(
  "trains/downloadResultItem",
  async ({ jobId, file }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { learning } = getState().trains;
      const isIncremental = learning === learningType.INCREMENTAL;
      const apiUrl = isIncremental
        ? `/api/jobresult/${jobId}/download/?path=${file}`
        : `/api/federatedjobresult/${jobId}/download/?path=${file}`;

      const config = imageRegex.test(file) ? { responseType: "blob" } : {};
      const response = await axios.get(apiUrl, config);
      return { content: response.data, file };
    } catch (error) {
      const errorMessage = `Failed to view file: ${file}. ${error.message}`;
      dispatch(
        showAlert({
          message: errorMessage,
          options: {
            key: "trains/downloadResultItem",
            variant: "error",
          },
        })
      );

      return rejectWithValue({ error: errorMessage });
    }
  }
);

const initialState = {
  jobs: [],
  rows: [],
  trains: [],
  stations: [],
  jobResult: [],
  notifications: [],
  downloadFiles: [],
  loading: false,
  loadingResults: false,
  loadingTrainRequest: false,
  status: "idle",
  error: "",
  openTab: 0, // List Tab: 0, View Tab: 1
  openTabId: resultTab.LIST,
  selectedFile: "",
  resultItem: { type: "", content: null },
  learning: learningType.INCREMENTAL,

  openRequestModal: false,
  openFederatedRequestModal: false,
  openRejectModal: false,
};

const trainsSlice = createSlice({
  name: "trains",
  initialState,
  reducers: {
    setLearningType: (state, { payload }) => {
      state.learning = payload;
    },
    setTableRows: (state, { payload }) => {
      state.rows = payload;
    },
    setRequestModal: (state, { payload }) => {
      state.openRequestModal = payload;
    },
    setFederatedRequestModal: (state, { payload }) => {
      state.openFederatedRequestModal = payload;
    },
    setRejectModal: (state, { payload }) => {
      state.openRejectModal = payload;
    },
    setDownloadFiles: (state, { payload }) => {
      state.downloadFiles = payload;
    },
    setOpenTab: (state, { payload }) => {
      state.openTab = payload.tab;
      state.openTabId = payload.tabId;
    },
    setSelectedFile: (state, { payload }) => {
      state.selectedFile = payload;
    },
    resetResultTab: (state) => {
      if (state.resultItem.type === resultItemSupportedTypes.IMAGE) {
        URL.revokeObjectURL(state.resultItem.content);
      }

      // Resetting tab state
      state.selectedFile = "";
      state.openTab = 0;
      state.openTabId = resultTab.LIST;
      state.resultItem = { type: "", content: null };
      state.downloadFiles = [];
    },
    // Snackbar actions
    showAlert: (state, { payload }) => {
      const key = payload.options && payload.options.key;
      state.notifications = [
        ...state.notifications,
        {
          key: key || new Date().getTime() + Math.random(),
          ...payload,
        },
      ];
    },
    closeAlert: (state, { payload }) => {
      const dismissAll = !payload;
      state.notifications = state.notifications.map((notif) =>
        dismissAll || notif.key === payload
          ? { ...notif, dismissed: true }
          : { ...notif }
      );
    },
    removeAlert: (state, { payload }) => {
      state.notifications = state.notifications.filter(
        (notif) => notif.key !== payload
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchJobs.pending, (state) => {
      state.loading = true;
      state.status = "loading";
    });
    builder.addCase(fetchJobs.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.status = "succeeded";

      // Sending sorted data based on key 'updatedAt'
      payload.sort((a, b) =>
        a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0
      );

      const loadedJobs =
        state.learning === learningType.INCREMENTAL
          ? payload.map((job, idx) =>
              createData(
                idx + 1,
                job.jobid,
                job.trainclassid,
                job.currentstation,
                job.nextstation,
                job.currentstate,
                job.route,
                job.updatedAt,
                job.stationmessages,
                job.visited
              )
            )
          : payload.map((job, idx) =>
              createDataFL(
                idx + 1,
                job.jobid,
                job.trainclassidlearning,
                job.trainclassidaggregation,
                job.currentround,
                job.maxrounds,
                job.currentstate,
                job.Stations,
                job.updatedAt
              )
            );

      // Added loaded jobs to the state
      state.jobs = loadedJobs;

      // To display and filter table rows
      state.rows = loadedJobs;
    });
    /**
     * Fetch All Jobs
     */
    builder.addCase(fetchJobs.rejected, (state, action) => {
      state.loading = false;
      state.status = "failed";
      state.error = action.error.message;
    });
    /**
     * Fetch Stations
     */
    builder.addCase(fetchStations.fulfilled, (state, { payload }) => {
      state.status = "succeeded";
      state.stations = payload;
    });
    builder.addCase(fetchStations.rejected, (state, action) => {
      state.error = action.error.message;
    });
    /**
     * Fetch Job Result
     */
    builder.addCase(fetchJobResult.pending, (state) => {
      state.loadingResults = true;
      state.status = "loading";
    });
    builder.addCase(fetchJobResult.fulfilled, (state, { payload }) => {
      state.loadingResults = false;
      state.status = "succeeded";
      state.jobResult = payload;
    });
    builder.addCase(fetchJobResult.rejected, (state, action) => {
      state.loadingResults = false;
      state.status = "failed";
      state.error = action.error;
      state.jobResult = [];
    });
    /**
     * Fetch Trains
     */
    builder.addCase(fetchTrains.pending, (state) => {
      state.loading = true;
      state.status = "loading";
    });
    builder.addCase(fetchTrains.fulfilled, (state, { payload }) => {
      state.loading = false;
      state.status = "succeeded";
      state.trains = payload;
    });
    builder.addCase(fetchTrains.rejected, (state, action) => {
      state.loading = false;
      state.status = "failed";
      state.error = action.error;
    });
    /**
     * Request Train
     */
    builder.addCase(requestTrain.pending, (state) => {
      state.loadingTrainRequest = true;
      state.status = "loading";
    });
    builder.addCase(requestTrain.fulfilled, (state, { payload }) => {
      state.loadingTrainRequest = false;
      state.status = "succeeded";

      const updatedJobs = state.jobs.map((job) => ({ ...job, id: job.id + 1 }));
      const newTrain =
        state.learning === learningType.INCREMENTAL
          ? createData(
              1,
              payload.jobid,
              payload.trainclassid,
              payload.currentstation,
              payload.nextstation,
              payload.currentstate,
              payload.route,
              payload.updatedAt,
              payload.stationmessages,
              payload.visited
            )
          : createDataFL(
              1,
              payload.jobid,
              payload.trainclassidlearning,
              payload.trainclassidaggregation,
              payload.currentround,
              payload.maxrounds,
              payload.currentstate,
              payload.Stations,
              payload.updatedAt
            );

      updatedJobs.unshift(newTrain);

      state.jobs = updatedJobs;
      state.rows = updatedJobs;
      state.openRequestModal = false;
    });
    builder.addCase(requestTrain.rejected, (state, action) => {
      state.loadingTrainRequest = false;
      state.status = "failed";
      state.error = action.error;
    });
    builder.addCase(rejectTrain.pending, (state) => {
      state.loading = true;
      state.status = "loading";
    });
    builder.addCase(rejectTrain.fulfilled, (state) => {
      state.loading = false;
      state.status = "succeeded";
      state.openRejectModal = false;
    });
    builder.addCase(rejectTrain.rejected, (state, action) => {
      state.loading = false;
      state.status = "failed";
      state.error = action.error;
    });
    builder.addCase(downloadResultItem.pending, (state) => {
      state.loadingResults = true;
      state.status = "loading";

      // Releasing previous object to prevent memory leaks
      if (state.resultItem.type === resultItemSupportedTypes.IMAGE) {
        URL.revokeObjectURL(state.resultItem.content);
      }

      state.resultItem = { type: "", content: null };
    });
    builder.addCase(downloadResultItem.fulfilled, (state, action) => {
      state.loadingResults = false;
      state.status = "succeeded";

      const { file, content } = action.payload;
      if (imageRegex.test(file)) {
        state.resultItem.type = resultItemSupportedTypes.IMAGE;
        state.resultItem.content = URL.createObjectURL(content);
      } else if (textFileRegex.test(file)) {
        state.resultItem.type = file.endsWith(".csv")
          ? resultItemSupportedTypes.CSV
          : resultItemSupportedTypes.TEXT;
        state.resultItem.content = content;
      }

      // Jump to View tab after fetching file contents
      state.openTab = 1;
      state.openTabId = resultTab.VIEW;
      state.selectedFile = file;
    });
    builder.addCase(downloadResultItem.rejected, (state, action) => {
      state.loadingResults = false;
      state.status = "failed";
      state.error = action.error;
    });
  },
});

/**
 * Selectors
 */
export const selectAllJobs = (state) => state.trains.jobs;
export const selectAllTrains = (state) => state.trains.trains;
export const selectAllStations = (state) => state.trains.stations;
export const selectJobResult = (state) => state.trains.jobResult;
export const getTableRows = (state) => state.trains.rows;
export const getJobsStatus = (state) => state.trains.status;
export const getJobsError = (state) => state.trains.error;
export const getOpenRequestModal = (state) => state.trains.openRequestModal;
export const getOpenRejectModal = (state) => state.trains.openRejectModal;
export const getNotifications = (state) => state.trains.notifications;
export const getDownloadFiles = (state) => state.trains.downloadFiles;
export const getOpenTab = (state) => state.trains.openTab;
export const getOpenTabId = (state) => state.trains.openTabId;
export const getSelectedFile = (state) => state.trains.selectedFile;
export const getResultItem = (state) => state.trains.resultItem;
export const getLearningType = (state) => state.trains.learning;
export const isLoading = (state) => state.trains.loading;
export const isLoadingResults = (state) => state.trains.loadingResults;
export const isLoadingTrainRequest = (state) =>
  state.trains.loadingTrainRequest;

/**
 * Actions
 */
export const {
  setTableRows,
  setRequestModal,
  setFederatedRequestModal,
  setRejectModal,
  setDownloadFiles,
  setOpenTab,
  setSelectedFile,
  setLearningType,
  showAlert,
  closeAlert,
  removeAlert,
  resetResultTab,
} = trainsSlice.actions;

export default trainsSlice.reducer;
