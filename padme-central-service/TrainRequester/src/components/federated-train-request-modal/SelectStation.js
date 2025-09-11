import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import CountAdornment from "../CountAdornment";
import { getStations } from "../../pages/train-requester/utils";

const SelectStation = ({ label, stations, setStations, loading }) => {
  const allStations = getStations();

  const handleAddStation = () => {
    setStations([...stations, { name: "", id: "" }]);
  };

  const handleRemoveStation = (idx) => {
    if (stations.length > 1) {
      stations.splice(idx, 1);
      setStations([...stations]);
    }
  };

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {stations.map((rt, idx) => (
        <Grid item key={idx} xs={6} display="flex">
          <FormControl fullWidth size="small">
            <Autocomplete
              id="station-select"
              disableClearable
              options={allStations}
              getOptionLabel={(station) => `${station.name} (${station.status})`}
              groupBy={(station) => station.organization}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={rt.name !== "" ? rt : null}
              disabled={loading}
              onChange={(_e, newValue) => {
                if (newValue !== null) {
                  stations[idx].name = newValue.name;
                  stations[idx].id = newValue.id;
                  stations[idx].status = newValue.status;
                  setStations([...stations]);
                } else {
                  stations[idx].name = "";
                  stations[idx].id = "";
                  stations[idx].status = "";
                  setStations([...stations]);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <CountAdornment index={idx} />,
                  }}
                />
              )}
            />
          </FormControl>
          <IconButton
            disabled={loading}
            sx={{ borderRadius: 2 }}
            aria-label="delete"
            color="primary"
            onClick={() => handleRemoveStation(idx)}
          >
            <RemoveIcon />
          </IconButton>
          <IconButton
            disabled={loading}
            sx={{ borderRadius: 2 }}
            aria-label="add"
            color="primary"
            onClick={handleAddStation}
          >
            <AddIcon />
          </IconButton>
        </Grid>
      ))}
    </Grid>
  );
};

export default SelectStation;
