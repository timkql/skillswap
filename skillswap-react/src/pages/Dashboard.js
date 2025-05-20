import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  CardHeader,
  AppBar,
  Toolbar,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  CalendarMonth,
  Search as SearchIcon
} from '@mui/icons-material';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import RequestSessionDialog from '../components/RequestSessionDialog';

const drawerWidth = 240;

function UserCard({ user }) {
  const [openDialog, setOpenDialog] = useState(false);

  // Function to get full country name from country code
  const getCountryName = (code) => {
    const countries = {
      'AF': 'Afghanistan', 'AL': 'Albania', 'DZ': 'Algeria', 'AD': 'Andorra', 'AO': 'Angola',
      'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia', 'AU': 'Australia',
      'AT': 'Austria', 'AZ': 'Azerbaijan', 'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh',
      'BB': 'Barbados', 'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin',
      'BT': 'Bhutan', 'BO': 'Bolivia', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana',
      'BR': 'Brazil', 'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi',
      'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'CV': 'Cape Verde', 'CF': 'Central African Republic',
      'TD': 'Chad', 'CL': 'Chile', 'CN': 'China', 'CO': 'Colombia', 'KM': 'Comoros',
      'CG': 'Congo', 'CR': 'Costa Rica', 'HR': 'Croatia', 'CU': 'Cuba', 'CY': 'Cyprus',
      'CZ': 'Czech Republic', 'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic',
      'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'ER': 'Eritrea',
      'EE': 'Estonia', 'ET': 'Ethiopia', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France',
      'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana',
      'GR': 'Greece', 'GD': 'Grenada', 'GT': 'Guatemala', 'GN': 'Guinea', 'GW': 'Guinea-Bissau',
      'GY': 'Guyana', 'HT': 'Haiti', 'HN': 'Honduras', 'HU': 'Hungary', 'IS': 'Iceland',
      'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq', 'IE': 'Ireland',
      'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan', 'JO': 'Jordan',
      'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea', 'KR': 'South Korea',
      'KW': 'Kuwait', 'KG': 'Kyrgyzstan', 'LA': 'Laos', 'LV': 'Latvia', 'LB': 'Lebanon',
      'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya', 'LI': 'Liechtenstein', 'LT': 'Lithuania',
      'LU': 'Luxembourg', 'MK': 'North Macedonia', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia',
      'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MR': 'Mauritania',
      'MU': 'Mauritius', 'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco',
      'MN': 'Mongolia', 'ME': 'Montenegro', 'MA': 'Morocco', 'MZ': 'Mozambique', 'MM': 'Myanmar',
      'NA': 'Namibia', 'NR': 'Nauru', 'NP': 'Nepal', 'NL': 'Netherlands', 'NZ': 'New Zealand',
      'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'NO': 'Norway', 'OM': 'Oman',
      'PK': 'Pakistan', 'PW': 'Palau', 'PS': 'Palestine', 'PA': 'Panama', 'PG': 'Papua New Guinea',
      'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PL': 'Poland', 'PT': 'Portugal',
      'QA': 'Qatar', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda', 'KN': 'Saint Kitts and Nevis',
      'LC': 'Saint Lucia', 'VC': 'Saint Vincent and the Grenadines', 'WS': 'Samoa', 'SM': 'San Marino',
      'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia', 'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles',
      'SL': 'Sierra Leone', 'SG': 'Singapore', 'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands',
      'SO': 'Somalia', 'ZA': 'South Africa', 'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka',
      'SD': 'Sudan', 'SR': 'Suriname', 'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria',
      'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste',
      'TG': 'Togo', 'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey',
      'TM': 'Turkmenistan', 'TV': 'Tuvalu', 'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates',
      'GB': 'United Kingdom', 'US': 'United States', 'UY': 'Uruguay', 'UZ': 'Uzbekistan', 'VU': 'Vanuatu',
      'VA': 'Vatican City', 'VE': 'Venezuela', 'VN': 'Vietnam', 'YE': 'Yemen', 'ZM': 'Zambia',
      'ZW': 'Zimbabwe'
    };
    return countries[code] || code;
  };

  return (
    <>
      <Card 
        elevation={2} 
        sx={{ 
          width: '350px',
          height: '500px',
          borderRadius: 2,
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4
          }
        }}
        onClick={() => setOpenDialog(true)}
      >
        <CardContent sx={{ 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            mb: 2 
          }}>
            <Avatar
              src={user.profile_picture_url}
              sx={{ 
                width: 100, 
                height: 100, 
                mb: 1.5,
                border: '4px solid',
                borderColor: 'primary.main'
              }}
            />
            <Typography variant="h6" component="div" align="center" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {getCountryName(user.country)}
            </Typography>
          </Box>

          {user.bio && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                textAlign: 'center',
                fontStyle: 'italic',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                height: '40px'
              }}
            >
              {user.bio}
            </Typography>
          )}
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Teaching:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5,
              maxHeight: '80px',
              overflow: 'hidden'
            }}>
              {user.teaching_skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="secondary" gutterBottom>
              Learning:
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 0.5,
              maxHeight: '80px',
              overflow: 'hidden'
            }}>
              {user.learning_skills.map((skill, index) => (
                <Chip
                  key={index}
                  label={skill}
                  size="small"
                  color="secondary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      <RequestSessionDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        user={user}
      />
    </>
  );
}

function Dashboard() {
  const [matchedUsers, setMatchedUsers] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Community', icon: <PeopleIcon />, path: '/matches' },
    { text: 'Schedule', icon: <CalendarMonth />, path: '/schedule' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('No authenticated user');
        }

        // Get current user's profile
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!currentUserDoc.exists()) {
          throw new Error('User profile not found');
        }
        const currentUserData = currentUserDoc.data();
        setCurrentUser(currentUserData);

        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const allUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser.uid);

        // Sort users into matched and other categories
        const matched = [];
        const other = [];

        // Only check for matches if the user has learning skills
        if (currentUserData.learning_skills && currentUserData.learning_skills.length > 0) {
          allUsers.forEach(user => {
            // Check if any of the user's teaching skills match current user's learning skills
            const hasMatchingSkill = user.teaching_skills.some(skill => 
              currentUserData.learning_skills.includes(skill)
            );

            if (hasMatchingSkill) {
              matched.push(user);
            } else {
              other.push(user);
            }
          });
        } else {
          // If no learning skills, all users go to other category
          other.push(...allUsers);
        }

        setMatchedUsers(matched);
        setOtherUsers(other);
        setFilteredUsers([...matched, ...other]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (!query) {
      setFilteredUsers([...matchedUsers, ...otherUsers]);
      return;
    }

    const filtered = [...matchedUsers, ...otherUsers].filter(user =>
      user.teaching_skills.some(skill =>
        skill.toLowerCase().includes(query)
      )
    );
    setFilteredUsers(filtered);
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
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Search Bar */}
        <Box sx={{ 
          width: '100%',
          maxWidth: '1200px',
          mb: 4
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for users by teaching skills..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'background.paper',
              }
            }}
          />
        </Box>

        {/* Search Results or Matched Members Section */}
        {(!searchQuery && currentUser?.learning_skills?.length > 0) && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1200px',
            mb: 4
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Matched Members
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Members who can teach skills you want to learn
            </Typography>

            <Grid 
              container 
              spacing={3} 
              justifyContent="center"
            >
              {matchedUsers.map((user) => (
                <Grid item key={user.id}>
                  <UserCard user={user} />
                </Grid>
              ))}
              {matchedUsers.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    No matched members found. Update your learning skills to find potential teachers.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Search Results Section */}
        {searchQuery && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1200px',
            mb: 4
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Search Results
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {`Showing users who teach "${searchQuery}"`}
            </Typography>

            <Grid 
              container 
              spacing={3} 
              justifyContent="center"
            >
              {filteredUsers.map((user) => (
                <Grid item key={user.id}>
                  <UserCard user={user} />
                </Grid>
              ))}
              {filteredUsers.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    {`No users found teaching "${searchQuery}"`}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {/* Other Members Section - Only show when not searching */}
        {!searchQuery && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1200px'
          }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {currentUser?.learning_skills?.length > 0 ? 'Other Members' : 'Community Members'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {currentUser?.learning_skills?.length > 0 
                ? 'Members of the community'
                : 'Add skills you want to learn to find potential teachers'
              }
            </Typography>

            <Grid 
              container 
              spacing={3} 
              justifyContent="center"
            >
              {otherUsers.map((user) => (
                <Grid item key={user.id}>
                  <UserCard user={user} />
                </Grid>
              ))}
              {otherUsers.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    No other members found in the community yet.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Dashboard; 