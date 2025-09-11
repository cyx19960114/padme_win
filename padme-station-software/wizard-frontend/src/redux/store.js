import { configureStore } from "@reduxjs/toolkit";

import alertReducer from "./reducers/alertSlice";
import wizardReducer from "./reducers/wizardSlice";

export default configureStore({
  reducer: {
    alert: alertReducer,
    wizard: wizardReducer,
  },
});
