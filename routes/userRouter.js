const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const passport = require('passport');

router.get('/', userController.loadHomePage);

router.get('/signin',userController.loadSignin)
router.post('/signin',userController.signin)

router.get('/signup', userController.loadSignup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/signup', userController.signup);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
  res.redirect('/')
});
router.get('*', userController.pagenotfound);

// Route for fetching user profile (example of protected route)
router.get('/profile', (req, res) => {
  // Fetch and return user profile details
  res.send('User profile route');
});

module.exports = router;
