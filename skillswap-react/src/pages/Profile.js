import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  Card,
  CardContent,
  Divider,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
} from '@mui/material';
import { Edit as EditIcon, LocationOn, Work, School, PhotoCamera } from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { AVAILABLE_SKILLS } from '../constants/skills';
import { COUNTRIES } from '../constants/countries';

function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    country: '',
    bio: '',
    teaching_skills: [],
    learning_skills: []
  });
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('No authenticated user');
        }

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          throw new Error('User profile not found');
        }

        const data = userDoc.data();
        setUserData(data);
        setEditFormData({
          name: data.name || '',
          country: data.country || '',
          bio: data.bio || '',
          teaching_skills: data.teaching_skills || [],
          learning_skills: data.learning_skills || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [auth, db]);

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditModalOpen(false);
  };

  const handleInputChange = (field) => (event) => {
    setEditFormData({
      ...editFormData,
      [field]: event.target.value
    });
  };

  const handleSkillsChange = (field) => (event, newValue) => {
    setEditFormData({
      ...editFormData,
      [field]: newValue
    });
  };

  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setProfileImage(event.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setUploading(true);
      const user = auth.currentUser;
      let profilePictureUrl = userData.profile_picture_url;

      if (profileImage) {
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, profileImage);
        profilePictureUrl = await getDownloadURL(storageRef);
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...editFormData,
        profile_picture_url: profilePictureUrl
      });

      setUserData({
        ...userData,
        ...editFormData,
        profile_picture_url: profilePictureUrl
      });

      setEditModalOpen(false);
      setUploading(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <TopBar />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f3f2ef' }}>
      <TopBar />
      
      <Container maxWidth="lg" sx={{ 
        padding: "40px",
        mt: 4, 
        mb: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)' // Subtract TopBar height
      }}>
        {/* Main Profile Card */}
        <Paper elevation={3} sx={{ 
          p: 3, 
          mb: 3, 
          width: '100%',
          maxWidth: 900,
          position: 'relative'
        }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditProfile}
            sx={{ position: 'absolute', top: 16, right: 16 }}
          >
            Edit Profile
          </Button>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4 }}>
            <Avatar
              src={userData.profile_picture_url}
              sx={{ 
                width: 152, 
                height: 152, 
                border: '4px solid white',
                mb: 3
              }}
            />
            
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              {userData.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LocationOn sx={{ color: 'text.secondary', mr: 0.5 }} />
              <Typography variant="body1" color="text.secondary">
                {userData.country}
              </Typography>
            </Box>

            <Card variant="outlined" sx={{ width: '100%', maxWidth: 800, mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                  About
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {userData.bio || 'No bio provided'}
                </Typography>
              </CardContent>
            </Card>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Skills Sections */}
          <Grid container spacing={3}>
            {/* Teaching Skills */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Work sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6">
                      Skills I Can Teach
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userData.teaching_skills && userData.teaching_skills.length > 0 ? (
                      userData.teaching_skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          color="primary"
                          variant="outlined"
                          sx={{ borderRadius: '16px' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No teaching skills added yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Learning Skills */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <School sx={{ color: 'secondary.main', mr: 1 }} />
                    <Typography variant="h6">
                      Skills I Want to Learn
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {userData.learning_skills && userData.learning_skills.length > 0 ? (
                      userData.learning_skills.map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill}
                          color="secondary"
                          variant="outlined"
                          sx={{ borderRadius: '16px' }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No learning skills added yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Edit Profile Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Profile Picture Upload */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={profileImage ? URL.createObjectURL(profileImage) : userData?.profile_picture_url}
                sx={{ width: 120, height: 120 }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<PhotoCamera />}
              >
                Upload Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>

            {/* Basic Information */}
            <TextField
              label="Name"
              value={editFormData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
            />
            <Autocomplete
              options={COUNTRIES}
              value={editFormData.country}
              onChange={(event, newValue) => {
                setEditFormData({
                  ...editFormData,
                  country: newValue
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country"
                  required
                />
              )}
            />
            <TextField
              label="Bio"
              value={editFormData.bio}
              onChange={handleInputChange('bio')}
              fullWidth
              multiline
              rows={4}
            />

            {/* Skills Selection */}
            <Autocomplete
              multiple
              options={AVAILABLE_SKILLS}
              value={editFormData.teaching_skills}
              onChange={handleSkillsChange('teaching_skills')}
              getOptionDisabled={(option) => 
                editFormData.teaching_skills.length >= 5 && !editFormData.teaching_skills.includes(option)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills I Can Teach"
                  placeholder="Select up to 5 skills"
                  helperText={`${editFormData.teaching_skills.length}/5 skills selected`}
                />
              )}
            />
            <Autocomplete
              multiple
              options={AVAILABLE_SKILLS}
              value={editFormData.learning_skills}
              onChange={handleSkillsChange('learning_skills')}
              getOptionDisabled={(option) => 
                editFormData.learning_skills.length >= 5 && !editFormData.learning_skills.includes(option)
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Skills I Want to Learn"
                  placeholder="Select up to 5 skills"
                  helperText={`${editFormData.learning_skills.length}/5 skills selected`}
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button 
            onClick={handleSaveProfile} 
            variant="contained"
            disabled={uploading}
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile; 