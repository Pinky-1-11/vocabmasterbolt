import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, BookOpen, Sparkles, ScanLine } from 'lucide-react';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles size={32} strokeWidth={2} />
          </div>
          <h1 className="sidebar-title">Vokabel<br/>Extraktor</h1>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-top">
            <Link 
              to="/scan-page" 
              className={`nav-item ${isActive('/scan-page') ? 'active' : ''}`}
            >
              <ScanLine size={20} />
              <span>Scan Page</span>
            </Link>
            
            <Link 
              to="/library" 
              className={`nav-item ${isActive('/library') ? 'active' : ''}`}
            >
              <BookOpen size={20} />
              <span>Bibliothek</span>
            </Link>
          </div>

          <div className="nav-bottom">
            <Link 
              to="/settings" 
              className={`nav-item ${isActive('/settings') ? 'active' : ''}`}
            >
              <Settings size={20} />
              <span>Einstellungen</span>
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <p>MRU (c) 2026</p>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
