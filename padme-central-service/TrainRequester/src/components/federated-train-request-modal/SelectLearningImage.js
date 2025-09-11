import { useSelector } from "react-redux";
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";

import { selectAllTrains } from "../../pages/train-requester/trainsSlice";

export default function SelectLearningImage({
  project,
  selected,
  handleChangeImage,
  loading,
}) {
  const federatedTrains = useSelector(selectAllTrains);
  const learningImage = federatedTrains.find(
    (train) => train.name === project
  );
  const formError = project
    ? !learningImage.hasOwnProperty("learning")
    : false;

  return (
    <FormControl fullWidth margin="normal" error={formError}>
      <Autocomplete
        id="learning-image-select"
        options={learningImage?.learning || []}
        getOptionLabel={(option) => option.trainclass}
        isOptionEqualToValue={(option, value) => option.trainclass === value.trainclass}
        disabled={loading}
        onChange={(_e, newValue) => handleChangeImage(newValue)}
        value={selected === "" ? null : { trainclass: selected }}
        renderInput={(params) => (
          <TextField {...params} label="Select Learning Image" variant="outlined" />
        )}
      />
      {formError && (
        <FormHelperText>
          No learning image found for project '<b>{project}</b>'
        </FormHelperText>
      )}
    </FormControl>
  );
}
