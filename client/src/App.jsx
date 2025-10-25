import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown'; 

// --- API Configuration ---
const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://localhost:5000/api';         

const apiClient = axios.create({
  baseURL: API_URL,
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
  
  // --- STATE CHANGE: 'activeCategory' is now 'activeTag' ---
  const [activeTag, setActiveTag] = useState('All');

  // --- Data Fetching ---
  // --- UPDATED: fetchSnippets now filters by tag ---
  const fetchSnippets = async (query = '', tag = 'All') => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/snippets', {
        params: { search: query }
      });
      
      let fetchedData = response.data;

      // Frontend filtering for the active tag
      if (tag !== 'All') {
        fetchedData = fetchedData.filter(s => 
          // Check if the snippet's tags array includes the active tag (case-insensitive)
          s.tags.some(t => t.toLowerCase() === tag.toLowerCase())
        );
      }
      
      setSnippets(fetchedData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch snippets. Make sure the backend server is running.');
      console.error(err);
    }
    setIsLoading(false);
  };

  // Fetch snippets when search or tag changes
  useEffect(() => {
    fetchSnippets(searchQuery, activeTag);
  }, [searchQuery, activeTag]);


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

  // --- UPDATED: Renamed to handleTagClick ---
  const handleTagClick = (tag) => {
    setActiveTag(tag);
  };

  // --- CRUD Operations ---
  const handleSaveSnippet = async (snippetData) => {
    try {
      if (editingSnippet) {
        // Update existing snippet
        const response = await apiClient.put(`/snippets/${editingSnippet._id}`, snippetData);
        const updatedSnippets = snippets.map(s => (s._id === editingSnippet._id ? response.data : s));
        setSnippets(updatedSnippets);
        // If the edited snippet is the selected one, update the view
        if (selectedSnippet && selectedSnippet._id === editingSnippet._id) {
          setSelectedSnippet(response.data);
        }
      } else {
        // Create new snippet
        const response = await apiClient.post('/snippets', snippetData);
        setSnippets([response.data, ...snippets]); // Add new snippet to the top
        setSelectedSnippet(response.data); // Auto-select the new snippet
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
        setSelectedSnippet(null); // Clear selection
      } catch (err) {
        console.error('Failed to delete snippet:', err);
        alert('Error deleting snippet. Check console for details.');
      }
    }
  };

  const handleToggleFavorite = async (snippetToToggle) => {
    try {
      const response = await apiClient.put(`/snippets/${snippetToToggle._id}/toggle-favorite`);
      const updatedSnippets = snippets.map(s => (s._id === snippetToToggle._id ? response.data : s));
      setSnippets(updatedSnippets);
      
      if (selectedSnippet && selectedSnippet._id === snippetToToggle._id) {
        setSelectedSnippet(response.data);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      alert('Error toggling favorite. Check console for details.');
    }
  };

  // --- UI Components ---
  return (
    <div className="app-container">
      <AppHeader searchQuery={searchQuery} onSearchChange={handleSearchChange} />
      
      <main className="main-content">
        {/* --- UPDATED: Passing tag-related props --- */}
        <Sidebar
          snippets={snippets}
          isLoading={isLoading}
          error={error}
          onSelectSnippet={handleSelectSnippet}
          selectedSnippetId={selectedSnippet?._id}
          onNewSnippet={() => handleOpenModal(null)}
          activeTag={activeTag}
          onTagClick={handleTagClick}
          onToggleFavorite={handleToggleFavorite}
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
// --- UPDATED: Renamed props to use 'tag' ---
function Sidebar({ snippets, isLoading, error, onSelectSnippet, selectedSnippetId, onNewSnippet, activeTag, onTagClick, onToggleFavorite }) {
  
  // --- UPDATED: Logic to find all unique tags ---
  const tags = useMemo(() => {
    const allTags = snippets.flatMap(s => s.tags); // Get all tags from all snippets
    // Use a Set to get unique tags, then spread back into an array
    // Convert to lowercase for consistency in filtering
    return ['All', ...new Set(allTags.map(t => t.toLowerCase()))]; 
  }, [snippets]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>My Snippets</h2>
        <button className="btn btn-primary" onClick={onNewSnippet}>+ New</button>
      </div>

      {/* --- UPDATED: Renamed to TagFilters --- */}
      <TagFilters 
        tags={tags}
        activeTag={activeTag}
        onTagClick={onTagClick}
      />

      <div className="snippet-list">
        {isLoading && <div className="status-message">Loading...</div>}
        {error && <div className="status-message">{error}</div>}
        {!isLoading && !error && snippets.length === 0 && (
          <div className="status-message">No snippets found.</div>
        )}
        {!isLoading && !error && 
          snippets
            .sort((a, b) => b.isFavorite - a.isFavorite) // Sorts favorites (true=1) before non-favorites (false=0)
            .map(snippet => (
              <SnippetListItem
                key={snippet._id}
                snippet={snippet}
                onSelect={onSelectSnippet}
                isSelected={snippet._id === selectedSnippetId}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
      </div>
    </aside>
  );
}

// --- UPDATED: Renamed to TagFilters ---
// (Note: We can keep the CSS class names `category-filters` etc. to avoid editing index.css)
function TagFilters({ tags, activeTag, onTagClick }) {
  return (
    <div className="category-filters"> 
      <h3>Tags</h3>
      <div className="category-list">
        {tags.map(tag => (
          <button
            key={tag}
            // Capitalize first letter for display
            className={`category-btn ${activeTag.toLowerCase() === tag.toLowerCase() ? 'active' : ''}`}
            onClick={() => onTagClick(tag)}
          >
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}


// --- Snippet List Item Component ---
// --- UPDATED: To display tags ---
function SnippetListItem({ snippet, onSelect, isSelected, onToggleFavorite }) {
  
  const handleStarClick = (e) => {
    e.stopPropagation(); // Prevents the onSelect from firing
    onToggleFavorite(snippet);
  };

  return (
    <div
      className={`snippet-list-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(snippet)}
    >
      <button 
        onClick={handleStarClick}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          float: 'right', 
          fontSize: '1.25rem',
          padding: '0 0 0 10px',
          color: snippet.isFavorite ? '#f0c400' : '#666' 
        }}
      >
        {snippet.isFavorite ? '★' : '☆'}
      </button>
      
      <h3>{snippet.title}</h3>
      {/* --- UPDATED: Show first 3 tags, or 'No tags' --- */}
      <p style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
        {snippet.tags && snippet.tags.length > 0 
          ? snippet.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{ 
                fontSize: '0.8rem', 
                background: 'var(--bg-lighter)', 
                padding: '2px 6px', 
                borderRadius: '4px',
                color: 'var(--text-muted)'
              }}>
                {tag}
              </span>
            ))
          : <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)' }}>No tags</span>
        }
      </p>
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
// --- UPDATED: To display tags as bubbles ---
function SnippetDisplay({ snippet, onEdit, onDelete }) {
  const [copyText, setCopyText] = useState('Copy');
  
  useEffect(() => {
    if (snippet && window.Prism) {
      setTimeout(() => window.Prism.highlightAll(), 0);
    }
  }, [snippet]); 

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  // --- UPDATED: Use first tag as language hint, default to 'markup' (HTML/XML) ---
  const language = snippet.tags && snippet.tags.length > 0 
    ? snippet.tags[0].toLowerCase().trim() 
    : 'markup';

  return (
    <div className="snippet-display">
      <h2>{snippet.title}</h2>
      
      {/* --- UPDATED: Display tags as list of bubbles --- */}
      <div className="category-list" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
        {snippet.tags && snippet.tags.length > 0 ? (
          snippet.tags.map(tag => (
            <span key={tag} className="category-btn" style={{ cursor: 'default', textTransform: 'capitalize' }}>
              {tag}
            </span>
          ))
        ) : (
          <span className="category-tag">No tags</span>
        )}
      </div>
      
      <div className="description-markdown">
        <ReactMarkdown>
          {snippet.description || 'No description.'}
        </ReactMarkdown>
      </div>

      <p style={{ 
        fontSize: '0.85rem', 
        color: 'var(--text-muted)', 
        marginTop: '1rem', 
        borderTop: '1px solid var(--border-color)', 
        paddingTop: '0.75rem' 
      }}>
        Last updated: {new Date(snippet.updatedAt).toLocaleString()}
      </p>

      <div className="code-header">
        <h4>Code</h4>
        <button className="copy-btn" onClick={handleCopy}>{copyText}</button>
      </div>
      
      <div className="code-block">
        <pre>
          {/* Add a key here to force React to re-render the <pre> block when snippet changes */}
          <code key={snippet._id} className={`language-${language}`}>
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
// --- THIS IS THE BIGGEST UI CHANGE ---
function SnippetFormModal({ onClose, onSave, snippet }) {
  const [title, setTitle] = useState(snippet?.title || '');
  // --- UPDATED: 'category' state is now 'tags' (an array) ---
  const [tags, setTags] = useState(snippet?.tags || []);
  const [currentTag, setCurrentTag] = useState(''); // The tag user is currently typing
  
  const [description, setDescription] = useState(snippet?.description || '');
  const [code, setCode] = useState(snippet?.code || '');

  // --- NEW: Function to handle tag input ---
  const handleTagInput = (e) => {
    // If user presses Enter or Comma, add the tag
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = currentTag.trim().toLowerCase(); // Standardize to lowercase
      if (newTag && !tags.includes(newTag)) { // Prevent duplicates
        setTags([...tags, newTag]);
      }
      setCurrentTag(''); // Clear the input
    }
  };
  
  // --- NEW: Handle backspace to delete last tag ---
  const handleTagKeyDown = (e) => {
    if (e.key === 'Backspace' && currentTag === '' && tags.length > 0) {
      // Remove the last tag
      setTags(tags.slice(0, -1));
    }
  };

  // --- NEW: Function to remove a tag when clicked ---
  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !code) {
      alert('Title and Code are required.');
      return;
    }
    // --- UPDATED: Save 'tags' array ---
    // Make sure to add any tag still in the input box
    const finalTags = [...tags];
    const newTag = currentTag.trim().toLowerCase();
    if (newTag && !tags.includes(newTaq)) {
      finalTags.push(newTag);
    }
    
    onSave({ title, tags: finalTags, description, code });
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
          
          {/* --- UPDATED: Category input is now Tag input --- */}
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'normal'}}>
              Type a tag and press Enter or Comma. Backspace to delete.
            </small>
            <div className="tag-input-container" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem',
              padding: '0.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-dark)'
            }}>
              {tags.map((tag) => (
                <div key={tag} className="tag-item" style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--primary-color)',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '15px',
                  fontSize: '0.9rem',
                  textTransform: 'capitalize'
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      marginLeft: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      padding: '0'
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}
              <input
                id="tags"
                type="text"
                placeholder={tags.length === 0 ? "Add tags..." : ""}
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => { handleTagInput(e); handleTagKeyDown(e); }}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  padding: '0.25rem',
                  minWidth: '150px'
                }}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem', fontWeight: 'normal'}}>
              Markdown supported
            </small>
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

