import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, Settings as SettingsIcon, Languages, Library as LibraryIcon } from 'lucide-react';
import './Layout.css';

function Layout() {
  const location = useLocation();

  return (
    <div className="app">
      <div className="background-gradient"></div>
      
      <header className="header">
        <div className="header-content">
          <div className="header-icon">
            <Languages size={48} strokeWidth={1.5} />
          </div>
          <div className="header-text">
            <h1>Vokabellisten-Extraktor</h1>
            <p>Extrahieren Sie Vokabeln aus Bildern mit Gemini 2.0 Flash</p>
          </div>
        </div>
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <BookOpen size={20} />
            <span>Extraktor</span>
          </Link>
          <Link 
            to="/library" 
            className={`nav-link ${location.pathname === '/library' ? 'active' : ''}`}
          >
            <LibraryIcon size={20} />
            <span>Bibliothek</span>
          </Link>
          <Link 
            to="/settings" 
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
          >
            <SettingsIcon size={20} />
            <span>Einstellungen</span>
          </Link>
        </nav>
        <div className="header-decoration"></div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <p>Powered by Google Gemini 2.0 Flash • Erstellt mit React & Vite</p>
      </footer>
    </div>
  );
}

export default Layout;
