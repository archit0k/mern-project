const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  
  // --- THIS IS THE BIG CHANGE ---
  // category: { type: String, required: true, trim: true }, // This is GONE
  tags: [{ type: String, trim: true }], // Replaced by an array of strings

  description: { type: String, trim: true },
  code: { type: String, required: true },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Snippet', snippetSchema);

