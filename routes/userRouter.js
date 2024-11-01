const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const passport = require('passport');
const { userAuth } = require('../middlewares/auth');

const preventCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

router.get('/', preventCache, userController.loadHomePage);

router.get('/signin', userController.loadSignin);
router.post('/signin', userController.signin);

router.get('/signup', userController.loadSignup);
router.post('/verify-otp', userController.verifyOtp);
router.post('/signup', userController.signup);

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/signup' }),
  (req, res) => {
    req.session.user = req.user;
    res.redirect('/');
  }
);

router.get('/profile',userAuth, (req, res) => {
  res.send('User profile route');
});

router.get('/logout', userController.logout);

router.get('/pageError', userController.pagenotfound);

router.get('/products/:id',userAuth, userController.viewProduct);

router.get('/shop',userAuth, userController.getShop);
module.exports = router;
