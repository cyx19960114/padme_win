import TextField from "@mui/material/TextField";
import { useField } from "formik";

const TextFieldWrapper = ({ name, ...otherProps }) => {
  const [field, meta] = useField(name);

  const textfieldConfig = {
    fullWidth: true,
    variant: "outlined",
    ...field,
    ...otherProps,
  };

  if (meta && meta.touched && meta.error) {
    textfieldConfig.error = true;
    textfieldConfig.helperText = meta.error;
  }

  return <TextField {...textfieldConfig} />;
};

export default TextFieldWrapper;
