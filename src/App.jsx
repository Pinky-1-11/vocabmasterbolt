import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Analyzer from './pages/Analyzer';
import Library from './pages/Library';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Analyzer />} />
        <Route path="library" element={<Library />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
