import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Upload, Send, BookOpen, Sparkles, AlertCircle, Loader2, Settings as SettingsIcon, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Analyzer.css';

function Analyzer() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [listName, setListName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const fileInputRef = useRef(null);

  // Fester Prompt für Vokabellisten-Extraktion
  const VOCABULARY_PROMPT = 'Bei diesem Bild handelt es sich um eine Vokabelliste aus einem englisch Buch. Gib die Dargestellten Vokabeln in einer CSV-Datei aus. Stelle die Vokabeln jeweils in Paaren zusammen. Erst die deutsche Vokabel, dann die englische. Ignoriere die Beschreibungen und die Lautschrift.';

  useEffect(() => {
    // API-Schlüssel aus localStorage laden
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Bitte wählen Sie eine gültige Bilddatei aus.');
        return;
      }
      
      setImage(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const parseCSVToVocabulary = (csvText) => {
    const lines = csvText.trim().split('\n');
    const vocabularyPairs = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        const parts = trimmedLine.split(',');
        if (parts.length >= 2) {
          vocabularyPairs.push({
            german: parts[0].trim(),
            english: parts[1].trim()
          });
        }
      }
    }

    return vocabularyPairs;
  };

  const handleSaveVocabulary = () => {
    if (!listName.trim()) {
      setError('Bitte geben Sie einen Namen für die Vokabelliste ein.');
      return;
    }

    if (!response) {
      setError('Keine Vokabeln zum Speichern vorhanden.');
      return;
    }

    try {
      const vocabularyPairs = parseCSVToVocabulary(response);
      
      if (vocabularyPairs.length === 0) {
        setError('Keine gültigen Vokabelpaare gefunden.');
        return;
      }

      // Bestehende Listen laden
      const existingLists = JSON.parse(localStorage.getItem('vocabulary_lists') || '[]');
      
      // Neue Liste hinzufügen
      const newList = {
        id: Date.now().toString(),
        name: listName.trim(),
        vocabularyPairs: vocabularyPairs,
        createdAt: new Date().toISOString(),
        csvRaw: response
      };

      existingLists.push(newList);
      localStorage.setItem('vocabulary_lists', JSON.stringify(existingLists));

      // Erfolgsmeldung und Reset
      alert(`Vokabelliste "${listName}" erfolgreich gespeichert! (${vocabularyPairs.length} Vokabelpaare)`);
      setShowSaveDialog(false);
      setListName('');
      
    } catch (err) {
      console.error('Error saving vocabulary:', err);
      setError('Fehler beim Speichern der Vokabelliste.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!apiKey) {
      setError('Bitte konfigurieren Sie zuerst Ihren API-Schlüssel in den Einstellungen.');
      return;
    }
    
    if (!image) {
      setError('Bitte laden Sie ein Bild hoch.');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');
    setShowSaveDialog(false);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const imagePart = await fileToGenerativePart(image);
      
      const result = await model.generateContent([VOCABULARY_PROMPT, imagePart]);
      const text = result.response.text();
      
      setResponse(text);
    } catch (err) {
      console.error('Error:', err);
      setError(
        err.message.includes('API_KEY_INVALID') 
          ? 'Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihren API-Schlüssel in den Einstellungen.'
          : `Fehler bei der Verarbeitung: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {!apiKey && (
        <div className="warning-banner">
          <AlertCircle size={20} />
          <span>Kein API-Schlüssel konfiguriert.</span>
          <Link to="/settings" className="settings-link">
            <SettingsIcon size={16} />
            Zu den Einstellungen
          </Link>
        </div>
      )}

      <div className="info-banner">
        <BookOpen size={20} />
        <div className="info-content">
          <strong>Vokabellisten-Extraktor</strong>
          <p>Laden Sie ein Bild einer Vokabelliste hoch und erhalten Sie die Vokabeln als CSV-Datei (Deutsch → Englisch)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form">
        <div className="upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="file-input"
            id="file-upload"
          />
          
          {!imagePreview ? (
            <label htmlFor="file-upload" className="upload-area">
              <div className="upload-content">
                <div className="upload-icon">
                  <Upload size={48} strokeWidth={1.5} />
                </div>
                <h3>Vokabelliste hochladen</h3>
                <p>Klicken Sie hier oder ziehen Sie ein Bild hierher</p>
                <span className="upload-hint">PNG, JPG, GIF bis zu 10MB</span>
              </div>
            </label>
          ) : (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                  setResponse('');
                  setShowSaveDialog(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="remove-image-btn"
              >
                Bild entfernen
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !apiKey || !image}
          className="submit-btn"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="spinner" />
              <span>Extrahiere Vokabeln...</span>
            </>
          ) : (
            <>
              <Send size={20} />
              <span>Vokabeln extrahieren</span>
            </>
          )}
        </button>
      </form>

      {response && (
        <div className="response-section">
          <div className="response-header">
            <Sparkles size={24} />
            <h2>Extrahierte Vokabeln</h2>
          </div>
          <div className="response-content">
            <pre className="csv-output">{response}</pre>
          </div>
          
          <div className="action-buttons">
            <button
              onClick={() => {
                navigator.clipboard.writeText(response);
                alert('CSV-Daten in die Zwischenablage kopiert!');
              }}
              className="copy-btn"
            >
              In Zwischenablage kopieren
            </button>
            
            <button
              onClick={() => setShowSaveDialog(true)}
              className="save-btn"
            >
              <Save size={20} />
              <span>Vokabelliste speichern</span>
            </button>
          </div>

          {showSaveDialog && (
            <div className="save-dialog">
              <h3>Vokabelliste speichern</h3>
              <input
                type="text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Name der Vokabelliste eingeben..."
                className="list-name-input"
                autoFocus
              />
              <div className="dialog-buttons">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setListName('');
                  }}
                  className="cancel-btn"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSaveVocabulary}
                  className="confirm-save-btn"
                >
                  <Save size={18} />
                  <span>Speichern</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Analyzer;
