import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";

const CountAdornment = ({ index }) => (
  <InputAdornment position="start">
    <Box
      sx={{
        backgroundColor: "dimgray",
        color: "white",
        borderRadius: 50,
        textAlign: "center",
        fontWeight: "bold",
        width: 24,
        height: 24,
        lineHeight: "24px",
      }}
    >
      {index + 1}
    </Box>
  </InputAdornment>
);

export default CountAdornment;
