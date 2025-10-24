const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  code: { type: String, required: true }
}, {
  // Automatically add 'createdAt' and 'updatedAt' fields
  timestamps: true
});

module.exports = mongoose.model('Snippet', snippetSchema);