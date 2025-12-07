import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CommandCenter from './pages/CommandCenter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/command-center" replace />} />
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