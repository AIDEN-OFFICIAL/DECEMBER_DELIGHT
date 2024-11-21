const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const profileController = require('../controller/profileController');
const orderController = require('../controller/orderController');
const walletController = require('../controller/walletController');
const wishlistController = require('../controller/wishlistController');
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
router.get('/products/:id', userController.viewProduct);
router.get('/shop', userController.getShop);
router.get('/cart', userController.getCart);
router.get('/wishlist',userAuth,userController.getWishlist);

router.post('/cart', cartController.cart);
router.post('/cart/update', cartController.updateCart);
router.delete('/cart/delete/:id', cartController.deleteCart);

router.get('/profile',userAuth, profileController.getProfile);
router.post('/profile/updateProfile',userAuth ,profileController.updateUserProfile);
router.get('/profile/manageAddress',userAuth, profileController.manageAddress);
router.post('/profile/manageAddress',userAuth, profileController.addAddress);
router.delete('/profile/manageAddress/:id',userAuth, profileController.deleteAddress);
router.post('/profile/updatePrimaryAddress', userAuth, profileController.updatePrimaryAddress);
router.get('/profile/editAddress/:id', userAuth, profileController.getEditAddress);
router.post('/profile/editAddress/:id', userAuth, profileController.editAddress);
router.get('/profile/orderHistory', userAuth, profileController.orderHistory);
router.get('/profile/orderHistory/:orderId', userAuth, profileController.getOrderDetails);
router.post('/profile/orderHistory/:orderId/cancel', profileController.cancelOrder);



router.post('/checkout',userAuth, orderController.placeOrder);
router.get('/checkout', userAuth, orderController.getOrder);

router.post('/wishlist',userAuth,wishlistController.addToWishlist);
router.delete('/wishlist/delete/:productId', userAuth, wishlistController.deleteWishlist);

router.get('/wallet',userAuth,walletController.getWallet);
router.post('/wallet/addMoney', userAuth, walletController.addMoney);
router.post('/apply-coupon',userAuth, cartController.applyCoupon);




module.exports = router;
