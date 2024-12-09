const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const Order = require('../models/orderSchema');
const Wallet = require('../models/walletSchema');
const User = require('../models/userSchema');
const Address = require('../models/addressSchema');
const PDFDocument = require('pdfkit');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (user) {
      res.render('profile', { user });
    }
  } catch (error) {
    res.redirect('/pageError');
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    console.log(name, email, phone);

    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      { name, email, phone },
      { new: true }
    );
    if (user) {
      res.redirect('/profile');
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};
const manageAddress = async (req, res) => {
  try {
    const user = req.session.user;
    const addresses = await Address.find({ userId: user._id }).limit(3);
    console.log(addresses);
    res.render('manageAddress', { user, addresses });
  } catch (error) {
    console.error(error);
    res.redirect('/pageError');
  }
};

const addAddress = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    const { street, city, state, pinCode, country, phoneNumber } = req.body;
    const userId = req.session.user._id;

    const addressData = {
      street,
      city,
      state,
      pinCode,
      country,
      phoneNumber,
    };
    const addressExists = await Address.findOne({
      userId,
      address: {
        $elemMatch: {
          street: addressData.street,
          city: addressData.city,
          state: addressData.state,
          pinCode: addressData.pinCode,
          country: addressData.country,
        },
      },
    });
    if (addressExists) {
      console.log('Address already exists');
      return res.status(400).json({ message: 'This address already exists' });
    } else {
      let userAddress = await Address.findOne({ userId });

      if (userAddress) {
        userAddress.address.push(addressData);
        await userAddress.save();
        res.status(200).json({ message: 'Address added successfully' });
      } else {
        userAddress = new Address({
          userId,
          address: [addressData],
        });
        await userAddress.save();
        res.status(200).json({ message: 'Address added successfully' });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating address' });
  }
};

const updatePrimaryAddress = async (req, res) => {
  try {
    const { addressId, isDefault } = req.body;

    if (isDefault) {
      await Address.updateMany(
        { userId: req.session.user._id },
        { $set: { 'address.$[].isDefault': false } }
      );
    }

    const updatedAddress = await Address.updateOne(
      { 'address._id': addressId },
      { $set: { 'address.$.isDefault': isDefault } }
    );

    res.status(200).json({ message: 'Primary address updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error, please try again later' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    const result = await Address.updateOne(
      { userId },
      { $pull: { address: { _id: addressId } } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Address deleted successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    console.log('something went wrong while deleting');
    res.status(500).json({ message: 'Server error, please try again later' });
  }
};
const getEditAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    const allAddress = await Address.findOne({ userId: userId });
    if (allAddress) {
      const addressToEdit = allAddress.address.find(
        (addr) => addr._id.toString() === addressId
      );
      res.status(200).json({ address: addressToEdit });
    }
  } catch (error) {
    console.log('something went wrong while editing');
    res.status(500).json({ message: 'Server error, please try again later' });
  }
};
const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.user._id;
    console.log('User ID:', userId);
    console.log('Address ID:', addressId);

    const { street, city, state, pinCode, country, phoneNumber } = req.body;
    console.log(street, city, state, pinCode, country, phoneNumber);

    const result = await Address.updateOne(
      { userId: userId, 'address._id': addressId },
      {
        $set: {
          'address.$.street': street,
          'address.$.city': city,
          'address.$.state': state,
          'address.$.pinCode': pinCode,
          'address.$.country': country,
          'address.$.phoneNumber': phoneNumber,
        },
      }
    );
    if (result.modifiedCount > 0) {
      res.json({ message: 'Address updated successfully.' });
    } else {
      res.status(404).json({ message: 'Address not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating address.' });
  }
};
const getChangePassword = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    res.render('changePassword');
  } catch (error) {
    console.error(err);
    res.status(500).send('Error retrieving order history');
  }
};

