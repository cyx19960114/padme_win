import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { showAlert } from "./trainsSlice";

import axios from "../../services/AxiosService";

export const getAggregationLogs = createAsyncThunk(
  "aggregationLog/getAggregationLogs",
  async (jobId, { getState, dispatch, rejectWithValue, signal }) => {
    try {
      const { lastLogId } = getState().aggregationLog;
      const apiUrl = `/api/federatedjobinfo/${jobId}/aggregationlogs?since=${lastLogId}`;
      const response = await axios.get(apiUrl, { signal });
      return response.data;
    } catch (error) {
      const errorMessage = "Could not fetch logs from aggregation container";
      if (axios.isCancel(error)) {
        console.log('Request cancelled');
      } else {
        dispatch(
          showAlert({
            message: errorMessage,
            options: {
              key: "aggregationLog/getAggregationLogs",
              variant: "error",
            },
          })
        );
      }

      return rejectWithValue({ error: errorMessage });
    }
  }
);

const initialState = {
  loading: false,
  status: "idle",
  error: "error",
  logs: [],
  lastLogId: 0,
  newLogs: false
}

const aggregationLogSlice = createSlice({
  name: "aggregationLog",
  initialState,
  reducers: {
    resetLogs: (state) => {
      state.logs = [];
      state.lastLogId = 0;
      state.newLogs = false;
    }
  },
  extraReducers: (builder) => {
    /**
     * Get Aggregation Logs
     */
    builder.addCase(getAggregationLogs.pending, (state, action) => {
      state.loading = true;
      state.status = "loading";
      state.newLogs = false;
    });
    builder.addCase(getAggregationLogs.fulfilled, (state, action) => {
      state.loading = false;
      state.status = "succeeded";

      if (action.payload.length > 0) {
        state.logs = [...state.logs, ...action.payload];
        state.lastLogId = action.payload[action.payload.length - 1].id;
        state.newLogs = true;
      }
    });
    builder.addCase(getAggregationLogs.rejected, (state, action) => {
      state.loading = false;
      state.status = "failed";
      state.error = action.error;
    })
  }
});

export const getError = (state) => state.aggregationLog.error;
export const getStatus = (state) => state.aggregationLog.status;
export const isLoading = (state) => state.aggregationLog.loading;
export const getLogs = (state) => state.aggregationLog.logs;
export const newLogsAvailable = (state) => state.aggregationLog.newLogs;

export const { resetLogs } = aggregationLogSlice.actions;

export default aggregationLogSlice.reducer;