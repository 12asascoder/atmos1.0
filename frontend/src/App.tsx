import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import CommandCenter from './pages/CommandCenter';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Signup';
import MarketingOSLanding from './pages/Home';
import OnboardingPage from './components/OnBoarding';

function App() {
  return (
    <Router>
      <Routes>
        {/* LANDING PAGE - Public route */}
        <Route 
          path="/" 
          element={<MarketingOSLanding />} 
        />

        {/* PUBLIC ROUTES - Redirect to /command-center if already logged in */}
        <Route 
          path="/login" 
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

        {/* ONBOARDING ROUTE - Protected, shows after signup */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
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
        
        {/* Alias for command-center */}
        <Route 
          path="/dashboard" 
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

        {/* FALLBACK - Redirect unknown routes to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;