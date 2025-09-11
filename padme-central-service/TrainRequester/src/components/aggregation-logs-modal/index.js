import { grey } from "@mui/material/colors";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import StyledDialogTitle from "../DialogTitle";
import {
  getLogs,
  isLoading,
  getAggregationLogs,
} from "../../pages/train-requester/aggregationLogSlice";

const AggregationLogsModal = ({ open, handleClose, selected }) => {
  const dispatch = useDispatch();
  const logs = useSelector(getLogs);
  const loading = useSelector(isLoading);
  const federatedJobID = selected?.jobID;
  const logsElementID = `federated-logs-${federatedJobID}`;
  const [moreLogsPromise, setMoreLogsPromise] = useState(null);

  const cancelRequestAndClose = () => {
    if (moreLogsPromise) {
      moreLogsPromise.abort();
    }
    handleClose();
  };

  useEffect(() => {
    if (open && !loading) {
      const promise = dispatch(getAggregationLogs(federatedJobID));
      setMoreLogsPromise(promise);

      promise.then(() => {
        const logsElement = document.getElementById(logsElementID);
        if (logsElement) logsElement.scrollTop = logsElement?.scrollHeight;
      });
    }
  }, [dispatch, federatedJobID, open, loading, logsElementID]);

  return (
    <Dialog fullWidth maxWidth="lg" open={open}>
      <StyledDialogTitle onClose={cancelRequestAndClose}>
        Aggregation Logs
      </StyledDialogTitle>
      <DialogContent>
        <Stack
          spacing={1}
          sx={{ p: 2, bgcolor: grey[100], borderRadius: 2, mb: 2 }}
        >
          <Typography>
            <b>Job ID: </b>
            {federatedJobID}
          </Typography>
          <Typography>
            <b>Aggregation Image: </b>
            {selected?.trainClassIdAggregation}
          </Typography>
        </Stack>
        <TextField
          rows={23}
          multiline
          fullWidth
          id={logsElementID}
          value={
            logs.map((log) => log.log).join("\n") ||
            "No logs available for now ¯\\_(ツ)_/¯"
          }
          InputProps={{ readOnly: true }}
          sx={{
            position: "relative",
            ".MuiInputBase-root": {
              fontFamily: "monospace",
              fontSize: "14px",
              bgcolor: grey[100],
            },
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AggregationLogsModal;
