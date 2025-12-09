import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CommandCenter from './pages/CommandCenter';
import LoginPage from './pages/Login';
import SignUpPage from './pages/Signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/command-center" element={<CommandCenter />} />
        {/* Add more routes here as needed */}
        {/* <Route path="/performance" element={<Performance />} /> */}
        {/* <Route path="/audience" element={<Audience />} /> */}
        {/* <Route path="/market" element={<Market />} /> */}
        {/* <Route path="/quick-launch" element={<QuickLaunch />} /> */}
      </Routes>
    </Router>
  );
}

export default App;