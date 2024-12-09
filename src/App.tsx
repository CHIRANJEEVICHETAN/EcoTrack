import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TrackEWaste from './pages/TrackEWaste';
import RecyclingVendors from './pages/RecyclingVendors';
import Reports from './pages/Reports';
import UserProfile from './pages/UserProfile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VendorSignup from './pages/VendorSignup';
import ForgotPassword from './pages/ForgotPassword';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import TrackSubmission from './pages/TrackSubmission';
import Feedback from './pages/Feedback';

function App() {
  console.log('App component rendered');
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/vendor-signup" element={<VendorSignup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route
                  path="/track"
                  element={
                    <PrivateRoute>
                      <TrackEWaste />
                    </PrivateRoute>
                  }
                />
                <Route path="/vendors" element={<RecyclingVendors />} />
                <Route
                  path="/reports"
                  element={
                    <PrivateRoute>
                      <Reports />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <UserProfile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminDashboard />
                    </PrivateRoute>
                  }
                />
                <Route path="/track-submission/:id?" element={<TrackSubmission />} />
                <Route path="/feedback" element={<Feedback />} />
              </Routes>
            </main>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;