const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/', userController.loadHomePage);

// router.get('/signin',userController.signin)
router.get('/signin', (req, res) => {
    res.render('signin', { message: null });
});

router.get('/signup',userController.loadSignup)
router.post('/signup',userController.signup)

router.get('*',userController.pagenotfound);

// Route for fetching user profile (example of protected route)
router.get('/profile', (req, res) => {
  // Fetch and return user profile details
  res.send('User profile route');
});

module.exports = router;
