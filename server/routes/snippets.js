const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');

// GET all snippets (and handle search)
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    } : {};
    // Sort by newest first
    const snippets = await Snippet.find(query).sort({ createdAt: -1 });
    res.json(snippets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching snippets: " + err.message });
  }
});

// POST a new snippet
router.post('/', async (req, res) => {
  const { title, category, code, description } = req.body;
  const snippet = new Snippet({ title, category, code, description });
  try {
    const newSnippet = await snippet.save();
    res.status(201).json(newSnippet);
  } catch (err) {
    res.status(400).json({ message: "Error creating snippet: " + err.message });
  }
});

// PUT (update) a snippet by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedSnippet = await Snippet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedSnippet) return res.status(404).json({ message: "Snippet not found" });
    res.json(updatedSnippet);
  } catch (err) {
    res.status(400).json({ message: "Error updating snippet: " + err.message });
  }
});

// DELETE a snippet by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedSnippet = await Snippet.findByIdAndDelete(req.params.id);
    if (!deletedSnippet) return res.status(404).json({ message: "Snippet not found" });
    res.json({ message: 'Snippet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: "Error deleting snippet: " + err.message });
  }
});

module.exports = router;