import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar
} from '@mui/material';
import {
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { format, parseISO } from 'date-fns';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && children}
    </div>
  );
}

function RequestCard({ request, type, onAccept, onDecline }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    try {
      setLoading(true);
      setError('');
      await onAccept(request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      setError('');
      await onDecline(request);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={type === 'received' ? request.sender?.profile_picture_url : request.receiver?.profile_picture_url}
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Box>
            <Typography variant="h6">
              {type === 'received' ? request.sender?.name : request.receiver?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {request.message}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            icon={<AccessTimeIcon />}
            label={format(parseISO(request.date), 'MMM d, yyyy')}
            size="small"
          />
          <Chip
            icon={<AccessTimeIcon />}
            label={request.time_slot}
            size="small"
          />
          <Chip
            label={request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            color={
              request.status === 'pending' ? 'warning' :
              request.status === 'accepted' ? 'success' :
              'error'
            }
            size="small"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {type === 'received' && request.status === 'pending' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAccept}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Accepting...' : 'Accept'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDecline}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Declining...' : 'Decline'}
            </Button>
          </Box>
        )}

        {request.status === 'accepted' && (
          <Box sx={{ mt: 2 }}>
            {request.meet_link && (
              <Button
                variant="contained"
                color="primary"
                href={request.meet_link}
                target="_blank"
                fullWidth
                sx={{ mb: 1 }}
              >
                Join Google Meet
              </Button>
            )}
            
            {request.calendar_links && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="primary"
                  href={request.calendar_links.google}
                  target="_blank"
                  size="small"
                >
                  Add to Google Calendar
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  href={request.calendar_links.outlook}
                  target="_blank"
                  size="small"
                >
                  Add to Outlook
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  href={request.calendar_links.yahoo}
                  target="_blank"
                  size="small"
                >
                  Add to Yahoo Calendar
                </Button>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function Community() {
  const [tabValue, setTabValue] = useState(0);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const user = auth.currentUser;
      if (!user) throw new Error('No authenticated user');

      // Fetch sent requests
      const sentResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/sessions/requests/sent/${user.uid}`
      );
      setSentRequests(sentResponse.data);

      // Fetch received requests
      const receivedResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/sessions/requests/received/${user.uid}`
      );
      setReceivedRequests(receivedResponse.data);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load requests');
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/sessions/requests/${request.id}/accept`
      );
      
      // Update the request in the local state with all the response data
      setReceivedRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { 
                ...req, 
                status: 'accepted', 
                meet_link: response.data.meet_link,
                calendar_links: response.data.calendar_links,
                event_id: response.data.event_id
              }
            : req
        )
      );
    } catch (err) {
      console.error('Error accepting request:', err);
      throw new Error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (request) => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/sessions/requests/${request.id}/decline`
      );
      
      // Update the request status in the local state
      setReceivedRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'declined' }
            : req
        )
      );
    } catch (err) {
      console.error('Error declining request:', err);
      throw new Error('Failed to decline request');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      
      <Container maxWidth="lg" sx={{ mt: '80px', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Community
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your session requests and connect with other members.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Received Requests" />
            <Tab label="Sent Requests" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              {receivedRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center">
                  No received requests yet.
                </Typography>
              ) : (
                receivedRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="received"
                    onAccept={handleAcceptRequest}
                    onDecline={handleDeclineRequest}
                  />
                ))
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 2 }}>
              {sentRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center">
                  No sent requests yet.
                </Typography>
              ) : (
                sentRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    type="sent"
                  />
                ))
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}

export default Community; 