// src/components/feed/FeedItem.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Avatar, 
  Typography, 
  Button, 
  Box, 
  Chip 
} from '@mui/material';
import { SKILL_OPTIONS } from '../../utils/constants';

const FeedItem = ({ item }) => {
  const navigate = useNavigate();
  const [connectionStatus, setConnectionStatus] = useState('not_connected');
  const { currentUser } = useAuth();

  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser?.user_id && item.user_id) {
        const res = await api.checkConnectionStatus(currentUser.user_id, item.user_id);
        setConnectionStatus(res.data.status);
      }
    };
    checkStatus();
  }, [currentUser, item.user_id]);

  const handleConnect = async () => {
    try {
      const res = await api.sendConnectionRequest(currentUser.user_id, item.user_id);
      setConnectionStatus(res.data.status);
    } catch (error) {
      alert('Failed to send connection request.');
    }
  };

  // ...rest of your card rendering...

  // For potential_teacher item:
  if (item.type === 'potential_teacher') {
    // ...existing content...
    return (
      <CardActions>
        <Button
          variant="contained"
          color={
            connectionStatus === 'connected' ? 'success' :
            connectionStatus === 'pending' ? 'secondary' : 'primary'
          }
          onClick={handleConnect}
          disabled={connectionStatus !== 'not_connected'}
        >
          {connectionStatus === 'connected' ? 'Connected' :
           connectionStatus === 'pending' ? 'Pending' : 'Connect'}
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate(`/profile/${item.user_id}`)}
        >
          View Profile
        </Button>
      </CardActions>
    );
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Safety check - return null if item is invalid
  if (!item || !item.type) return null;
  
  if (item.type === 'transaction') {
    return (
      <motion.div variants={itemVariants}>
        <Card sx={{ mb: 3 }}>
          <CardHeader
            avatar={
              item.teacher?.image_path ? (
                <Avatar 
                  src={item.teacher.image_path} 
                  alt={item.teacher.username}
                />
              ) : (
                <Avatar>{item.teacher?.username?.charAt(0) || 'T'}</Avatar>
              )
            }
            title={`${item.teacher?.username || 'Teacher'} taught ${item.skill_taught || 'a skill'}`}
            subheader={item.learner?.username ? `to ${item.learner.username}` : ''}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              A successful skill exchange has been completed!
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 2, gap: 1 }}>
              {item.skill_taught && (
                <Chip 
                  label={item.skill_taught}
                  color="primary"
                  variant="outlined"
                />
              )}
              {item.skill_learned && (
                <Chip 
                  label={item.skill_learned}
                  color="secondary"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => navigate('/matches')}>
              Find Similar Matches
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    );
  }
  
  if (item.type === 'potential_teacher') {
    // Safety check for matching_skills
    const skills = Array.isArray(item.matching_skills) ? item.matching_skills : [];
    
    return (
      <motion.div variants={itemVariants}>
        <Card sx={{ mb: 3 }}>
          <CardHeader
            avatar={
              item.image_path ? (
                <Avatar src={item.image_path} alt={item.username} />
              ) : (
                <Avatar>{item.username?.charAt(0) || 'U'}</Avatar>
              )
            }
            title={`${item.username || 'User'}${item.rating ? ` (${item.rating.toFixed(1)}★)` : ''}`}
            subheader="Recommended Teacher"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              {item.username || 'This user'} can teach you:
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 2, flexWrap: 'wrap', gap: 1 }}>
              {skills.map(skillId => (
                <Chip 
                  key={skillId}
                  label={SKILL_OPTIONS[skillId] || `Skill ${skillId}`}
                  color="primary"
                />
              ))}
            </Box>
          </CardContent>
          <CardActions>
            <Button 
              size="small" 
              variant="contained"
              onClick={() => navigate(`/matches`)}
            >
              Connect
            </Button>
          </CardActions>
        </Card>
      </motion.div>
    );
  }
  
  return null;
};

export default FeedItem;