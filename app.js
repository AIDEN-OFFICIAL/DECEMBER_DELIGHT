const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.set("views engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));


app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send('Welcome to the eCommerce API');
});

// MongoDB Connection
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
