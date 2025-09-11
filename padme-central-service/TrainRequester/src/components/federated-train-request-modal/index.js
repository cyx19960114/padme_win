import { useState, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

import StyledButton from "../Button";
import StyledDialogTitle from "../DialogTitle";
import SelectProject from "./SelectProject";
import SelectLearningImage from "./SelectLearningImage";
import SelectAggregationImage from "./SelectAggregationImage";
import SelectStation from "./SelectStation";
import {
  requestTrain,
  isLoadingTrainRequest
} from "../../pages/train-requester/trainsSlice";

const FederatedTrainRequestModal = ({ open, handleClose }) => {
  const dispatch = useDispatch();
  const loading = useSelector(isLoadingTrainRequest);

  const [project, setProject] = useState("");
  const [learningImage, setLearningImage] = useState("");
  const [aggregationImage, setAggregationImage] = useState("");
  const [rounds, setRounds] = useState(1);
  const [stations, setStations] = useState([{ name: "", id: "" }]);

  const handleChangeProject = (newProject) => {
    setProject(newProject ? newProject.name : "");
    setLearningImage("");
    setAggregationImage("");
  };

  const handleChangeLearningImage = (newLearningImage) => {
    setLearningImage(newLearningImage ? newLearningImage.trainclass : "");
  };

  const handleChangeAggregationImage = (newAggregationImage) => {
    setAggregationImage(newAggregationImage ? newAggregationImage.trainclass : "");
  };

  const handleChangeRounds = (event) => {
    setRounds(event.target.value);
  };

  const renderStations = stations.map((st, idx) =>
    idx === stations.length - 1 ? (
      st.name
    ) : (
      <Fragment key={idx}>{`${st.name} • `}</Fragment>
    )
  );

  const handleSubmitTrain = () => {
    if (
      !learningImage ||
      !aggregationImage ||
      !rounds ||
      stations.some((st) => st.name === "")
    ) {
      console.log(rounds);
      alert("Please enter all missing fields!");
    } else {
      if (rounds <= 0) {
        alert("Rounds must be greater than or equal to 1");
      } else {
        const payload = {
          rounds: parseInt(rounds),
          stations: stations.map((st) => st.id),
          trainclassAggregation: aggregationImage,
          trainclassLearning: learningImage,
        };

        // Reset form values
        dispatch(requestTrain(payload)).then(() => {
          setRounds(1);
          setProject("");
          setLearningImage("");
          setAggregationImage("");
          setStations([{ name: "", id: "" }]);
          handleClose();
        });
      }
    }
  };

  const handleModalClose = () => {
    setRounds(1);
    setProject("");
    setLearningImage("");
    setAggregationImage("");
    setStations([{ name: "", id: "" }]);
    handleClose();
  };

  return (
    <Dialog fullWidth maxWidth="md" open={open}>
      <StyledDialogTitle onClose={handleModalClose} disable={loading}>
        Create Federated Learning Request
      </StyledDialogTitle>
      <DialogContent dividers>
        <SelectProject
          loading={loading}
          selected={project}
          handleChangeProject={handleChangeProject}
        />
        <SelectLearningImage
          loading={loading}
          project={project}
          selected={learningImage}
          handleChangeImage={handleChangeLearningImage}
        />
        <SelectAggregationImage
          loading={loading}
          project={project}
          selected={aggregationImage}
          handleChangeImage={handleChangeAggregationImage}
        />
        <TextField
          label="Number of Training Rounds"
          type="number"
          sx={{ mt: 2 }}
          fullWidth
          value={rounds}
          disabled={loading}
          onChange={handleChangeRounds}
          inputProps={{ min: 1 }}
        />
        <SelectStation
          label="Select Station"
          loading={loading}
          stations={stations}
          setStations={setStations}
        />
        <Typography mt={3}>
          <b>Learning Image:</b>{" "}
          {!learningImage ? "Not Selected" : learningImage}
        </Typography>
        <Typography>
          <b>Aggregation Image:</b>{" "}
          {!aggregationImage ? "Not Selected" : aggregationImage}
        </Typography>
        <Typography>
          <b>Stations:</b> {!stations[0].name ? "Not Selected" : renderStations}
        </Typography>
      </DialogContent>
      <DialogActions>
        <StyledButton
          variant="contained"
          onClick={handleSubmitTrain}
          disabled={loading}
        >
          {loading ? <CircularProgress size={25} thickness={5} /> : "Submit"}
        </StyledButton>
      </DialogActions>
    </Dialog>
  );
};

export default FederatedTrainRequestModal;
