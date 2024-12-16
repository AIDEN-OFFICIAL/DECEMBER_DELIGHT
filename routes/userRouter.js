const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const cartController = require('../controller/cartController');
const profileController = require('../controller/profileController');
const orderController = require('../controller/orderController');
const walletController = require('../controller/walletController');
const wishlistController = require('../controller/wishlistController');
const Order = require('../models/orderSchema');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('dotenv').config();
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
router.get('/changePassword', profileController.getChangePassword);
router.post('/changePassword', userController.changePassword);
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
router.get('/cart', userAuth, userController.getCart);
router.get('/wishlist', userAuth, userController.getWishlist);

router.post('/cart', cartController.cart);
router.post('/cart/update', userAuth, cartController.updateCart);
router.delete('/cart/delete/:id', userAuth, cartController.deleteCart);

router.get('/profile', userAuth, profileController.getProfile);
router.post(
  '/profile/updateProfile',
  userAuth,
  profileController.updateUserProfile
);
router.get('/profile/manageAddress', userAuth, profileController.manageAddress);
router.post('/profile/manageAddress', userAuth, profileController.addAddress);
router.delete(
  '/profile/manageAddress/:id',
  userAuth,
  profileController.deleteAddress
);
router.post(
  '/profile/updatePrimaryAddress',
  userAuth,
  profileController.updatePrimaryAddress
);
router.get(
  '/profile/editAddress/:id',
  userAuth,
  profileController.getEditAddress
);
router.post(
  '/profile/editAddress/:id',
  userAuth,
  profileController.editAddress
);
router.get('/profile/orderHistory', userAuth, profileController.orderHistory);
router.get(
  '/profile/orderHistory/:orderId',
  userAuth,
  profileController.getOrderDetails
);
router.post(
  '/profile/orderHistory/:orderId/cancel',
  profileController.cancelOrder
);
router.post(
  '/profile/orderHistory/:orderId/return',
  profileController.requestReturn
);
router.get('/profile/invoice/:orderId', userAuth, profileController.generateInvoice);

router.post('/checkout', userAuth, orderController.placeOrder);
router.get('/checkout', userAuth, orderController.getOrder);

router.post('/wishlist', userAuth, wishlistController.addToWishlist);
router.delete(
  '/wishlist/delete/:productId',
  userAuth,
  wishlistController.deleteWishlist
);

router.get('/wallet', userAuth, walletController.getWallet);
router.post('/wallet/addMoney', userAuth, walletController.addMoney);
router.post('/apply-coupon', userAuth, cartController.applyCoupon);
router.post('/remove-coupon', userAuth, cartController.removeCoupon);
router.post('/wallet-payment', userAuth, orderController.walletPayment);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order
router.post('/create-order', async (req, res) => {
  console.log('create order');

  const { amount, currency, receipt } = req.body;
  console.log(req.body);

  try {
    const options = {
      amount: amount * 100,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res
      .status(500)
      .json({ success: false, message: 'Unable to create order.' });
  }
});

// Verify payment signature (Razorpay Callback)
router.post('/verify-payment', async (req, res) => {
  console.log("verify payment")
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  console.log('--- Verify Payment Endpoint Hit ---');
  console.log('Received Data:', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  });

  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.error('Missing required parameters');
      // return res
      //   .status(400)
      //   .json({ success: false, message: 'Missing required parameters' });
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    console.log('Constructed Body for Signature:', body);

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    console.log('Expected Signature:', expectedSignature);

    if (expectedSignature === razorpay_signature) {
    

      console.log('Signature Matched. Updating Payment Status to Paid.');
      const updateResult = await Order.updateOne(
        { _id:orderId }, 
        { $set: { paymentStatus: 'Paid', status:'Order Placed' } }
      );
      console.log('Payment Status Update Result:', updateResult);
      return res
        .status(200)
        .json({ success: true, message: 'Payment verified successfully.' });
    } else {
      console.warn('Invalid Signature. Updating Payment Status to Pending.');
      const updateResult = await Order.updateOne(
        { _id: orderId },
        { 
            $set: { 
                paymentStatus: 'Pending',
                status: 'Pending' 
            } 
        }
    );
    
      console.log('Payment Status Update Result:', updateResult);
      return res.status(400).json({ success: false, message: 'Invalid signature.' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res
      .status(500)
      .json({ success: false, message: 'Unable to verify payment.' });
  }
});

router.get('/success', (req, res) => {
  try {
    // Render the success.ejs view
    res.render('success', {
      pageTitle: 'Order Success',
    });
    
  } catch (error) {
    console.error('Error rendering success page:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
