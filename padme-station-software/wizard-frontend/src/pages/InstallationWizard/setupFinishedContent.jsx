import { useSelector } from "react-redux";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";

import { isSetupFinished } from "../../redux/reducers/wizardSlice";

const SetupFinishedContent = () => {
  const finished = useSelector(isSetupFinished);
  return (
    <Box sx={{ my: 2 }}>
      <Alert severity="info" sx={{ fontWeight: "600" }}>
        Click below to apply the configuration. You will be redirected to the
        login page.
      </Alert>
      {finished && (
        <Alert severity="warning" sx={{ fontWeight: "600", mt: 2 }}>
          Applying the configuration. Afterwards the main program will start
          automatically. This can take a few seconds so please wait...
        </Alert>
      )}
    </Box>
  );
};

export default SetupFinishedContent;
