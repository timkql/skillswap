import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO, isBefore, startOfDay, addDays } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const ampm = i < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${ampm}`;
});

function Schedule() {
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const auth = getAuth();
  const db = getFirestore();

  // Get user's timezone
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const isTimeSlotInPast = (date, timeSlot) => {
    const [hour, period] = timeSlot.split(' ');
    let hour24 = parseInt(hour);
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    if (period === 'AM' && hour24 === 12) hour24 = 0;

    const slotDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour24);
    const zonedSlotDate = toZonedTime(slotDate, userTimeZone);
    const now = new Date();

    return isBefore(zonedSlotDate, now);
  };

  const isDateInPast = (date) => {
    const startOfToday = startOfDay(new Date());
    return isBefore(date, startOfToday);
  };

  const handleTimeSlotToggle = (timeSlot) => {
    if (isTimeSlotInPast(selectedDate, timeSlot)) return;

    setSelectedTimeSlots(prev => {
      if (prev.includes(timeSlot)) {
        return prev.filter(slot => slot !== timeSlot);
      } else {
        return [...prev, timeSlot].sort((a, b) => {
          const timeA = parseInt(a.split(':')[0]);
          const timeB = parseInt(b.split(':')[0]);
          return timeA - timeB;
        });
      }
    });
  };

  const handleSaveAvailability = async () => {
    try {
      setError('');
      setSaveSuccess(false);
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const updatedAvailability = {
        ...availability,
        [dateKey]: selectedTimeSlots
      };

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        availability: updatedAvailability,
        updated_at: new Date().toISOString()
      });

      // Update API
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/profile/${user.uid}/availability`,
        { availability: updatedAvailability }
      );

      if (response.data.message === "Availability updated successfully") {
        setAvailability(updatedAvailability);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      } else {
        throw new Error('Failed to update availability');
      }
    } catch (err) {
      console.error('Error saving availability:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to save availability');
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  useEffect(() => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setSelectedTimeSlots(availability[dateKey] || []);
  }, [selectedDate, availability]);

  const fetchAvailability = async () => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setAvailability(userData.availability || {});
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError('Failed to load availability');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const dateKey = format(selectedDate, 'yyyy-MM-dd');
  const hasAvailability = availability[dateKey]?.length > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      
      <Container maxWidth="xl" sx={{ mt: '80px', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Availability
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Set your teaching hours for specific dates.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Calendar Section */}
          <Paper elevation={2} sx={{ p: 2, flex: '1.2' }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                sx={{ width: '100%' }}
                minDate={new Date()}
                renderInput={(params) => <TextField {...params} />}
                renderDay={(day, _value, DayComponentProps) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isAvailable = availability[dateKey]?.length > 0;
                  const isPast = isDateInPast(day);
                  
                  return (
                    <Box
                      sx={{
                        position: 'relative',
                        opacity: isPast ? 0.5 : 1,
                        '&::after': isAvailable ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main'
                        } : {}
                      }}
                    >
                      <DayComponentProps {...DayComponentProps} disabled={isPast} />
                    </Box>
                  );
                }}
              />
            </LocalizationProvider>
          </Paper>

          {/* Time Selection Section */}
          <Paper elevation={2} sx={{ p: 3, flex: '0.8', minWidth: '300px' }}>
            <Typography variant="h6" gutterBottom>
              {formattedDate}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Select Available Time Slots
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mb: 3,
              maxHeight: '400px',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px',
                '&:hover': {
                  background: '#555',
                },
              },
            }}>
              {TIME_SLOTS.map((timeSlot) => {
                const isPast = isTimeSlotInPast(selectedDate, timeSlot);
                return (
                  <Chip
                    key={timeSlot}
                    label={timeSlot}
                    onClick={() => handleTimeSlotToggle(timeSlot)}
                    color={selectedTimeSlots.includes(timeSlot) ? 'primary' : 'default'}
                    variant={selectedTimeSlots.includes(timeSlot) ? 'filled' : 'outlined'}
                    sx={{ 
                      m: 0.5,
                      opacity: isPast ? 0.5 : 1,
                      pointerEvents: isPast ? 'none' : 'auto'
                    }}
                  />
                );
              })}
            </Box>

            <Box sx={{ mt: 'auto', pt: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveAvailability}
                fullWidth
                color={saveSuccess ? "success" : "primary"}
                disabled={saveSuccess}
              >
                {saveSuccess ? "Availability Saved" : "Save Availability"}
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default Schedule; 