const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const profileController = require('../controller/profileController');
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
router.get('/verifyForgotPassword', userController.forgotOtp);
router.post('/forgotPassword', userController.forgotPassword);
router.get('/forgotPassword', userController.getForgotPassword);
router.post('/resetPassword', userController.resetPassword);



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

router.get('/logout', userController.logout);

router.get('/pageError', userController.pagenotfound);

router.get('/products/:id', userAuth, userController.viewProduct);

router.get('/shop', userAuth, userController.getShop);

router.get('/cart', userController.getCart);

router.post('/cart', cartController.cart);
router.post('/cart/update', cartController.updateCart);
router.delete('/cart/delete/:id', cartController.deleteCart);

router.get('/profile', profileController.getProfile);


module.exports = router;
