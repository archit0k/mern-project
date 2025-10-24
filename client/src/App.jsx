import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
// NO SYNTAX HIGHLIGHTER IMPORTS NEEDED!

// --- API Configuration ---
// Check if VITE_API_URL is set (production) or not (development)
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api` // Production: Add /api to the base URL
  : 'http://localhost:5000/api';         // Development: Use the full localhost URL

  const apiClient = axios.create({
  baseURL: API_URL, // This is now the *full* API path
});


// --- Main App Component ---
function App() {
  const [snippets, setSnippets] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // --- Data Fetching ---
  const fetchSnippets = async (query = '', category = 'All') => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/snippets', {
        params: { search: query }
      });

      let fetchedData = response.data;

      if (category !== 'All') {
        fetchedData = fetchedData.filter(s => s.category.toLowerCase() === category.toLowerCase());
      }

      setSnippets(fetchedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch snippets. Make sure the backend server is running.');
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSnippets(searchQuery, activeCategory);
  }, [searchQuery, activeCategory]);


  // --- Event Handlers ---
  const handleSelectSnippet = (snippet) => {
    setSelectedSnippet(snippet);
  };

  const handleOpenModal = (snippetToEdit = null) => {
    setEditingSnippet(snippetToEdit); 
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSnippet(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  // --- CRUD Operations ---
  const handleSaveSnippet = async (snippetData) => {
    try {
      if (editingSnippet) {
        const response = await apiClient.put(`/snippets/${editingSnippet._id}`, snippetData);
        setSnippets(snippets.map(s => (s.__id === editingSnippet._id ? response.data : s)));
        setSelectedSnippet(response.data);
      } else {
        const response = await apiClient.post('/snippets', snippetData);
        setSnippets([response.data, ...snippets]);
        setSelectedSnippet(response.data);
      }
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save snippet:', err);
      alert('Error saving snippet. Check console for details.');
    }
  };

  const handleDeleteSnippet = async (snippetId) => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        await apiClient.delete(`/snippets/${snippetId}`);
        setSnippets(snippets.filter(s => s._id !== snippetId));
        setSelectedSnippet(null);
      } catch (err) {
        console.error('Failed to delete snippet:', err);
        alert('Error deleting snippet. Check console for details.');
      }
    }
  };

  // --- UI Components ---
  return (
    <div className="app-container">
      <AppHeader searchQuery={searchQuery} onSearchChange={handleSearchChange} />

      <main className="main-content">
        <Sidebar
          snippets={snippets}
          isLoading={isLoading}
          error={error}
          onSelectSnippet={handleSelectSnippet}
          selectedSnippetId={selectedSnippet?._id}
          onNewSnippet={() => handleOpenModal(null)}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />
        <ContentArea
          snippet={selectedSnippet}
          onEdit={handleOpenModal}
          onDelete={handleDeleteSnippet}
        />
      </main>

      {isModalOpen && (
        <SnippetFormModal
          onClose={handleCloseModal}
          onSave={handleSaveSnippet}
          snippet={editingSnippet}
        />
      )}
    </div>
  );
}


// --- Header Component ---
function AppHeader({ searchQuery, onSearchChange }) {
  return (
    <header className="app-header">
      <h1>CodeKeep</h1>
      <input
        type="text"
        className="search-bar"
        placeholder="Search snippets..."
        value={searchQuery}
        onChange={onSearchChange}
      />
    </header>
  );
}


// --- Sidebar Component ---
function Sidebar({ snippets, isLoading, error, onSelectSnippet, selectedSnippetId, onNewSnippet, activeCategory, onCategoryClick }) {

  const categories = useMemo(() => {
    const allCategories = snippets.map(s => s.category);
    return ['All', ...new Set(allCategories)];
  }, [snippets]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>My Snippets</h2>
        <button className="btn btn-primary" onClick={onNewSnippet}>+ New</button>
      </div>

      <CategoryFilters 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={onCategoryClick}
      />

      <div className="snippet-list">
        {isLoading && <div className="status-message">Loading...</div>}
        {error && <div className="status-message">{error}</div>}
        {!isLoading && !error && snippets.length === 0 && (
          <div className="status-message">No snippets found.</div>
        )}
        {!isLoading && !error && snippets.map(snippet => (
          <SnippetListItem
            key={snippet._id}
            snippet={snippet}
            onSelect={onSelectSnippet}
            isSelected={snippet._id === selectedSnippetId}
          />
        ))}
      </div>
    </aside>
  );
}

// --- Category Filters Component ---
function CategoryFilters({ categories, activeCategory, onCategoryClick }) {
  return (
    <div className="category-filters">
      <h3>Categories</h3>
      <div className="category-list">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => onCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}


// --- Snippet List Item Component ---
function SnippetListItem({ snippet, onSelect, isSelected }) {
  return (
    <div
      className={`snippet-list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(snippet)}
    >
      <h3>{snippet.title}</h3>
      <p>{snippet.category}</p>
    </div>
  );
}


// --- Main Content Area Component ---
function ContentArea({ snippet, onEdit, onDelete }) {
  if (!snippet) {
    return (
      <main className="content-area">
        <div className="placeholder">
          <span className="placeholder-icon">🚀</span>
          <h2>Welcome to CodeKeep</h2>
          <p>Select a snippet from the left to view it, or create a new one.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="content-area">
      <SnippetDisplay
        snippet={snippet}
        onEdit={() => onEdit(snippet)}
        onDelete={() => onDelete(snippet._id)}
      />
    </main>
  );
}


// --- Snippet Display Component (with Prism.js) ---
function SnippetDisplay({ snippet, onEdit, onDelete }) {
  const [copyText, setCopyText] = useState('Copy');

  useEffect(() => {
    if (snippet && window.Prism) {
      // Tell Prism.js to highlight all code blocks on the page
      window.Prism.highlightAll();
    }
  }, [snippet]); // This hook runs every time the snippet changes

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  // Try to guess the language from the category
  const language = snippet.category?.toLowerCase().trim() || 'javascript';

  return (
    <div className="snippet-display">
      <h2>{snippet.title}</h2>
      <span className="category-tag">{snippet.category}</span>
      <p>{snippet.description || 'No description.'}</p>

      <div className="code-header">
        <h4>Code</h4>
        <button className="copy-btn" onClick={handleCopy}>{copyText}</button>
      </div>

      <div className="code-block">
        {/* Prism.js looks for this structure: <pre><code class="language-..."> */}
        <pre>
          <code className={`language-${language}`}>
            {snippet.code}
          </code>
        </pre>
      </div>

      <div className="snippet-actions">
        <button className="btn btn-secondary" onClick={onEdit}>Edit</button>
        <button className="btn btn-danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}


// --- Snippet Form Modal Component ---
function SnippetFormModal({ onClose, onSave, snippet }) {
  const [title, setTitle] = useState(snippet?.title || '');
  const [category, setCategory] = useState(snippet?.category || '');
  const [description, setDescription] = useState(snippet?.description || '');
  const [code, setCode] = useState(snippet?.code || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !category || !code) {
      alert('Title, Category, and Code are required.');
      return;
    }
    onSave({ title, category, description, code });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{snippet ? 'Edit Snippet' : 'Create New Snippet'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input
              id="category"
              type="text"
              placeholder="e.g., React, CSS, JavaScript"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="code">Code</label>
            <textarea
              id="code"
              rows="10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;