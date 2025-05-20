import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Onboarding from './pages/Onboarding';
import SkillSelection from './pages/SkillSelection';
import TeachingSkills from './pages/TeachingSkills';
import ProfileSetup from './pages/ProfileSetup';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Community from './pages/Community';
import './App.css';
import Profile from './pages/Profile';

function App() {
  const [user, loading] = useAuthState(auth);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const db = getFirestore();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setOnboardingCompleted(userDoc.exists() && userDoc.data().onboarding_completed === true);
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      } else {
        setOnboardingCompleted(false);
      }
      setCheckingOnboarding(false);
    };

    checkOnboardingStatus();
  }, [user, db]);

  // Show loading state until we have both auth state and onboarding status
  if (loading || checkingOnboarding || (user && onboardingCompleted === undefined)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {!user ? (
            // Unauthenticated user routes
            <Route path="*" element={<Onboarding />} />
          ) : onboardingCompleted ? (
            // Authenticated user with completed onboarding
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/profile-setup" element={<Navigate to="/dashboard" replace />} />
              <Route path="/skills" element={<SkillSelection />} />
              <Route path="/teaching-skills" element={<TeachingSkills />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/community" element={<Community />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            // Authenticated user without completed onboarding
            <>
              <Route path="/" element={<Navigate to="/profile-setup" replace />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/skills" element={<SkillSelection />} />
              <Route path="/teaching-skills" element={<TeachingSkills />} />
              <Route path="/dashboard" element={<Navigate to="/profile-setup" replace />} />
              <Route path="/schedule" element={<Navigate to="/profile-setup" replace />} />
              <Route path="/community" element={<Navigate to="/profile-setup" replace />} />
              <Route path="/profile" element={<Navigate to="/profile-setup" replace />} />
              <Route path="*" element={<Navigate to="/profile-setup" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
