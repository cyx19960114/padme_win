import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import SkipOnceIcon from "@mui/icons-material/NavigateNextRounded";
import SkipAllIcon from "@mui/icons-material/SkipNextRounded";

import Tooltip from "../Tooltip";
import StyledButton from "../Button";
import StyledDialogTitle from "../DialogTitle";
import { renderStationID } from "../../pages/train-requester/utils";
import {
  rejectTrain,
  isLoading,
} from "../../pages/train-requester/trainsSlice";

const TrainRejectModal = ({ open, handleClose, selected }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoading);

  const { jobID, stationMessage, currentStation, visited } = selected || {};
  const currStationIdx = visited?.indexOf(currentStation);

  const getTooltipText = (skipAll = false) => {
    let visitedStations = [...(visited || [])];

    if (skipAll) {
      visitedStations = visitedStations.map((st) =>
        st === currentStation ? null : st
      );
    } else {
      visitedStations[currStationIdx] = null;
    }

    const remainingStations = visitedStations.filter(
      (st, idx) => !(st === null || idx < currStationIdx)
    );
    const stations = remainingStations
      .map((st) => renderStationID(st))
      .join(", ");

    return (
      <Typography variant="button" fontWeight={500}>
        {stations.length ? (
          <>
            The next stations will be <b>[{stations}].</b>
          </>
        ) : (
          "No next station"
        )}
      </Typography>
    );
  };

  const handleSkipStation = (skipAll) => (_) => {
    const payload = { isAll: skipAll, jobID };
    const result = window.confirm("Are you sure?");
    if (!result) return;
    dispatch(rejectTrain(payload));
  };

  return (
    <Dialog fullWidth maxWidth="sm" open={open}>
      <StyledDialogTitle onClose={handleClose} disable={loading}>
        Train Reject
      </StyledDialogTitle>
      <DialogContent dividers>
        <Box>
          Station <b>[{renderStationID(currentStation)}]</b> has rejected your
          train.
        </Box>
        <Box mt={2}>
          <b>Message:</b> {stationMessage?.at(currStationIdx)}
        </Box>
      </DialogContent>
      <DialogActions>
        {loading && <CircularProgress size={25} thickness={5} sx={{ mr: 2 }} />}
        <Tooltip title={getTooltipText()}>
          <StyledButton
            disabled={loading}
            variant="outlined"
            onClick={handleSkipStation(false)}
            endIcon={<SkipOnceIcon />}
          >
            Skip Once
          </StyledButton>
        </Tooltip>
        <Tooltip title={getTooltipText(true)}>
          <StyledButton
            disabled={loading}
            variant="contained"
            onClick={handleSkipStation(true)}
            endIcon={<SkipAllIcon />}
            sx={{ minWidth: 125 }}
          >
            Skip All
          </StyledButton>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
};

export default TrainRejectModal;
