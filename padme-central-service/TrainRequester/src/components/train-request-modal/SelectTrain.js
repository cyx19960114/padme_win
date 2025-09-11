import * as React from "react";
import { useSelector } from "react-redux";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Autocomplete from "@mui/material/Autocomplete";

// eslint-disable-next-line
import { getStationId } from "../../pages/train-requester/utils"; // Cyclic dependancy. DO NOT REMOVE
import { selectAllTrains } from "../../pages/train-requester/trainsSlice";

export default function SelectTrain({ selected, handleTrainChange, loading }) {
  const trains = useSelector(selectAllTrains);

  const trainOptions = trains.flatMap(({ name, tags }) =>
    tags
      ?.filter((tag) => tag !== null)
      ?.map((tag) => ({ name, tag: tag.name, id: tag.id }))
  );

  return (
    <FormControl fullWidth margin="normal">
      <Autocomplete
        id="train-select"
        options={trainOptions}
        groupBy={(train) => train.name}
        getOptionLabel={(option) => `${option.name}:${option.tag}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        disabled={loading}
        onChange={(e, newValue) => handleTrainChange(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Select Train" variant="outlined" />
        )}
      />
    </FormControl>
  );
}
