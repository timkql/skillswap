import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

function RequestSessionDialog({ open, onClose, user }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const auth = getAuth();

  const handleRequestSession = async () => {
    try {
      setLoading(true);
      setError('');
      const currentUser = auth.currentUser;
      
      if (!currentUser) throw new Error('No authenticated user');
      if (!selectedDate || !selectedTimeSlot) throw new Error('Please select a date and time');
      if (!message.trim()) throw new Error('Please enter a message');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/sessions/request`,
        {
          student_id: currentUser.uid,
          teacher_id: user.id,
          date: selectedDate,
          time_slot: selectedTimeSlot,
          message: message.trim()
        }
      );

      if (response.data.message === "Session request sent successfully") {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setSelectedDate(null);
          setSelectedTimeSlot(null);
          setMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    if (!user.availability) return [];
    return Object.entries(user.availability)
      .filter(([_, slots]) => slots.length > 0)
      .map(([date]) => date)
      .sort();
  };

  const getTimeSlotsForDate = (date) => {
    return user.availability[date] || [];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Request Session with {user.name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Session request sent successfully!
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Select a Date
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {getAvailableDates().map((date) => (
              <Chip
                key={date}
                label={format(parseISO(date), 'MMMM d, yyyy')}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTimeSlot(null);
                }}
                color={selectedDate === date ? 'primary' : 'default'}
                variant={selectedDate === date ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Box>

        {selectedDate && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select a Time Slot
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {getTimeSlotsForDate(selectedDate).map((timeSlot) => (
                <Chip
                  key={timeSlot}
                  label={timeSlot}
                  onClick={() => setSelectedTimeSlot(timeSlot)}
                  color={selectedTimeSlot === timeSlot ? 'primary' : 'default'}
                  variant={selectedTimeSlot === timeSlot ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Message to Teacher"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce yourself and explain what you'd like to learn..."
          sx={{ mb: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleRequestSession}
          variant="contained"
          disabled={loading || !selectedDate || !selectedTimeSlot || !message.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Send Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RequestSessionDialog; 