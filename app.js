const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const userRouter = require('./routes/userRouter');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.set("view engine", "ejs");
app.set('views', [path.join(__dirname, 'views/users'),path.join(__dirname, 'views/admin')]);
app.use(express.static(path.join(__dirname, 'public')));
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));


app.use('/', userRouter);

const PORT = process.env.PORT || 3000;
// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
