import { Navigate } from 'react-router';
import React from 'react';
import { LayoutWithSidebar } from './LayoutWithSidebar';
import { getValidToken } from '../utils/jwt';

interface ProtectedRouteProps {
  children: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = getValidToken();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
};
