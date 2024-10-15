const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/', userController.loadHomePage);
router.get('*',userController.pagenotfound);

// Route for User Signup
router.post('/signup', (req, res) => {
  const { username, password } = req.body;
  // Handle user signup logic
  res.send('User signup route');
});

// Route for User Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Handle user login logic
  res.send('User login route');
});

// Route for fetching user profile (example of protected route)
router.get('/profile', (req, res) => {
  // Fetch and return user profile details
  res.send('User profile route');
});

module.exports = router;
