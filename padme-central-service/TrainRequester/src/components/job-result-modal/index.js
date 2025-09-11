import { useSelector, useDispatch } from "react-redux";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import ResultTree from "./ResultTree";
import StyledButton from "../Button";
import StyledDialogTitle from "../DialogTitle";
import {
  downloadJobResult,
  getDownloadFiles,
  getOpenTabId,
  getOpenTab,
  getSelectedFile,
} from "../../pages/train-requester/trainsSlice";
import { resultTab } from "../../pages/train-requester/constants";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

const JobResultModal = ({ open, handleClose, selected }) => {
  const dispatch = useDispatch();
  const files = useSelector(getDownloadFiles);
  const openTab = useSelector(getOpenTab);
  const openTabId = useSelector(getOpenTabId);
  const selectedFile = useSelector(getSelectedFile);

  const downloadSelected = () => {
    const download = (files) => {
      const payload = { jobId: selected?.jobID, file: files.pop() };
      dispatch(downloadJobResult(payload));
      if (files.length === 0) clearInterval(interval);
    };

    const interval = setInterval(download, 1000, [...files]);
  };

  const downloadAll = () => {
    const payload = { jobId: selected?.jobID };
    dispatch(downloadJobResult(payload));
  };

  const downloadSingle = () => {
    const payload = { jobId: selected?.jobID, file: selectedFile };
    dispatch(downloadJobResult(payload));
  };

  return (
    <StyledDialog
      fullWidth
      maxWidth={openTab === 0 ? "sm" : "md"}
      aria-labelledby="job-result-title"
      open={open}
    >
      <StyledDialogTitle id="job-result-title" onClose={handleClose}>
        Job Results
      </StyledDialogTitle>
      <DialogContent dividers>
        <ResultTree jobId={selected?.jobID} />
      </DialogContent>
      <DialogActions>
        {openTabId === resultTab.LIST ? (
          <>
            <StyledButton
              disabled={files.length === 0}
              variant="outlined"
              onClick={downloadSelected}
            >
              Download Selected
            </StyledButton>
            <StyledButton variant="contained" onClick={downloadAll}>
              Download All
            </StyledButton>
          </>
        ) : (
          <StyledButton variant="contained" onClick={downloadSingle}>
            Download
          </StyledButton>
        )}
      </DialogActions>
    </StyledDialog>
  );
};

export default JobResultModal;
