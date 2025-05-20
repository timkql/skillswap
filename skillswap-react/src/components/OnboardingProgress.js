import React from 'react';
import { Box, Stepper, Step, StepLabel, Typography } from '@mui/material';

const steps = [
  'Sign Up',
  'Profile Setup',
  'Skills to Learn',
  'Skills to Teach',
  'Dashboard'
];

function OnboardingProgress({ currentStep }) {
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={currentStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default OnboardingProgress; 