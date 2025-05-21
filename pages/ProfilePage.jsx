// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  OutlinedInput, 
  Grid,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { SKILL_OPTIONS, GENDER_OPTIONS } from '../utils/constants';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const ProfilePage = () => {
  const { currentUser, refreshUser } = useAuth();
  const { userId } = useParams();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    gender: [],
    can_teach_list: [],
    wants_to_learn_list: [],
    can_teach: '',
    wants_to_learn: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('not_connected');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.getUser(userId || currentUser.user_id);
        const userData = response.data;
        
        setProfileData({
          bio: userData.bio || '',
          gender: Array.isArray(userData.gender) ? userData.gender : [],
          can_teach_list: Array.isArray(userData.can_teach_list) ? userData.can_teach_list : [],
          wants_to_learn_list: Array.isArray(userData.wants_to_learn_list) ? userData.wants_to_learn_list : [],
          can_teach: userData.can_teach || '',
          wants_to_learn: userData.wants_to_learn || ''
        });
        
        setPreviewUrl(userData.image_path || '');
        
        if (currentUser?.user_id && userId && currentUser.user_id !== userId) {
          const res = await api.checkConnectionStatus(currentUser.user_id, userId);
          setConnectionStatus(res.data.status);
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load profile data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUser, userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillChange = (event, skillType) => {
    const { target: { value } } = event;
    const newValue = typeof value === 'string' ? value.split(',').map(Number) : value;
    
    setProfileData(prev => ({
      ...prev,
      [skillType]: newValue,
    }));
    
    // Also update the text description
    if (skillType === 'can_teach_list') {
      const skillNames = newValue.map(id => SKILL_OPTIONS[id]).join(', ');
      setProfileData(prev => ({ ...prev, can_teach: skillNames }));
    } else if (skillType === 'wants_to_learn_list') {
      const skillNames = newValue.map(id => SKILL_OPTIONS[id]).join(', ');
      setProfileData(prev => ({ ...prev, wants_to_learn: skillNames }));
    }
  };
  
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Update user profile
      await api.updateUser(currentUser.user_id, profileData);
      
      // Upload profile image if changed
      if (profileImage) {
        await api.uploadProfileImage(currentUser.user_id, profileImage);
      }
      
      // Refresh user data
      await refreshUser();
      setEditing(false);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      const res = await api.sendConnectionRequest(currentUser.user_id, userId);
      setConnectionStatus(res.data.status);
      setSnackbar({
        open: true,
        message: 'Connection request sent!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send connection request',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading && !profileData.bio) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const isViewingOwnProfile = !userId || currentUser?.user_id === userId;

  return (
    <Container maxWidth="md">
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={previewUrl}
              alt={currentUser?.username}
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            
            <Box>
              <Typography variant="h4" gutterBottom>
                {currentUser?.username}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {currentUser?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rating: {currentUser?.score?.toFixed(1) || '5.0'} / 5.0
              </Typography>
              
              {isViewingOwnProfile ? (
                !editing && (
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )
              ) : (
                <Button
                  variant="contained"
                  color={
                    connectionStatus === 'connected' ? 'success' :
                    connectionStatus === 'pending' ? 'secondary' : 'primary'
                  }
                  onClick={handleConnect}
                  disabled={connectionStatus !== 'not_connected' || loading}
                  sx={{ mt: 2 }}
                >
                  {connectionStatus === 'connected' ? 'Connected' :
                  connectionStatus === 'pending' ? 'Request Sent' : 'Connect'}
                </Button>
              )}
            </Box>
          </Box>
          
          {editing ? (
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Profile Image
                  </Typography>
                  <input
                    accept="image/*"
                    id="profile-image"
                    type="file"
                    onChange={handleImageChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    multiline
                    rows={4}
                    value={profileData.bio}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="gender-label">Gender</InputLabel>
                    <Select
                      labelId="gender-label"
                      id="gender"
                      name="gender"
                      multiple
                      value={profileData.gender}
                      onChange={handleChange}
                      input={<OutlinedInput id="select-multiple-chip" label="Gender" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={GENDER_OPTIONS[value]} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {Object.entries(GENDER_OPTIONS).map(([value, label]) => (
                        <MenuItem key={value} value={Number(value)}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="skills-to-teach-label">Skills I Can Teach</InputLabel>
                    <Select
                      labelId="skills-to-teach-label"
                      id="can_teach_list"
                      name="can_teach_list"
                      multiple
                      value={profileData.can_teach_list}
                      onChange={(e) => handleSkillChange(e, 'can_teach_list')}
                      input={<OutlinedInput id="select-multiple-chip" label="Skills I Can Teach" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={SKILL_OPTIONS[value]} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {Object.entries(SKILL_OPTIONS).map(([value, label]) => (
                        <MenuItem key={value} value={Number(value)}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="skills-to-learn-label">Skills I Want to Learn</InputLabel>
                    <Select
                      labelId="skills-to-learn-label"
                      id="wants_to_learn_list"
                      name="wants_to_learn_list"
                      multiple
                      value={profileData.wants_to_learn_list}
                      onChange={(e) => handleSkillChange(e, 'wants_to_learn_list')}
                      input={<OutlinedInput id="select-multiple-chip" label="Skills I Want to Learn" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={SKILL_OPTIONS[value]} />
                          ))}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {Object.entries(SKILL_OPTIONS).map(([value, label]) => (
                        <MenuItem key={value} value={Number(value)}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                About Me
              </Typography>
              <Typography variant="body1" paragraph>
                {profileData.bio || 'No bio provided.'}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Skills I Can Teach
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {profileData.can_teach_list && profileData.can_teach_list.length > 0 ? (
                  profileData.can_teach_list.map(skillId => (
                    <Chip 
                      key={skillId}
                      label={SKILL_OPTIONS[skillId]}
                      color="primary"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No skills added yet.
                  </Typography>
                )}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Skills I Want to Learn
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.wants_to_learn_list && profileData.wants_to_learn_list.length > 0 ? (
                  profileData.wants_to_learn_list.map(skillId => (
                    <Chip 
                      key={skillId}
                      label={SKILL_OPTIONS[skillId]}
                      color="secondary"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No skills added yet.
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </motion.div>
    </Container>
  );
};

export default ProfilePage;