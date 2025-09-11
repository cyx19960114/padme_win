import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepButton from "@mui/material/StepButton";
import Typography from "@mui/material/Typography";
import RightIcon from "@mui/icons-material/KeyboardArrowRight";
import LeftIcon from "@mui/icons-material/KeyboardArrowLeft";

import OtpDecryptionContent from "./otpDecryptionContent";
import ResetPasswordContent from "./resetPasswordContent";
import SetNewPasswordContent from "./setNewPasswordContent";
import GenerateKeyContent from "./generateKeyContent";
import MetadataContent from "./metadataContent";
import SetupFinishedContent from "./setupFinishedContent";
import {
  isLoading,
  completeSetup,
  getDisabledSteps,
} from "../../redux/reducers/wizardSlice";

export default function InstallationWizard() {
  const dispatch = useDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState({});
  const loading = useSelector(isLoading);
  const disabledSteps = useSelector(getDisabledSteps);

  const configurationStep = [
    {
      label: "OTP Decryption",
      content: <OtpDecryptionContent step={activeStep} />,
    },
    {
      label: "Reset Password",
      content: <ResetPasswordContent step={activeStep} />,
    },
    {
      label: "Set New Password",
      content: <SetNewPasswordContent step={activeStep} />,
    },
    {
      label: "Generate Private/Public Key",
      content: <GenerateKeyContent step={activeStep} />,
    },
    {
      label: "Setup Metadata Provider",
      content: <MetadataContent step={activeStep} />,
    },
    { label: "Finish", content: <SetupFinishedContent step={activeStep} /> },
  ];

  const totalSteps = () => {
    return configurationStep.length;
  };

  const isLastStep = () => {
    return activeStep === totalSteps() - 1;
  };

  const handleNext = () => {
    // Set step as completed
    const newCompleted = completed;
    newCompleted[activeStep] = true;
    setCompleted(newCompleted);

    if (isLastStep()) return;
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStep = (step) => () => {
    setActiveStep(step);
  };

  const handleComplete = async () => {
    dispatch(completeSetup());

    setTimeout(() => {
      // Redirecting to Station software login page
      console.log("Redirecting to station software login page...");
      window.location.href = "/";
    }, 10000);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCompleted({});
  };

  return (
    <Container>
      <Paper sx={{ py: 4, px: 4, mb: 4 }}>
        <Typography
          variant="h6"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Configuration Wizard
        </Typography>
        <Typography mb={5} align="center">
          For further Informaiton about PADME, see the{" "}
          <Link
            href="https://padme-analytics.de"
            underline="hover"
            color="blue"
            target="_blank"
          >
            website.
          </Link>
        </Typography>
        <Stepper activeStep={activeStep} alternativeLabel>
          {configurationStep.map((step, index) => (
            <Step key={step.label} completed={completed[index]}>
              <StepButton color="inherit" onClick={handleStep(index)}>
                {step.label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
        <div>
          {configurationStep[activeStep].content}
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              startIcon={<LeftIcon />}
            >
              Back
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            {isLastStep() ? (
              <>
                <Button onClick={handleReset} disabled={loading} sx={{ mr: 1 }}>
                  Reset
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  variant="contained"
                >
                  {loading ? <CircularProgress size={24} /> : "Complete Setup"}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={disabledSteps[activeStep] || loading}
                endIcon={<RightIcon />}
              >
                Next
              </Button>
            )}
          </Box>
        </div>
      </Paper>
    </Container>
  );
}
