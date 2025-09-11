import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import CountAdornment from "../CountAdornment";
import { getStations } from "../../pages/train-requester/utils";

const SelectRoute = ({ label, routes, setRoutes, loading }) => {
  const stations = getStations();

  const handleAddRoute = () => {
    setRoutes([...routes, { name: "", id: "" }]);
  };

  const handleRemoveRoute = (idx) => {
    if (routes.length > 1) {
      routes.splice(idx, 1);
      setRoutes([...routes]);
    }
  };

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {routes.map((rt, idx) => (
        <Grid item key={idx} xs={6} display="flex">
          <FormControl fullWidth size="small">
            <Autocomplete
              id="route-select"
              disableClearable
              options={stations}
              getOptionLabel={(station) => `${station.name} (${station.status})`}
              groupBy={(station) => station.organization}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={rt.name !== "" ? rt : null}
              disabled={loading}
              onChange={(_e, newValue) => {
                if (newValue !== null) {
                  routes[idx].name = newValue.name;
                  routes[idx].id = newValue.id;
                  routes[idx].status = newValue.status;
                  setRoutes([...routes]);
                } else {
                  routes[idx].name = "";
                  routes[idx].id = "";
                  routes[idx].status = "";
                  setRoutes([...routes]);
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
            onClick={() => handleRemoveRoute(idx)}
          >
            <RemoveIcon />
          </IconButton>
          <IconButton
            disabled={loading}
            sx={{ borderRadius: 2 }}
            aria-label="add"
            color="primary"
            onClick={handleAddRoute}
          >
            <AddIcon />
          </IconButton>
        </Grid>
      ))}
    </Grid>
  );
};

export default SelectRoute;
