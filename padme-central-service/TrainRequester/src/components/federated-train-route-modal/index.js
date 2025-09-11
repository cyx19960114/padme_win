import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PulledIcon from "@mui/icons-material/Download";
import HourglassIcon from "@mui/icons-material/HourglassBottom";
import SwipeLeftIcon from "@mui/icons-material/SwipeLeft";
import RejectIcon from "@mui/icons-material/DoNotDisturb";

import { renderStationID } from "../../pages/train-requester/utils";
import { trainStates, colors } from "../../pages/train-requester/constants";

const FederatedTrainRouteModal = ({ open, handleClose, selected }) => {
  const { currentStatus, stations } = selected || {};
  const msgDefault = "No Message from Station";

  const paperProps = () => {
    let common = { px: 3, py: 2, minWidth: "300px" };

    switch (currentStatus) {
      case trainStates.ERROR:
        return { ...common, backgroundColor: colors.ERROR, color: "white" };
      case trainStates.REJECTED:
        return { ...common, backgroundColor: colors.REJECTED, color: "white" };
      case trainStates.RUNNING:
      case trainStates.AGGREGATING:
        return { ...common, backgroundColor: colors.RUNNING, color: "white" };
      case trainStates.FINISHED:
        return { ...common, backgroundColor: colors.FINISHED, color: "white" };
      default:
        return { ...common, backgroundColor: colors.WAIT_FOR_ACCEPTANCE };
    }
  };

  const renderStatusIcon = ({ doneWithCurrentState, failedCurrentRound }) => {
    switch (currentStatus) {
      case trainStates.ERROR:
        return (
          <>
            {!(doneWithCurrentState || failedCurrentRound) ? (
              <HourglassIcon sx={{ mr: 1 }} />
            ) : (
              <RejectIcon sx={{ mr: 1 }} />
            )}
            <b>(error)</b>
          </>
        );
      case trainStates.REJECTED:
        return (
          <>
            <SwipeLeftIcon sx={{ mr: 1 }} />
            <b>(rejected)</b>
          </>
        );
      case trainStates.RUNNING:
        return (
          <>
            <PulledIcon sx={{ mr: 1 }} />
            <b>(running)</b>
          </>
        );
      case trainStates.AGGREGATING:
        return (
          <>
            <PulledIcon sx={{ mr: 1 }} />
            <b>(aggregating)</b>
          </>
        );
      case trainStates.FINISHED:
        return (
          <>
            <CheckCircleIcon sx={{ mr: 1 }} />
            <b>(finished)</b>
          </>
        );
      default:
        return (
          <>
            <HourglassIcon sx={{ mr: 1 }} />
            <b>(wait for acceptance)</b>
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
      <DialogTitle sx={{ fontWeight: "bold" }}>Selected Stations</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {stations?.map((station, idx) => (
            <Paper key={`${station.uid}_${idx}`} sx={{ ...paperProps() }}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", textAlign: "center", mb: 3 }}
              >
                {renderStationID(station.uid)}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={4} fontWeight="bold">
                  Status:
                </Grid>
                <Grid item container xs={8}>
                  {renderStatusIcon(station)}
                </Grid>
                <Grid item xs={4} fontWeight="bold">
                  Message:
                </Grid>
                <Grid item xs={8}>
                  <Typography>{station.message || msgDefault}</Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default FederatedTrainRouteModal;
