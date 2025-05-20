# SkillSwap

SkillSwap is a platform that connects people who want to learn new skills with those who can teach them. 

## 🌟 Key Features

- **Skill Matching**: Automatically matches users based on their teaching and learning skills
- **Profile Management**: Customize your profile with skills you want to teach and learn
- **Search Functionality**: Find teachers based on specific skills
- **Session Scheduling**: Request and accept learning sessions
- **User Authentication**: Secure login using Firebase Authentication

## 🛠️ Tech Stack

### Frontend
- React.js

### Backend
- FastAPI

### Database
- Firestore
- Firebase Storage (Images)

## 🔧 Configuration

### Environment Variables Setup

#### Frontend (.env)
Create a `.env` file in the `skillswap-react` directory with the following variables:
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
```

### Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Click "Add project"
   - Enter a project name and follow the setup wizard

2. **Enable Authentication**:
   - In the Firebase Console, go to "Authentication"
   - Click "Get Started"
   - Enable "Email/Password" authentication

3. **Create Firestore Database**:
   - Go to "Firestore Database"
   - Click "Create Database"
   - Choose "Start in test mode" for development
   - Select a location closest to your users

4. **Get Firebase Configuration**:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web app icon (</>)
   - Register your app with a nickname
   - Copy the configuration object

5. **Download Service Account Key**:
   - Go to Project Settings
   - Go to "Service accounts" tab
   - Click "Generate new private key"
   - Save the file as `firebase-credentials.json` in the `api` directory

### Google Calendar API Setup

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Click "Create Project" or select an existing project
   - Note down the Project ID

2. **Enable Google Calendar API**:
   - In the Google Cloud Console, go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create Service Account**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Fill in the service account details:
     - Name: `skillswap-calendar-service`
     - ID: `skillswap-calendar-service`
   - Click "Create and Continue"
   - Click "Done"

4. **Generate Service Account Key**:
   - In the Credentials page, find your service account
   - Click on the service account email
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Click "Create"
   - Save the file as `service-account.json` in the `api` directory


## 🚀 Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/timkql/skillswap.git
cd skillswap
```

### 2. Quick Setup
We provide a convenient script to set up and update dependencies:

```bash
# Make the script executable (first time only)
chmod +x skillswap

# Initial setup
./skillswap setup

# Update dependencies
./skillswap update

# Start React App and FastAPI Server
./skillswap start
```

The script provides the following commands:
- `setup`: Initial project setup (installs all dependencies)
- `update`: Update all dependencies
- `start`: Start both frontend and backend

The `start` command will:
- Launch the FastAPI server on http://localhost:8000
- Launch the React development server on http://localhost:3000
- Handle graceful shutdown of both servers when you press Ctrl+C

## 📱 User Journey

1. **Sign Up/Login**: Create an account or log in using email/password
2. **Complete Profile**: Select skills to teach and/or learn
3. **Browse Matches**: View users who match your skill requirements
4. **Search**: Find specific teachers by skill
5. **Request Sessions**: Schedule learning sessions with matched users via sending a request
6. **Attend Sessions**: When the teacher accepts your request, a calendar invite with a meets link will be available

## Design Considerations
- Firebase may not be the most ideal storage in the long run, but it was the quickest to setup
- Features were prioritzed based on value provided to users. So I wanted to make sure users could look for and request for lessons from appropriate teachers.

## Future Features
- Learning credits
    - Every week given 2 credits
    - 1 hour lesson costs 1 credit
    - Teaching 1 hour earns you 1 credit
    - Users can buy more credits if they wish
- Community guidelines
- Reporting on teacher/learner no-shows/inappropriate behavior
- Map/Stats on what learning/teaching activity around your area
- Consistency and progress badges

## Future Backend Features:
- Delete availability data from the past
- Setup github secrets for env variables

## Bugs to fix
- Generated Meets link might not work
- User is routed to profile setup screen before dashboard