const orderHistory = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.render('orderHistory', { user, orders });
  } catch (error) {
    console.error(err);
    res.status(500).send('Error retrieving order history');
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);

    const userId = req.session.user._id;
    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    }).populate('orderItems.productId');
    res.render('orderDetails', { order });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving order details');
  }
};
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findOneAndUpdate(
      { _id: orderId, userId: req.session.user._id },
      { status: 'Cancelled' },
      { new: true }
    );
    res.json({ success: true, message: 'Order status updated successfully!' });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found!' });
    }
    if (order.paymentMethod === 'COD') {
      console.log(`Order ${orderId} is COD. Refund not applicable.`);
      return;
    }
    let wallet = await Wallet.findOne({ userId: req.session.user._id });
    if (!wallet) {
      wallet = new Wallet({
        userId: req.session.user._id,
        balance: 0,
        transactions: [],
      });
    }

    const refundAmount = order.totalOrderPrice;
    if (isNaN(refundAmount) || refundAmount <= 0) {
      console.error(`Invalid refund amount: ${refundAmount}`);
      return res
        .status(400)
        .json({ success: false, message: 'Invalid refund amount!' });
    }
    wallet.balance += refundAmount;

    wallet.transactions.push({
      description: `Refund for cancelled order ${orderId}`,
      amount: refundAmount,
    });

    await wallet.save();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cancelling the order');
  }
};
const requestReturn = async (req, res) => {
  const { orderId } = req.params.orderId;
  try {
    const { orderId } = req.params;
    // Add logic to update the order's status to "Return Request"
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: 'Return Request' },
      { new: true }
    );

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Return request processed successfully',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId)
    .populate('userId', 'name email')
    .populate('orderItems.productId', 'name')
    let defaultAddress = null;

  if (!order || order.status !== 'Delivered') {
    return res.status(404).send('Invoice can only be generated for delivered orders.');
  }

  // Check if the address exists in the order
  const address = order.address;  // If using address as a single reference
  if (!address) {
    return res.status(400).send('No address found for this order.');
  }

    console.log(address);
    if (order.address) {
      const addressDoc = await Address.findOne(
        { 'address._id': order.address },
        { address: { $elemMatch: { _id: order.address } } }
      );
      defaultAddress = addressDoc ? addressDoc.address[0] : null;
    }
    // Extract address details safely
    const street = defaultAddress.street || 'N/A';
    const city = defaultAddress.city || 'N/A';
    const state = defaultAddress.state || 'N/A';
    const pinCode = defaultAddress.pinCode || 'N/A';
    const country = defaultAddress.country || 'N/A';

    // Create a new PDF document
    const doc = new PDFDocument();

    // Define file name and path
    const filename = `invoice-${order.orderId}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add company header
    doc
      .fontSize(18)
      .text('DecemberDelight', { align: 'center' })
      .fontSize(12)
      .text('Kalamassery, Kochi, Kerala', { align: 'center' })
      .text('Phone: +91 9846082343 | Email: support@decemberdelight.com', { align: 'center' })
      .moveDown();


    // Add invoice details
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    doc
      .fontSize(16)
      .text('Invoice', { align: 'left' })
      .moveDown()
      .fontSize(12)
      .text(`Invoice Date: ${invoiceDate}`)
      .text(`Invoice ID: ${order.orderId}`)
      .text(`Customer Name: ${order.userId.name}`)
      .text(`Email: ${order.userId.email}`)
      .moveDown();
    // Add order and address details
    doc
    .fontSize(15).text(`Order ID: ${order.orderId}`, { align: 'left' })
    .fontSize(14).text('Shipping Address:', { underline: true })
    doc.text(`Street: ${street}`);
    doc.text(`City: ${city}`);
    doc.text(`State: ${state}`);
    doc.text(`Pin Code: ${pinCode}`);
    doc.text(`Country: ${country}`);

    // Add order details
    doc.fontSize(14).text('Order Details:', { underline: true });
    let totalPrice = 0;

    order.orderItems.forEach((item, index) => {
      const itemTotal = item.quantity * item.price;
      totalPrice += itemTotal;

      doc
        .fontSize(12)
        .text(
          `${index + 1}. ${item.productId.name} - ${item.quantity} x Rs${item.price} = Rs${itemTotal.toFixed(2)}`
        );
    });

    // Add totals
    const discount = order.discount || 0;

    doc.moveDown();
    doc.text(`Discount: Rs${discount.toFixed(2)}`);
    doc.fontSize(14).text(`Total Order Price: Rs${totalPrice.toFixed(2)}`, { underline: true });

    // Add footer
    doc
      .moveDown()
      .fontSize(10)
      .text('Thank you for shopping with DecemberDelight!', { align: 'center' })
      .text('For any queries, contact support@decemberdelight.com', { align: 'center' });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).send('Failed to generate invoice.');
  }
};


module.exports = {
  getProfile,
  updateUserProfile,
  addAddress,
  manageAddress,
  updatePrimaryAddress,
  deleteAddress,
  getEditAddress,
  editAddress,
  orderHistory,
  getOrderDetails,
  cancelOrder,
  requestReturn,
  getChangePassword,
  generateInvoice,
};
