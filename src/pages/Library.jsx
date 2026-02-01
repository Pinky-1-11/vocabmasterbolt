import React, { useState, useEffect } from 'react';
import { Library as LibraryIcon, Plus, BookOpen, AlertCircle, ArrowLeft, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Library.css';

function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [vocabularyPages, setVocabularyPages] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreateBookDialog, setShowCreateBookDialog] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookCover, setNewBookCover] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedBooks = JSON.parse(localStorage.getItem('vocabulary_books') || '[]');
    const savedPages = JSON.parse(localStorage.getItem('vocabulary_lists') || '[]');
    setBooks(savedBooks);
    setVocabularyPages(savedPages);
  };

  const handleCreateBook = () => {
    if (!newBookName.trim()) {
      alert('Bitte geben Sie einen Buchnamen ein');
      return;
    }

    const newBook = {
      id: Date.now().toString(),
      name: newBookName.trim(),
      cover: newBookCover,
      pageIds: [],
      createdAt: new Date().toISOString()
    };

    const updatedBooks = [...books, newBook];
    localStorage.setItem('vocabulary_books', JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    setShowCreateBookDialog(false);
    setNewBookName('');
    setNewBookCover(null);
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewBookCover(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e, page) => {
    setDraggedPage(page);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnBook = (e, book) => {
    e.preventDefault();
    if (!draggedPage) return;

    // Check if page is already assigned to this book
    if (book.pageIds.includes(draggedPage.id)) {
      setDraggedPage(null);
      return;
    }

    // Remove page from other books
    const updatedBooks = books.map(b => ({
      ...b,
      pageIds: b.pageIds.filter(id => id !== draggedPage.id)
    }));

    // Add page to target book
    const targetBook = updatedBooks.find(b => b.id === book.id);
    if (targetBook) {
      targetBook.pageIds.push(draggedPage.id);
    }

    localStorage.setItem('vocabulary_books', JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
    setDraggedPage(null);
  };

  const handleRemovePageFromBook = (bookId, pageId) => {
    const updatedBooks = books.map(book => {
      if (book.id === bookId) {
        return {
          ...book,
          pageIds: book.pageIds.filter(id => id !== pageId)
        };
      }
      return book;
    });

    localStorage.setItem('vocabulary_books', JSON.stringify(updatedBooks));
    setBooks(updatedBooks);
  };

  const handleDeleteBook = (bookId) => {
    if (window.confirm('Möchten Sie dieses Buch wirklich löschen? Die Vokabelseiten bleiben erhalten.')) {
      const updatedBooks = books.filter(book => book.id !== bookId);
      localStorage.setItem('vocabulary_books', JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
      if (selectedBook?.id === bookId) {
        setSelectedBook(null);
      }
    }
  };

  const getUnassignedPages = () => {
    const assignedPageIds = new Set();
    books.forEach(book => {
      book.pageIds.forEach(id => assignedPageIds.add(id));
    });
    return vocabularyPages.filter(page => !assignedPageIds.has(page.id));
  };

  const getBookPages = (book) => {
    return book.pageIds
      .map(id => vocabularyPages.find(page => page.id === id))
      .filter(page => page !== undefined);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (selectedBook) {
    const bookPages = getBookPages(selectedBook);
    
    return (
      <div className="library-container">
        <div className="book-detail-header">
          <button 
            onClick={() => setSelectedBook(null)}
            className="back-button"
            type="button"
          >
            <ArrowLeft size={20} />
            Zurück zur Bibliothek
          </button>
        </div>

        <div className="book-detail-content">
          <div className="book-detail-info">
            {selectedBook.cover && (
              <div className="book-detail-cover">
                <img src={selectedBook.cover} alt={selectedBook.name} />
              </div>
            )}
            <h1>{selectedBook.name}</h1>
            <p className="book-page-count">{bookPages.length} Vokabelseiten</p>
          </div>

          <div className="book-pages-section">
            <h2>Zugeordnete Vokabelseiten</h2>
            {bookPages.length === 0 ? (
              <div className="empty-book-state">
                <BookOpen size={48} strokeWidth={1.5} />
                <p>Noch keine Vokabelseiten zugeordnet</p>
                <p className="hint">Gehen Sie zurück zur Bibliothek und ziehen Sie Seiten per Drag & Drop auf dieses Buch</p>
              </div>
            ) : (
              <div className="book-pages-grid">
                {bookPages.map((page) => (
                  <div key={page.id} className="book-page-card">
                    {page.imagePreview && (
                      <div className="book-page-image">
                        <img src={page.imagePreview} alt={page.name} />
                      </div>
                    )}
                    <div className="book-page-info">
                      <h3>{page.name}</h3>
                      <span className="vocab-count">
                        {page.vocabularyPairs.length} Vokabelpaare
                      </span>
                      <button
                        onClick={() => handleRemovePageFromBook(selectedBook.id, page.id)}
                        className="remove-page-btn"
                        title="Seite entfernen"
                        type="button"
                      >
                        <X size={16} />
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const unassignedPages = getUnassignedPages();

  return (
    <div className="library-container">
      <div className="library-header">
        <div className="header-content">
          <LibraryIcon size={32} />
          <div>
            <h1>Vokabelbibliothek</h1>
            <p>Verwalten Sie Ihre Bücher und Vokabelseiten</p>
          </div>
        </div>
        <button 
          onClick={() => setShowCreateBookDialog(true)}
          className="create-book-btn"
          type="button"
        >
          <Plus size={20} />
          Neues Buch erstellen
        </button>
      </div>

      {books.length === 0 && vocabularyPages.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1.5} />
          <h2>Keine Bücher oder Vokabelseiten vorhanden</h2>
          <p>Erstellen Sie Ihr erstes Buch oder scannen Sie Vokabelseiten auf der Scan Page</p>
        </div>
      ) : (
        <div className="library-grid">
          {books.length > 0 && (
            <div className="books-section">
              <h2>Meine Bücher ({books.length})</h2>
              <div className="books-grid">
                {books.map((book) => (
                  <div
                    key={book.id}
                    className="book-card"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnBook(e, book)}
                  >
                    <div 
                      className="book-card-content"
                      onClick={() => setSelectedBook(book)}
                    >
                      {book.cover ? (
                        <div className="book-cover">
                          <img src={book.cover} alt={book.name} />
                        </div>
                      ) : (
                        <div className="book-cover-placeholder">
                          <BookOpen size={48} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="book-card-info">
                        <h3>{book.name}</h3>
                        <span className="book-page-count">
                          {book.pageIds.length} Seiten
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBook(book.id);
                      }}
                      className="delete-book-btn"
                      title="Buch löschen"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unassignedPages.length > 0 && (
            <div className="unassigned-pages-section">
              <h2>Nicht zugeordnete Vokabelseiten ({unassignedPages.length})</h2>
              <p className="section-hint">Ziehen Sie Seiten per Drag & Drop auf ein Buch, um sie zuzuordnen</p>
              <div className="pages-grid">
                {unassignedPages.map((page) => (
                  <div
                    key={page.id}
                    className="page-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, page)}
                  >
                    {page.imagePreview && (
                      <div className="page-card-image">
                        <img src={page.imagePreview} alt={page.name} />
                      </div>
                    )}
                    <div className="page-card-info">
                      <h3>{page.name}</h3>
                      <span className="vocab-count">
                        {page.vocabularyPairs.length} Vokabelpaare
                      </span>
                      <span className="created-date">
                        {formatDate(page.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateBookDialog && (
        <div className="dialog-overlay" onClick={() => setShowCreateBookDialog(false)}>
          <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Neues Buch erstellen</h2>
              <button
                onClick={() => setShowCreateBookDialog(false)}
                className="dialog-close"
                type="button"
              >
                <X size={24} />
              </button>
            </div>
            <div className="dialog-body">
              <div className="form-group">
                <label htmlFor="book-name">Buchname *</label>
                <input
                  id="book-name"
                  type="text"
                  value={newBookName}
                  onChange={(e) => setNewBookName(e.target.value)}
                  placeholder="z.B. English G21 - Unit 1"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="book-cover">Cover (optional)</label>
                <input
                  id="book-cover"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                />
                {newBookCover && (
                  <div className="cover-preview">
                    <img src={newBookCover} alt="Cover Vorschau" />
                  </div>
                )}
              </div>
            </div>
            <div className="dialog-footer">
              <button
                onClick={() => setShowCreateBookDialog(false)}
                className="btn-secondary"
                type="button"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateBook}
                className="btn-primary"
                type="button"
              >
                Buch erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Library;
