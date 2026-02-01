import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ScanPage from './pages/ScanPage';
import Library from './pages/Library';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/scan-page" replace />} />
        <Route path="/scan-page" element={<ScanPage />} />
        <Route path="/library" element={<Library />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

export default App;
