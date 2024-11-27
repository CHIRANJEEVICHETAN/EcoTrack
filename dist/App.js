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
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import TrackSubmission from './pages/TrackSubmission';
function App() {
    console.log('App component rendered');
    return (React.createElement(AuthProvider, null,
        React.createElement(ThemeProvider, null,
            React.createElement(Router, null,
                React.createElement("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200" },
                    React.createElement(Navbar, null),
                    React.createElement("main", { className: "container mx-auto px-4 py-8" },
                        React.createElement(Routes, null,
                            React.createElement(Route, { path: "/", element: React.createElement(Home, null) }),
                            React.createElement(Route, { path: "/login", element: React.createElement(Login, null) }),
                            React.createElement(Route, { path: "/signup", element: React.createElement(Signup, null) }),
                            React.createElement(Route, { path: "/track", element: React.createElement(PrivateRoute, null,
                                    React.createElement(TrackEWaste, null)) }),
                            React.createElement(Route, { path: "/vendors", element: React.createElement(RecyclingVendors, null) }),
                            React.createElement(Route, { path: "/reports", element: React.createElement(PrivateRoute, null,
                                    React.createElement(Reports, null)) }),
                            React.createElement(Route, { path: "/profile", element: React.createElement(PrivateRoute, null,
                                    React.createElement(UserProfile, null)) }),
                            React.createElement(Route, { path: "/admin", element: React.createElement(PrivateRoute, null,
                                    React.createElement(AdminDashboard, null)) }),
                            React.createElement(Route, { path: "/track-submission/:id?", element: React.createElement(TrackSubmission, null) }))))))));
}
export default App;
