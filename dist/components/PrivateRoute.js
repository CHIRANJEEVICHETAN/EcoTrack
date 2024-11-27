import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export default function PrivateRoute({ children, adminOnly = false }) {
    const { currentUser } = useAuth();
    if (!currentUser) {
        return React.createElement(Navigate, { to: "/login" });
    }
    if (adminOnly && currentUser.email !== 'admin@ecotrack.com') {
        return React.createElement(Navigate, { to: "/" });
    }
    return React.createElement(React.Fragment, null, children);
}
