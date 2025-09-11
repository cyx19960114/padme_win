import Button from "@mui/material/Button";
import { useFormikContext } from "formik";

const ButtonWrapper = (props) => {
  const { submitForm } = useFormikContext();
  const { children, sx, ...otherProps } = props;

  const handleClick = () => {
    submitForm();
  };

  const buttonConfig = {
    type: "submit",
    variant: "contained",
    color: "primary",
    fullWidth: true,
    onClick: handleClick,
    ...otherProps,
  };

  return <Button {...buttonConfig}>{children}</Button>;
};

export default ButtonWrapper;
