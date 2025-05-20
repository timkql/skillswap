import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  Stack,
  Fade
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OnboardingProgress from '../components/OnboardingProgress';
import axios from 'axios';
import { auth } from '../firebase';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Predefined skills list
const SKILLS = [
  { id: 1, name: 'JavaScript', category: 'Programming' },
  { id: 2, name: 'Python', category: 'Programming' },
  { id: 3, name: 'React', category: 'Web Development' },
  { id: 4, name: 'Node.js', category: 'Web Development' },
  { id: 5, name: 'UI/UX Design', category: 'Design' },
  { id: 6, name: 'Graphic Design', category: 'Design' },
  { id: 7, name: 'Digital Marketing', category: 'Marketing' },
  { id: 8, name: 'Content Writing', category: 'Writing' },
  { id: 9, name: 'Data Analysis', category: 'Data Science' },
  { id: 10, name: 'Machine Learning', category: 'Data Science' },
  { id: 11, name: 'Mobile Development', category: 'Programming' },
  { id: 12, name: 'DevOps', category: 'Programming' }
];

function TeachingSkills() {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState([]);
  const db = getFirestore();

  const handleSkillClick = (skill) => {
    if (selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id));
    } else if (selectedSkills.length < 5) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleContinue = async () => {
    try {
      // Save selected teaching skills to user profile
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update skills in the API
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/profile/${user.uid}/skills`, {
        teaching_skills: selectedSkills.map(skill => skill.name)
      });

      if (response.data) {
        navigate('/dashboard');
      } else {
        throw new Error('Failed to save teaching skills');
      }
    } catch (error) {
      console.error('Error saving teaching skills:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleSkip = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // Update skills in the API
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/profile/${user.uid}/skills`, {
        teaching_skills: []
      });

      if (response.data) {
        navigate('/dashboard');
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleBack = () => {
    navigate('/skills');
  };

  return (
    <Fade in={true} timeout={500}>
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <OnboardingProgress currentStep={3} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1" align="center" sx={{ flex: 1 }}>
              What skills would you like to teach?
            </Typography>
          </Box>

          <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Select up to 5 skills you're comfortable teaching (you can change these later)
          </Typography>

          <Grid container spacing={2}>
            {SKILLS.map((skill) => (
              <Grid item xs={12} sm={6} md={4} key={skill.id}>
                <Paper
                  elevation={selectedSkills.find(s => s.id === skill.id) ? 3 : 1}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: selectedSkills.find(s => s.id === skill.id)
                      ? 'primary.light'
                      : 'background.paper',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                  }}
                  onClick={() => handleSkillClick(skill)}
                >
                  <Typography variant="h6" component="h2">
                    {skill.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {skill.category}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleSkip}
              sx={{ minWidth: 100 }}
            >
              Skip
            </Button>
            <Button
              variant="contained"
              onClick={handleContinue}
              disabled={selectedSkills.length === 0}
              sx={{ minWidth: 100 }}
            >
              Continue
            </Button>
          </Box>

          {selectedSkills.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Selected Teaching Skills:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {selectedSkills.map((skill) => (
                  <Chip
                    key={skill.id}
                    label={skill.name}
                    onDelete={() => handleSkillClick(skill)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Container>
    </Fade>
  );
}

export default TeachingSkills; 