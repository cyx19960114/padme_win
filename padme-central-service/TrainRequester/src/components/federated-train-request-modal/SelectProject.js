import { useSelector } from "react-redux";
import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";

import { selectAllTrains } from "../../pages/train-requester/trainsSlice";

export default function SelectProject({
  selected,
  handleChangeProject,
  loading,
}) {
  const federatedTrains = useSelector(selectAllTrains);
  return (
    <FormControl fullWidth margin="normal">
      <Autocomplete
        id="project-select"
        options={federatedTrains}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.name === value.name}
        disabled={loading}
        onChange={(_e, newValue) => handleChangeProject(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Select Project" variant="outlined" />
        )}
      />
    </FormControl>
  );
}
