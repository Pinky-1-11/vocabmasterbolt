import React, { useState, useEffect } from 'react';
import { Library as LibraryIcon, Trash2, BookOpen, AlertCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import './Library.css';

function Library() {
  const [vocabularyLists, setVocabularyLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    loadVocabularyLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      generatePDF(selectedList);
    } else {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
    }

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

  const calculateGradingScale = (totalPoints) => {
    // NRW Gymnasium Notenskala (Prozentsätze)
    const gradePercentages = [
      { grade: '1 (sehr gut)', min: 87, max: 100 },
      { grade: '2 (gut)', min: 73, max: 86 },
      { grade: '3 (befriedigend)', min: 59, max: 72 },
      { grade: '4 (ausreichend)', min: 45, max: 58 },
      { grade: '5 (mangelhaft)', min: 18, max: 44 },
      { grade: '6 (ungenügend)', min: 0, max: 17 }
    ];

    return gradePercentages.map(({ grade, min, max }) => {
      const minPoints = Math.ceil((min / 100) * totalPoints);
      const maxPoints = Math.floor((max / 100) * totalPoints);
      return {
        grade,
        pointRange: minPoints === maxPoints ? `${minPoints}` : `${minPoints} - ${maxPoints}`,
        minPoints,
        maxPoints
      };
    });
  };

  const generatePDF = (list) => {
    if (!list || !list.vocabularyPairs || list.vocabularyPairs.length === 0) {
      return;
    }

    try {
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
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('Vokabeltest', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(list.name, pageWidth / 2, 32, { align: 'center' });

        doc.setFontSize(10);
        const dateStr = new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        doc.text(`Datum: ${dateStr}`, pageWidth / 2, 42, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Deutsch', margin, 52);
        doc.text('Englisch (zum Ausfüllen)', rightColumnStart, 52);

        doc.setLineWidth(0.5);
        doc.setDrawColor(100, 100, 100);
        doc.line(margin, 54, pageWidth - margin, 54);
      };

      addHeader();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      list.vocabularyPairs.forEach((pair, index) => {
        if (index > 0 && index % maxLinesPerPage === 0) {
          doc.addPage();
          currentY = startY;
          addHeader();
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${pair.german}`, margin, currentY);

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(rightColumnStart, currentY + 1, pageWidth - margin, currentY + 1);

        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.2);
        doc.line(margin + leftColumnWidth + 5, currentY - 8, margin + leftColumnWidth + 5, currentY + 2);

        currentY += lineHeight;
      });

      // Add grading scale section
      const totalPoints = list.vocabularyPairs.length;
      const gradingScale = calculateGradingScale(totalPoints);

      // Add some space before grading scale
      currentY += 15;

      // Check if we need a new page for grading scale
      const gradingScaleHeight = 80; // Approximate height needed
      if (currentY + gradingScaleHeight > pageHeight - 20) {
        doc.addPage();
        currentY = 30;
      }

      // Grading scale title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Bewertungsschlüssel (NRW Gymnasium)', margin, currentY);
      currentY += 10;

      // Total points info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gesamtpunktzahl: ${totalPoints} Punkte`, margin, currentY);
      currentY += 8;

      // Grading scale table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      // Table headers
      const col1X = margin;
      const col2X = margin + 50;
      doc.text('Note', col1X, currentY);
      doc.text('Punkte', col2X, currentY);
      currentY += 2;

      // Header line
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.line(margin, currentY, margin + 100, currentY);
      currentY += 5;

      // Table rows
      doc.setFont('helvetica', 'normal');
      gradingScale.forEach((item) => {
        doc.text(item.grade, col1X, currentY);
        doc.text(item.pointRange, col2X, currentY);
        currentY += 6;
      });

      // Add fields for grade and error count
      currentY += 10;

      // Box for results
      doc.setLineWidth(0.5);
      doc.setDrawColor(100, 100, 100);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 25);

      currentY += 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Note field
      doc.text('Note:', margin + 5, currentY);
      doc.setFont('helvetica', 'normal');
      doc.line(margin + 25, currentY + 1, margin + 60, currentY + 1);

      // Fehleranzahl field
      doc.text('Fehleranzahl:', pageWidth / 2 + 10, currentY);
      doc.line(pageWidth / 2 + 45, currentY + 1, pageWidth / 2 + 80, currentY + 1);

      currentY += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Erreichte Punktzahl:', margin + 5, currentY);
      doc.setFont('helvetica', 'normal');
      doc.line(margin + 45, currentY + 1, margin + 80, currentY + 1);

      const pdfOutput = doc.output('arraybuffer');
      const pdfBlob = new Blob([pdfOutput], { type: 'application/pdf' });
      
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      setPdfBlobUrl(blobUrl);
      
    } catch (error) {
      console.error('PDF generation error:', error);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfBlobUrl || !selectedList) return;
    
    const link = document.createElement('a');
    link.href = pdfBlobUrl;
    link.download = `${selectedList.name}_Vokabeltest.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
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
            <p>Alle gespeicherten Vokabellisten und Scans</p>
          </div>
        </div>
      </div>

      {vocabularyLists.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.5} />
          <h2>Keine Vokabellisten vorhanden</h2>
          <p>Erstellen Sie Ihre erste Vokabelliste auf der Scan Page</p>
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
                  {list.imagePreview && (
                    <div className="list-card-image">
                      <img src={list.imagePreview} alt={list.name} />
                    </div>
                  )}
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
                    {pdfBlobUrl && (
                      <button 
                        onClick={handleDownloadPDF}
                        className="download-btn-primary"
                        type="button"
                      >
                        <Download size={18} />
                        PDF herunterladen
                      </button>
                    )}
                  </div>
                </div>

                {selectedList.imagePreview && (
                  <div className="scanned-image-section">
                    <h3 className="section-title">📸 Gescanntes Bild</h3>
                    <div className="scanned-image-container">
                      <img src={selectedList.imagePreview} alt={selectedList.name} />
                    </div>
                  </div>
                )}

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
                <p>Klicken Sie auf eine Liste links, um die Details anzuzeigen</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
