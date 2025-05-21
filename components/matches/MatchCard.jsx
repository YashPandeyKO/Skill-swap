// src/components/matches/MatchCard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  Avatar, 
  Typography, 
  Button, 
  Box, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SKILL_OPTIONS } from '../../utils/constants';

const MatchCard = ({ match, onTransactionCreated }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [skillTaught, setSkillTaught] = useState('');
  const [skillLearned, setSkillLearned] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('not_connected');

  // Check existing connection status
  useEffect(() => {
    const checkStatus = async () => {
      if (currentUser?.user_id && match.user_id) {
        try {
          const res = await api.checkConnectionStatus(currentUser.user_id, match.user_id);
          setConnectionStatus(res.data.status);
        } catch (err) {
          console.error('Error checking connection status:', err);
        }
      }
    };
    checkStatus();
  }, [currentUser, match.user_id]);

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleConnect = async () => {
    try {
      const res = await api.sendConnectionRequest(currentUser.user_id, match.user_id);
      setConnectionStatus(res.data.status);
    } catch {
      alert('Failed to send connection request.');
    }
  };

  const handlePropose = async () => {
    try {
      const response = await api.createTransaction({
        teacher_id: currentUser.user_id,
        learner_id: match.user_id,
        skill_taught: skillTaught,
        skill_learned: skillLearned
      });

      if (onTransactionCreated) {
        onTransactionCreated(response.data);
      }

      handleClose();
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card sx={{ mb: 3 }}>
          <CardHeader
            avatar={
              <Avatar 
                src={match.image_path} 
                alt={match.username}
              />
            }
            title={match.username}
            subheader={`Match Score: ${Math.round(match.score * 100)}%`}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Matching skills:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {match.matching_skills.map(skillId => (
                <Chip 
                  key={skillId}
                  label={SKILL_OPTIONS[skillId]}
                  color="primary"
                />
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Can teach:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {match.can_teach_list?.map(skillId => (
                <Chip 
                  key={skillId}
                  label={SKILL_OPTIONS[skillId]}
                  variant="outlined"
                />
              ))}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              Wants to learn:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {match.wants_to_learn_list?.map(skillId => (
                <Chip 
                  key={skillId}
                  label={SKILL_OPTIONS[skillId]}
                  variant="outlined"
                  color="secondary"
                />
              ))}
            </Box>
          </CardContent>

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
              onClick={() => navigate(`/profile/${match.user_id}`)}
            >
              View Profile
            </Button>

            <Button 
              variant="contained" 
              onClick={handleClickOpen}
            >
              Propose Skill Swap
            </Button>
          </CardActions>
        </Card>
      </motion.div>

      {/* Skill Proposal Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Propose Skill Exchange</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Create a skill exchange proposal with {match.username}
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel id="teach-skill-label">I will teach</InputLabel>
            <Select
              labelId="teach-skill-label"
              value={skillTaught}
              onChange={(e) => setSkillTaught(e.target.value)}
              label="I will teach"
            >
              {currentUser.can_teach_list?.map(skillId => (
                <MenuItem key={skillId} value={SKILL_OPTIONS[skillId]}>
                  {SKILL_OPTIONS[skillId]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel id="learn-skill-label">I will learn</InputLabel>
            <Select
              labelId="learn-skill-label"
              value={skillLearned}
              onChange={(e) => setSkillLearned(e.target.value)}
              label="I will learn"
            >
              {match.can_teach_list?.map(skillId => (
                <MenuItem key={skillId} value={SKILL_OPTIONS[skillId]}>
                  {SKILL_OPTIONS[skillId]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handlePropose} variant="contained">
            Propose Exchange
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MatchCard;
