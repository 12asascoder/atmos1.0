import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import CommandCenter from './pages/CommandCenter';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES - Redirect to /command-center if already logged in */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } 
        />
        
        <Route 
          path="/sign-up" 
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          } 
        />

        {/* PROTECTED ROUTES - Require authentication */}
        <Route 
          path="/command-center" 
          element={
            <ProtectedRoute>
              <CommandCenter />
            </ProtectedRoute>
          } 
        />

        {/* Add more protected routes here as needed */}
        {/* 
        <Route 
          path="/performance" 
          element={
            <ProtectedRoute>
              <Performance />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/audience" 
          element={
            <ProtectedRoute>
              <Audience />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/market" 
          element={
            <ProtectedRoute>
              <Market />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quick-launch" 
          element={
            <ProtectedRoute>
              <QuickLaunch />
            </ProtectedRoute>
          } 
        />
        */}

        {/* FALLBACK - Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;