import { configureStore } from "@reduxjs/toolkit";

import trainsReducer from "../pages/train-requester/trainsSlice";
import aggregationLogReducer from "../pages/train-requester/aggregationLogSlice";

export default configureStore({
  reducer: {
    trains: trainsReducer,
    aggregationLog: aggregationLogReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: ["trains/downloadResultItem/fulfilled"],
      },
    }),
});
