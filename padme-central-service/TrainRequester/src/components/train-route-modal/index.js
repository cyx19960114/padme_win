import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassIcon from "@mui/icons-material/HourglassBottom";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import PulledIcon from "@mui/icons-material/Download";
import RejectIcon from '@mui/icons-material/DoNotDisturb';

import { renderStationID } from "../../pages/train-requester/utils";
import { trainStates, colors } from "../../pages/train-requester/constants";

const TrainRouteModal = ({ open, handleClose, selected }) => {
  const { route, stationMessage, currentStatus, visited } = selected || {};

  const paperProps = (visitedStation) => {
    let common = { px: 3, py: 2, minWidth: "300px" };
    if (visitedStation === "-1") {
      return { backgroundColor: colors.FINISHED, color: "white", ...common };
    }

    switch (currentStatus) {
      case trainStates.REJECT:
        return { backgroundColor: colors.REJECT, color: "white", ...common };
      case trainStates.PULLED:
        return { backgroundColor: colors.PULLED, color: "white", ...common };
      case trainStates.FINISHED:
        return { backgroundColor: colors.FINISHED, color: "white", ...common };
      default:
        return { backgroundColor: colors.WAIT_FOR_PULL, ...common };
    }
  };

  const renderStatusIcon = (visitedStation) => {
    if (visitedStation === "-1") {
      // Visited stations
      return (
        <>
          <CheckCircleIcon sx={{ mr: 1 }} />
          <b>(finished)</b>
        </>
      );
    } else if (visitedStation === "-2") {
      // Rejected stations
      return (
        <>
          <RejectIcon color="error" sx={{ mr: 1 }} />
          <b>(rejected)</b>
        </>
      );
    }

    switch (currentStatus) {
      case trainStates.REJECT:
        return (
          <>
            <SwipeLeftIcon sx={{ mr: 1 }} />
            <b>(reject)</b>
          </>
        );
      case trainStates.PULLED:
        return (
          <>
            <PulledIcon sx={{ mr: 1 }} />
            <b>(pulled)</b>
          </>
        );
      default:
        return (
          <>
            <HourglassIcon sx={{ mr: 1 }} />
            <b>(wait for pull)</b>
          </>
        );
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { maxHeight: "70vh" } }}
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>Route Details</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {route?.map((rt, idx) => (
            <Paper
              key={`${rt}_${idx}`}
              sx={{
                px: 3,
                py: 2,
                minWidth: "300px",
                ...paperProps(visited[idx]),
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}
              >
                {renderStationID(rt)}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4} fontWeight="bold">
                  Status:
                </Grid>
                <Grid item container xs={8}>
                  {renderStatusIcon(visited[idx])}
                </Grid>
                <Grid item xs={4} fontWeight="bold">
                  Message:
                </Grid>
                <Grid item xs={8}>
                  <Typography>{stationMessage[idx]}</Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TrainRouteModal;
