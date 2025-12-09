// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Check if user is logged in by checking localStorage
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }
  
  // User is logged in, show the protected page
  return <>{children}</>;
};


// ============================================
// OPTIONAL: PublicRoute - Redirects logged-in users away from login/signup
// ============================================

export const PublicRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Already logged in, redirect to main page
    return <Navigate to="/command-center" replace />;
  }
  
  // Not logged in, show the public page (login/signup)
  return <>{children}</>;
};