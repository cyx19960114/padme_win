import { useState } from "react";
import { useDispatch } from "react-redux";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import SearchBar from "./SearchBar";
import { filter } from "../constants";
import { renderStationName } from "../utils";
import { setTableRows } from "../trainsSlice";

const TableToolbar = ({ rows, setPage, isIncremental }) => {
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const [filterBy, setFilterBy] = useState(filter.ALL.key);

  const filterBySearch = (searchValue) => {
    const rowsFiltered = isIncremental
      ? rows.filter(
          (row) =>
            row.jobID.includes(searchValue) ||
            row.trainClass.includes(searchValue) ||
            // Search for currentStation (i.e. an ID) from a list of available IDs.
            renderStationName(searchValue).includes(row.currentStation) ||
            // Search for nextStation (i.e. an ID) from a list of available IDs.
            renderStationName(searchValue).includes(row.nextStation) ||
            row.currentStatus.replaceAll("_", " ").includes(searchValue) ||
            row.route.includes(searchValue) ||
            row.lastUpdate.includes(searchValue)
        )
      : rows.filter(
          (row) =>
            row.jobID.includes(searchValue) ||
            row.trainClassIdLearning.includes(searchValue) ||
            row.trainClassIdAggregation.includes(searchValue) ||
            row.currentStatus.replaceAll("_", " ").includes(searchValue) ||
            row.lastUpdate.includes(searchValue)
        );

    dispatch(setTableRows(rowsFiltered));
  };

  const handleSearch = (event) => {
    setPage(0);
    const searchValue = event.target.value;
    setValue(searchValue);
    filterBySearch(searchValue.trim().toLowerCase());
  };

  const handleClearSearch = () => {
    setPage(0);
    setValue("");
    filterBySearch("");
  };

  const handleFilter = (selected, filterValue) => {
    setPage(0);
    setFilterBy(selected);
    const rowsFiltered = rows.filter((row) =>
      filterValue.includes(row.currentStatus)
    );

    dispatch(setTableRows(rowsFiltered));
  };

  const handleVariant = (selected) =>
    filterBy === selected ? "contained" : "outlined";

  return (
    <Toolbar sx={{ px: { sm: 2 } }}>
      <Typography
        sx={{ flex: "1 1 100%", fontWeight: "bold" }}
        variant="h6"
        component="div"
      >
        Requested Trains
      </Typography>
      <SearchBar
        value={value}
        onChange={handleSearch}
        onClear={handleClearSearch}
      />
      <ButtonGroup
        disableElevation
        variant="outlined"
        size="large"
        aria-label="outlined filter buttons"
        sx={{ ml: 2, "> .MuiButton-root": { fontWeight: "bold" } }}
      >
        <Button
          variant={handleVariant(filter.ALL.key)}
          onClick={() => handleFilter(filter.ALL.key, filter.ALL.group)}
        >
          All
        </Button>
        <Button
          variant={handleVariant(filter.FINISHED.key)}
          onClick={() =>
            handleFilter(filter.FINISHED.key, filter.FINISHED.group)
          }
        >
          Finished
        </Button>
        <Button
          variant={handleVariant(filter.RUNNING.key)}
          onClick={() => handleFilter(filter.RUNNING.key, filter.RUNNING.group)}
        >
          Running
        </Button>
      </ButtonGroup>
    </Toolbar>
  );
};

export default TableToolbar;
