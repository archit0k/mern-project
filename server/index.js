const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const snippetRoutes = require('./routes/snippets');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connection established successfully"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

app.use('/api/snippets', snippetRoutes);
app.get('/', (req, res) => res.send('CodeKeep API is running...'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));