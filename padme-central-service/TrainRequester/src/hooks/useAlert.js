import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSnackbar } from "notistack";

import {
  removeAlert,
  getNotifications,
} from "../pages/train-requester/trainsSlice";

let displayed = [];

export const useAlert = () => {
  const dispatch = useDispatch();
  const notifications = useSelector(getNotifications);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const storeDisplayed = (id) => {
    displayed = [...displayed, id];
  };

  const removeDisplayed = (id) => {
    displayed = [...displayed.filter((key) => id !== key)];
  };

  useEffect(() => {
    notifications.forEach(
      ({ key, message, options = {}, dismissed = false }) => {
        if (dismissed) {
          // dismiss the snackbar
          closeSnackbar(key);
          return;
        }

        if (displayed.includes(key)) return;

        enqueueSnackbar(message, {
          key,
          ...options,
          onClose: (event, reason, myKey) => {
            if (options.onClose) {
              options.onClose(event, reason, myKey);
            }
          },
          onExited: (_, myKey) => {
            // remove this snackbar from redux store
            dispatch(removeAlert(myKey));
            removeDisplayed(myKey);
          },
        });

        // keep track of snackbars that we've displayed
        storeDisplayed(key);
      }
    );
  }, [notifications, closeSnackbar, enqueueSnackbar, dispatch]);
};
