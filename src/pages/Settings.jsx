import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle, AlertCircle, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Settings.css';

function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_settings')
        .select('gemini_api_key')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading API key:', error);
        return;
      }

      if (data) {
        setApiKey(data.gemini_api_key);
      }
    } catch (err) {
      console.error('Error loading API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setSaveStatus('error');
      setStatusMessage('Bitte geben Sie einen API-Schlüssel ein.');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    try {
      // Delete old API keys
      await supabase.from('api_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert new API key
      const { error } = await supabase
        .from('api_settings')
        .insert([{ gemini_api_key: apiKey.trim() }]);

      if (error) throw error;

      setSaveStatus('success');
      setStatusMessage('API-Schlüssel erfolgreich gespeichert!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('Error saving API key:', err);
      setSaveStatus('error');
      setStatusMessage('Fehler beim Speichern des API-Schlüssels.');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleClear = async () => {
    if (window.confirm('Möchten Sie den gespeicherten API-Schlüssel wirklich löschen?')) {
      try {
        await supabase.from('api_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        setApiKey('');
        setSaveStatus('success');
        setStatusMessage('API-Schlüssel wurde gelöscht.');
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        console.error('Error deleting API key:', err);
        setSaveStatus('error');
        setStatusMessage('Fehler beim Löschen des API-Schlüssels.');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-card">
          <p>Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-header">
          <div className="settings-icon">
            <Key size={32} strokeWidth={1.5} />
          </div>
          <h2>API-Einstellungen</h2>
          <p>Konfigurieren Sie Ihren Gemini API-Schlüssel</p>
        </div>

        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label htmlFor="apiKey" className="label">
              <Key size={20} />
              <span>Gemini API-Schlüssel</span>
            </label>
            
            <div className="input-wrapper">
              <input
                id="apiKey"
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Geben Sie Ihren API-Schlüssel ein..."
                className="input"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="toggle-visibility-btn"
                aria-label={showApiKey ? 'API-Schlüssel verbergen' : 'API-Schlüssel anzeigen'}
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="help-box">
              <p className="help-text">
                Ihr API-Schlüssel wird sicher in der Datenbank gespeichert und niemals an Dritte weitergegeben.
              </p>
              <a 
                href="https://aistudio.google.com/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="help-link"
              >
                <ExternalLink size={16} />
                API-Schlüssel bei Google AI Studio erhalten
              </a>
            </div>
          </div>

          {saveStatus && (
            <div className={`status-message ${saveStatus}`}>
              {saveStatus === 'success' ? (
                <CheckCircle size={20} />
              ) : (
                <AlertCircle size={20} />
              )}
              <span>{statusMessage}</span>
            </div>
          )}

          <div className="button-group">
            <button
              type="submit"
              className="save-btn"
            >
              <Save size={20} />
              <span>Speichern</span>
            </button>
            
            {apiKey && (
              <button
                type="button"
                onClick={handleClear}
                className="clear-btn"
              >
                Löschen
              </button>
            )}
          </div>
        </form>

        <div className="info-section">
          <h3>Über den API-Schlüssel</h3>
          <ul className="info-list">
            <li>Der API-Schlüssel wird sicher in der Datenbank gespeichert</li>
            <li>Er wird für alle Bildanalysen mit Gemini 2.0 Flash verwendet</li>
            <li>Sie können den Schlüssel jederzeit ändern oder löschen</li>
            <li>Teilen Sie Ihren API-Schlüssel niemals mit anderen</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Settings;
