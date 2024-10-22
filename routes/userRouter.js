const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const passport = require('passport');

const preventCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next(); 
}


router.get('/',userController.loadHomePage);

router.get('/signin',isAuthenticated,userController.loadSignin)
router.post('/signin',userController.signin)

router.get('/signup',isAuthenticated,userController.loadSignup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/signup', userController.signup);

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/signup' }), (req, res) => {
  req.session.user = req.user;
  res.redirect('/')
});

router.get('/profile', (req, res) => {
  res.send('User profile route');
});

router.get('/logout', userController.logout);


router.get('/pageError', userController.pagenotfound);


module.exports = router;
