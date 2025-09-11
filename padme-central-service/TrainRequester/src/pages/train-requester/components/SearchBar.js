import * as React from "react";
import { styled, alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ClearIcon from "@mui/icons-material/Clear";
import Fade from "@mui/material/Fade";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.1),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.15),
  },
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "8ch",
      "&:focus": {
        width: "16ch",
      },
    },
  },
}));

const SearchBar = ({ value, onChange, onClear }) => {
  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon />
      </SearchIconWrapper>
      <StyledInputBase
        value={value}
        onChange={onChange}
        placeholder="Search…"
        inputProps={{ "aria-label": "search" }}
        endAdornment={
          <InputAdornment position="start">
            <IconButton disabled={value === ""} size="small" onClick={onClear}>
              <Fade in={value !== ""}>
                <ClearIcon fontSize="small" />
              </Fade>
            </IconButton>
          </InputAdornment>
        }
      />
    </Search>
  );
};

export default SearchBar;
