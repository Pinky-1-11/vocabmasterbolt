import React, { useState, useEffect } from 'react';
import { Library as LibraryIcon, Trash2, BookOpen, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './Library.css';

function Library() {
  const [vocabularyLists, setVocabularyLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [pdfDisplayMethod, setPdfDisplayMethod] = useState(null); // 'object', 'download', 'error'

  useEffect(() => {
    loadVocabularyLists();
  }, []);

  // PDF automatisch generieren wenn Liste ausgewählt wird
  useEffect(() => {
    if (selectedList) {
      generatePDF(selectedList);
    } else {
      // Cleanup wenn keine Liste ausgewählt
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
        setPdfDisplayMethod(null);
      }
    }

    // Cleanup beim Unmount
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [selectedList]);

  const loadVocabularyLists = () => {
    const lists = JSON.parse(localStorage.getItem('vocabulary_lists') || '[]');
    setVocabularyLists(lists);
  };

  const generatePDF = (list) => {
    console.log('=== GENERATING PDF WITH CHROME COMPATIBILITY ===');
    
    if (!list || !list.vocabularyPairs || list.vocabularyPairs.length === 0) {
      console.error('No vocabulary pairs found!');
      setPdfDisplayMethod('error');
      return;
    }

    try {
      console.log('Creating jsPDF instance...');
      const doc = new jsPDF();
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const leftColumnWidth = 80;
      const rightColumnStart = margin + leftColumnWidth + 10;
      const lineHeight = 12;
      const startY = 60;
      const maxLinesPerPage = Math.floor((pageHeight - startY - 20) / lineHeight);

      let currentY = startY;

      const addHeader = () => {
        // Titel
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Vokabeltest', pageWidth / 2, 20, { align: 'center' });

        // Listenname
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(list.name, pageWidth / 2, 32, { align: 'center' });

        // Datum
        doc.setFontSize(10);
        const dateStr = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        doc.text(`Datum: ${dateStr}`, pageWidth / 2, 42, { align: 'center' });

        // Spaltenüberschriften
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Deutsch', margin, 52);
        doc.text('Englisch (zum Ausfüllen)', rightColumnStart, 52);

        // Trennlinie unter Überschriften
        doc.setLineWidth(0.5);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, 54, pageWidth - margin, 54);
      };

      // Erste Seite Header
      addHeader();

      // Vokabeln durchgehen
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      list.vocabularyPairs.forEach((pair, index) => {
        // Neue Seite wenn nötig
        if (index > 0 && index % maxLinesPerPage === 0) {
          doc.addPage();
          currentY = startY;
          addHeader();
        }

        // Deutsche Vokabel (links)
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${pair.german}`, margin, currentY);

        // Linie zum Ausfüllen (rechts)
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(rightColumnStart, currentY + 1, pageWidth - margin, currentY + 1);

        // Vertikale Trennlinie zwischen Spalten
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        doc.line(margin + leftColumnWidth + 5, currentY - 8, margin + leftColumnWidth + 5, currentY + 2);

        currentY += lineHeight;
      });

      // PDF als Blob erstellen mit EXPLIZITEM MIME-TYPE
      console.log('Creating PDF blob with explicit MIME type...');
      const pdfOutput = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
      console.log('PDF blob created:', pdfBlob);
      console.log('Blob type:', pdfBlob.type);
      console.log('Blob size:', pdfBlob.size, 'bytes');
      
      // Alten Blob URL aufräumen
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      // Neuen Blob URL erstellen
      const blobUrl = URL.createObjectURL(pdfBlob);
      console.log('Blob URL created:', blobUrl);
      
      // State aktualisieren
      setPdfBlobUrl(blobUrl);
      setPdfDisplayMethod('object'); // Versuche zuerst object-Tag
      
      console.log('=== PDF GENERATION COMPLETE ===');
      
    } catch (error) {
      console.error('=== PDF GENERATION ERROR ===');
      console.error('Error details:', error);
      console.error('Error stack:', error.stack);
      setPdfDisplayMethod('error');
    }
  };

  const handleManualDownload = () => {
    if (!pdfBlobUrl) return;
    
    console.log('=== MANUAL DOWNLOAD TRIGGERED ===');
    
    try {
      // Erstelle temporären Link
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = `${selectedList.name}_Vokabeltest.pdf`;
      link.target = '_blank'; // Öffne in neuem Tab
      
      // Füge zum DOM hinzu (für Firefox)
      document.body.appendChild(link);
      
      // Trigger Download
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      console.log('Download triggered successfully');
      setPdfDisplayMethod('download');
      
    } catch (error) {
      console.error('Download error:', error);
      setPdfDisplayMethod('error');
    }
  };

  const handleDeleteList = (listId) => {
    if (window.confirm('Möchten Sie diese Vokabelliste wirklich löschen?')) {
      const updatedLists = vocabularyLists.filter(list => list.id !== listId);
      localStorage.setItem('vocabulary_lists', JSON.stringify(updatedLists));
      setVocabularyLists(updatedLists);
      if (selectedList?.id === listId) {
        setSelectedList(null);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="header-content">
          <LibraryIcon size={32} />
          <div>
            <h1>Vokabelbibliothek</h1>
            <p>Alle gespeicherten Vokabellisten</p>
          </div>
        </div>
      </div>

      {vocabularyLists.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.5} />
          <h2>Keine Vokabellisten vorhanden</h2>
          <p>Erstellen Sie Ihre erste Vokabelliste im Extraktor</p>
        </div>
      ) : (
        <div className="library-content">
          <div className="lists-sidebar">
            <h2>Gespeicherte Listen ({vocabularyLists.length})</h2>
            <div className="lists-grid">
              {vocabularyLists.map((list) => (
                <div
                  key={list.id}
                  className={`list-card ${selectedList?.id === list.id ? 'active' : ''}`}
                  onClick={() => setSelectedList(list)}
                >
                  <div className="list-card-header">
                    <h3>{list.name}</h3>
                    <div className="list-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteList(list.id);
                        }}
                        className="delete-btn"
                        title="Liste löschen"
                        type="button"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="list-card-info">
                    <span className="vocab-count">
                      {list.vocabularyPairs.length} Vokabelpaare
                    </span>
                    <span className="created-date">
                      {formatDate(list.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="vocabulary-display">
            {selectedList ? (
              <>
                <div className="display-header">
                  <h2>{selectedList.name}</h2>
                  <div className="header-actions">
                    <span className="vocab-count-badge">
                      {selectedList.vocabularyPairs.length} Vokabelpaare
                    </span>
                  </div>
                </div>

                {/* PDF VIEWER WITH FALLBACK STRATEGIES */}
                {pdfBlobUrl && (
                  <div className="pdf-viewer-container">
                    <div className="pdf-viewer-header">
                      <h3>📄 Vokabeltest-Vorschau</h3>
                      
                      {pdfDisplayMethod === 'object' && (
                        <p className="pdf-hint">
                          <strong>Embedded-Ansicht:</strong> Die PDF wird direkt angezeigt. 
                          Falls die Anzeige nicht funktioniert, nutzen Sie den Download-Button unten.
                        </p>
                      )}
                      
                      {pdfDisplayMethod === 'download' && (
                        <p className="pdf-hint success">
                          <strong>✓ Download gestartet:</strong> Die PDF wurde in einem neuen Tab geöffnet.
                        </p>
                      )}
                      
                      {pdfDisplayMethod === 'error' && (
                        <p className="pdf-hint error">
                          <strong>⚠ Fehler:</strong> PDF konnte nicht generiert werden.
                        </p>
                      )}

                      <div className="pdf-actions">
                        <button 
                          onClick={handleManualDownload}
                          className="download-btn-primary"
                          type="button"
                        >
                          <Download size={18} />
                          PDF in neuem Tab öffnen
                        </button>
                      </div>
                    </div>

                    {/* PRIMARY: OBJECT TAG (Chrome-kompatibel) */}
                    {pdfDisplayMethod === 'object' && (
                      <object
                        data={pdfBlobUrl}
                        type="application/pdf"
                        className="pdf-viewer-object"
                        aria-label="Vokabeltest PDF Vorschau"
                      >
                        <div className="pdf-fallback-message">
                          <ExternalLink size={48} strokeWidth={1.5} />
                          <h4>PDF kann nicht angezeigt werden</h4>
                          <p>Ihr Browser unterstützt keine eingebetteten PDFs.</p>
                          <button 
                            onClick={handleManualDownload}
                            className="download-btn-fallback"
                            type="button"
                          >
                            <Download size={18} />
                            PDF in neuem Tab öffnen
                          </button>
                        </div>
                      </object>
                    )}
                  </div>
                )}

                {/* VOCABULARY TABLE */}
                <div className="vocabulary-table-section">
                  <h3 className="section-title">📚 Vokabelliste</h3>
                  <div className="vocabulary-table">
                    <div className="table-header">
                      <div className="header-cell">Deutsch</div>
                      <div className="header-cell">Englisch</div>
                    </div>
                    <div className="table-body">
                      {selectedList.vocabularyPairs.map((pair, index) => (
                        <div key={index} className="table-row">
                          <div className="table-cell german">{pair.german}</div>
                          <div className="table-cell english">{pair.english}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="select-prompt">
                <AlertCircle size={48} strokeWidth={1.5} />
                <h3>Wählen Sie eine Vokabelliste aus</h3>
                <p>Klicken Sie auf eine Liste links, um die Vokabeln und PDF-Vorschau anzuzeigen</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
