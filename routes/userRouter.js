const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.get('/', userController.loadHomePage);

router.get('/signin',userController.loadSignin)
// router.get('/signin',userController.s~~~ignin)

router.get('/signup', userController.loadSignup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/signup', userController.signup);

router.get('*', userController.pagenotfound);

// Route for fetching user profile (example of protected route)
router.get('/profile', (req, res) => {
  // Fetch and return user profile details
  res.send('User profile route');
});

module.exports = router;
