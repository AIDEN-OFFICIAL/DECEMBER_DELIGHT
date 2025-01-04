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
    if (cartAmount.totalCartPrice <= 0) {
      return res.redirect('/cart');
    }
    const addressDoc = await Address.findOne({ userId })
      .sort({ createdAt: -1 })
      .limit(3);
    const addresses = addressDoc ? addressDoc.address : [];
    const cart = await Cart.findOne({
      userId: user._id,
      status: 'active',
    }).populate('items.productId');


    // Filter out blocked products
    const filteredItems = cart.items.filter(
      (item) => !item.productId.isBlocked
    );
    
// If there are blocked items, update the cart
if (filteredItems.length !== cart.items.length) {
  cart.items = filteredItems;
  cart.totalCartPrice = filteredItems.reduce((total, item) => {
    return total + item.productId.salePrice * item.quantity;
  }, 0);
  await cart.save();
}

if (cart.totalCartPrice <= 0) {
  return res.redirect('/cart'); // Redirect if cart is empty after removing blocked products
}
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
    console.log('--- Place Order Function Hit ---');
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

    if (!selectedAddress && (!street || !city || !state || !pinCode || !country || !phone)) {
      console.error('Address validation failed');
      return res.status(400).json({
        success: false,
        message: "Address is required to proceed with the order.",
      });
    }

    let addressId;
    let userAddressDoc = await Address.findOne({ userId });
    console.log('User Address Document:', JSON.stringify(userAddressDoc, null, 2));

    if (selectedAddress) {
      const parsedAddress = JSON.parse(selectedAddress);
      addressId = parsedAddress._id;
    } else {
      const addressData = { street, city, state, pinCode, country, phone };
      if (userAddressDoc) {
        const matchedAddress = userAddressDoc.address.find(
          (addr) =>
            addr.street === addressData.street &&
            addr.city === addressData.city &&
            addr.state === addressData.state &&
            addr.pinCode === addressData.pinCode &&
            addr.country === addressData.country
        );
        if (matchedAddress) {
          addressId = matchedAddress._id;
        } else {
          userAddressDoc.address.push(addressData);
          const savedUserAddress = await userAddressDoc.save();
          addressId =
            savedUserAddress.address[savedUserAddress.address.length - 1]._id;
        }
      } else {
        const newUserAddress = new Address({
          userId,
          address: [addressData],
        });
        const savedNewAddress = await newUserAddress.save();
        addressId = savedNewAddress.address[0]._id;
      }
    }


    const cart = await Cart.findOne({ userId })
      .populate('items.productId')
      .populate('appliedCoupon');
    console.log('Cart Details:', JSON.stringify(cart, null, 2));

    const coupon = await Coupon.findById(cart.appliedCoupon);
    const discount = coupon ? coupon.offerPrice : 0;

    for (const item of cart.items) {
      const product = item.productId;
      console.log('Product Before Stock Update:', product.name, product.quantity);

      if (product.quantity < item.quantity) {
        console.error('Insufficient stock for product:', product.name);
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product.name}. Available: ${product.quantity}.`,
        });
      }
      product.quantity -= item.quantity;
      await product.save();

      const updatedProduct = await Product.findById(product._id);
      console.log('Product After Stock Update:', updatedProduct.quantity);
    }
     let paymentStatus = "Pending"
    if (paymentMethod == "Wallet") {
      paymentStatus = "Paid";
    }
    const totalOrderAmount = cart.totalCartPrice + 100;
    console.log('Total Order Amount:', totalOrderAmount);

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
      finalAmount: totalOrderAmount,
      address: addressId,
      orderNotes: notes || '',
      paymentMethod,
      paymentStatus,
      discount,
    });

    console.log('Order to be Saved:', JSON.stringify(newOrder, null, 2));
    await newOrder.save();

    await Cart.updateOne({ userId }, { $set: { items: [] } });
    cart.appliedCoupon = null;
    cart.totalCartPrice = 0;
    await cart.save();

    console.log('Order Saved Successfully:', newOrder._id);
    res.status(200).json({ success: true, message: 'Order placed successfully!', orderId: newOrder._id });
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
