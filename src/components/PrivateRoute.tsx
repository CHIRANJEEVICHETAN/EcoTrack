import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function PrivateRoute({ children, adminOnly = false }: PrivateRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && currentUser.email !== 'admin@ecotrack.com') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}