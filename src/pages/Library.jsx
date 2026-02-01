import React, { useState, useEffect } from 'react';
import { Library as LibraryIcon, Plus, BookOpen, ArrowLeft, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Library.css';

function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [vocabularyPages, setVocabularyPages] = useState([]);
  const [bookPages, setBookPages] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showCreateBookDialog, setShowCreateBookDialog] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookCover, setNewBookCover] = useState(null);
  const [draggedPage, setDraggedPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load books
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (booksError) throw booksError;

      // Load vocabulary pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('vocabulary_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (pagesError) throw pagesError;

      // Load book-page relationships
      const { data: relationshipsData, error: relationshipsError } = await supabase
        .from('book_pages')
        .select('*');

      if (relationshipsError) throw relationshipsError;

      setBooks(booksData || []);
      setVocabularyPages(pagesData || []);
      setBookPages(relationshipsData || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBook = async () => {
    if (!newBookName.trim()) {
      alert('Bitte geben Sie einen Buchnamen ein');
      return;
    }

    try {
      const { error } = await supabase
        .from('books')
        .insert([{
          name: newBookName.trim(),
          cover_image: newBookCover
        }]);

      if (error) throw error;

      await loadData();
      setShowCreateBookDialog(false);
      setNewBookName('');
      setNewBookCover(null);
    } catch (err) {
      console.error('Error creating book:', err);
      alert('Fehler beim Erstellen des Buches');
    }
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

  const handleDropOnBook = async (e, book) => {
    e.preventDefault();
    if (!draggedPage) return;

    try {
      // Check if relationship already exists
      const existingRelationship = bookPages.find(
        bp => bp.book_id === book.id && bp.page_id === draggedPage.id
      );

      if (existingRelationship) {
        setDraggedPage(null);
        return;
      }

      // Remove page from other books
      const relationshipsToDelete = bookPages.filter(bp => bp.page_id === draggedPage.id);
      
      if (relationshipsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('book_pages')
          .delete()
          .in('id', relationshipsToDelete.map(r => r.id));

        if (deleteError) throw deleteError;
      }

      // Add page to target book
      const { error: insertError } = await supabase
        .from('book_pages')
        .insert([{
          book_id: book.id,
          page_id: draggedPage.id
        }]);

      if (insertError) throw insertError;

      await loadData();
      setDraggedPage(null);
    } catch (err) {
      console.error('Error updating book pages:', err);
      alert('Fehler beim Zuordnen der Seite');
    }
  };

  const handleRemovePageFromBook = async (bookId, pageId) => {
    try {
      const { error } = await supabase
        .from('book_pages')
        .delete()
        .eq('book_id', bookId)
        .eq('page_id', pageId);

      if (error) throw error;

      await loadData();
    } catch (err) {
      console.error('Error removing page from book:', err);
      alert('Fehler beim Entfernen der Seite');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (window.confirm('Möchten Sie dieses Buch wirklich löschen? Die Vokabelseiten bleiben erhalten.')) {
      try {
        const { error } = await supabase
          .from('books')
          .delete()
          .eq('id', bookId);

        if (error) throw error;

        await loadData();
        if (selectedBook?.id === bookId) {
          setSelectedBook(null);
        }
      } catch (err) {
        console.error('Error deleting book:', err);
        alert('Fehler beim Löschen des Buches');
      }
    }
  };

  const getUnassignedPages = () => {
    const assignedPageIds = new Set(bookPages.map(bp => bp.page_id));
    return vocabularyPages.filter(page => !assignedPageIds.has(page.id));
  };

  const getBookPages = (book) => {
    const pageIds = bookPages
      .filter(bp => bp.book_id === book.id)
      .map(bp => bp.page_id);
    
    return vocabularyPages.filter(page => pageIds.includes(page.id));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="library-container">
        <p>Lade Bibliothek...</p>
      </div>
    );
  }

  if (selectedBook) {
    const bookPagesData = getBookPages(selectedBook);
    
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
            {selectedBook.cover_image && (
              <div className="book-detail-cover">
                <img src={selectedBook.cover_image} alt={selectedBook.name} />
              </div>
            )}
            <h1>{selectedBook.name}</h1>
            <p className="book-page-count">{bookPagesData.length} Vokabelseiten</p>
          </div>

          <div className="book-pages-section">
            <h2>Zugeordnete Vokabelseiten</h2>
            {bookPagesData.length === 0 ? (
              <div className="empty-book-state">
                <BookOpen size={48} strokeWidth={1.5} />
                <p>Noch keine Vokabelseiten zugeordnet</p>
                <p className="hint">Gehen Sie zurück zur Bibliothek und ziehen Sie Seiten per Drag & Drop auf dieses Buch</p>
              </div>
            ) : (
              <div className="book-pages-grid">
                {bookPagesData.map((page) => (
                  <div key={page.id} className="book-page-card">
                    {page.image_preview && (
                      <div className="book-page-image">
                        <img src={page.image_preview} alt={page.name} />
                      </div>
                    )}
                    <div className="book-page-info">
                      <h3>{page.name}</h3>
                      <span className="vocab-count">
                        {page.vocabulary_pairs?.length || 0} Vokabelpaare
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
                      {book.cover_image ? (
                        <div className="book-cover">
                          <img src={book.cover_image} alt={book.name} />
                        </div>
                      ) : (
                        <div className="book-cover-placeholder">
                          <BookOpen size={48} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="book-card-info">
                        <h3>{book.name}</h3>
                        <span className="book-page-count">
                          {getBookPages(book).length} Seiten
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
                    {page.image_preview && (
                      <div className="page-card-image">
                        <img src={page.image_preview} alt={page.name} />
                      </div>
                    )}
                    <div className="page-card-info">
                      <h3>{page.name}</h3>
                      <span className="vocab-count">
                        {page.vocabulary_pairs?.length || 0} Vokabelpaare
                      </span>
                      <span className="created-date">
                        {formatDate(page.created_at)}
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
