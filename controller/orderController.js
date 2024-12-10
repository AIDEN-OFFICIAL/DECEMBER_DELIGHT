const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Coupon = require('../models/couponSchema');
const Order = require('../models/orderSchema');
const Address = require('../models/addressSchema');
const Wallet = require('../models/walletSchema');
const nodemailer = require('nodemailer');
const { error } = require('jquery');
const env = require('dotenv').config();
const Razorpay = require('razorpay');

const getOrder = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = req.session.user._id;
    const cartAmount = await Cart.findOne({
      userId: user._id,
      status: 'active',
    });
    const addressDoc = await Address.findOne({ userId })
      .sort({ createdAt: -1 })
      .limit(3);
    const addresses = addressDoc ? addressDoc.address : [];
    const cart = await Cart.findOne({
      userId: user._id,
      status: 'active',
    }).populate('items.productId');
    const totalOrderAmount = cart.totalCartPrice;
    const wallet = await Wallet.findOne({ userId: req.session.user._id });
    const defaultAddressDoc = await Address.findOne(
      { userId: user._id, 'address.isDefault': true },
      { 'address.$': 1 }
    );
    const defaultAddress =
      defaultAddressDoc && defaultAddressDoc.address
        ? defaultAddressDoc.address[0]
        : null;
    const coupon = await Coupon.find({});
    cart.appliedCoupon = null;
    await cart.save();
    res.render('checkout', {
      success: false,
      user,
      error: false,
      cartAmount,
      user,
      addresses,
      cart,
      defaultAddress: defaultAddress,
      wallet,
      totalOrderAmount,
      coupon,
    });
  } catch (error) {
    console.log('Error while getting the order page', error);
  }
};
  const placeOrder = async (req, res) => {
    try {
      const error = false;
      const {
        selectedAddress,
        name,
        email,
        country,
        street,
        city,
        state,
        pinCode,
        phone,
        notes,
        paymentMethod,
        paymentSuccess,
      } = req.body;
      const userId = req.session.user._id;
      console.log("status",paymentSuccess)
      if (!selectedAddress && (!street || !city || !state || !pinCode || !country || !phone)) {
        return res.status(400).json({
          success: false,
          message: "Address is required to proceed with the order.",
        });
      }
      let addressId;

      // Look for an existing address with the same details for the user
      let userAddressDoc = await Address.findOne({ userId });
      if (selectedAddress) {
        const parsedAddress = JSON.parse(selectedAddress);
        addressId = parsedAddress._id; // Use the selected address
      } else {
        const addressData = { street, city, state, pinCode, country, phone };
        if (userAddressDoc) {
          // Find the matched address ID within the array of addresses
          const matchedAddress = userAddressDoc.address.find(
            (addr) =>
              addr.street === addressData.street &&
              addr.city === addressData.city &&
              addr.state === addressData.state &&
              addr.pinCode === addressData.pinCode &&
              addr.country === addressData.country
          );
          if (matchedAddress) {
            addressId = matchedAddress._id; // This ID is passed to the Order schema
          } else {
            userAddressDoc.address.push(addressData);
            const savedUserAddress = await userAddressDoc.save();
            addressId =
              savedUserAddress.address[savedUserAddress.address.length - 1]._id;
          }
        } else {
          // Create a new Address document for the user with the new address
          const newUserAddress = new Address({
            userId,
            address: [addressData],
          });
          const savedNewAddress = await newUserAddress.save();
          addressId = savedNewAddress.address[0]._id;
        }
      }
      // Fetch the user's active cart
      const cart = await Cart.findOne({ userId })
        .populate('items.productId')
        .populate('appliedCoupon');
      // const discount = cart.appliedCoupon ? await Coupon.findById(cart.appliedCoupon).offerPrice : 0;
      // console.log('Applied Coupon:', cart.appliedCoupon);
      const coupon = await Coupon.findById(cart.appliedCoupon);
      const discount = coupon ? coupon.offerPrice : 0;

      // Update stock levels for each product in the cart
      for (const item of cart.items) {
        const product = item.productId;
        if (product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for product: ${product.name}. Available: ${product.quantity}.`,
          });
        }
        product.quantity -= item.quantity;
        await product.save();
      }
      const totalOrderAmount = cart.totalCartPrice + 100;

      const paymentStatus = paymentSuccess === true ? "Paid" : "Pending";

      // Create a new order
      const newOrder = new Order({
        userId,
        orderItems: cart.items.map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          price: item.productId.salePrice,
          weight: item.weight,
          itemTotalPrice: item.productId.salePrice * item.quantity,
        })),
        totalOrderPrice: totalOrderAmount,
        finalAmount: totalOrderAmount, // Adjust as needed for discounts
        address: addressId, // Use the correct address ID
        orderNotes: notes || '',
        paymentMethod,
        discount: discount,
        paymentStatus,
      });

      await newOrder.save(); // Save the order
      // Clear the cart
      await Cart.updateOne({ userId }, { $set: { items: [] } });
      cart.appliedCoupon = null;
      cart.totalCartPrice = 0;
      await cart.save();
      res.json({ success: true, message: 'Order placed successfully!' });
    } catch (error) {
      console.error('Error placing order:', error);
      res.status(500).send('Server error');
    }
  };

const walletPayment = async (req, res) => {
  const { amount } = req.body;

  try {
    // Fetch the wallet for the logged-in user
    const wallet = await Wallet.findOne({ userId: req.session.user._id });

    if (!wallet) {
      return res
        .status(404)
        .json({ success: false, message: 'Wallet not found.' });
    }

    if (wallet.balance < amount) {
      return res
        .status(400)
        .json({ success: false, message: 'Insufficient wallet balance.' });
    }

    wallet.balance -= amount;

    // Add transaction record
    wallet.transactions.push({
      description: 'debited',
      amount,
    });

    // Save wallet updates
    await wallet.save();

    res
      .status(200)
      .json({ success: true, message: 'Wallet payment successful.' });
  } catch (error) {
    console.error('Error processing wallet payment:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to process wallet payment.' });
  }
};
module.exports = {
  getOrder,
  placeOrder,
  walletPayment,
};
