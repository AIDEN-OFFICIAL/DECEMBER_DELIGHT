const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const Order = require('../models/orderSchema');
const User = require('../models/userSchema');
const Address = require('../models/addressSchema');

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
        console.log("Request body:", req.body)
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
      }
      else {
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

const updatePrimaryAddress= async (req, res) => {
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

const deleteAddress = async(req, res)=> {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id
    const result = await Address.updateOne({ userId }, { $pull: { address: { _id: addressId } } });
    
    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Address deleted successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    console.log("something went wrong while deleting");
    res.status(500).json({ message: 'Server error, please try again later' });
  }
}
const getEditAddress = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id    
    const allAddress = await Address.findOne({ userId:userId});
    if (allAddress  ) {
      const addressToEdit = allAddress.address.find(addr => addr._id.toString() === addressId);
      res.status(200).json({ address: addressToEdit });      
    }
  } catch (error) {
    console.log("something went wrong while editing");
    res.status(500).json({ message: 'Server error, please try again later' });
  }
}
const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const userId = req.session.user._id
    console.log("User ID:", userId);
console.log("Address ID:", addressId);

    const { street, city, state, pinCode, country, phoneNumber } = req.body;
    console.log(street, city, state, pinCode, country, phoneNumber);
    
    const result = await Address.updateOne(
      { userId: userId, "address._id": addressId },
      {
        $set: {
          "address.$.street": street,
          "address.$.city": city,
          "address.$.state": state,
          "address.$.pinCode": pinCode,
          "address.$.country": country,
          "address.$.phoneNumber": phoneNumber,
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

const orderHistory = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.render('orderHistory', { user, orders });


  } catch (error) {
    console.error(err);
    res.status(500).send("Error retrieving order history");
  }
  
}
const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    console.log(orderId);
    
    const userId = req.session.user._id
      const order = await Order.findOne({ _id: orderId, userId:userId }).populate('orderItems.productId');
      res.render('orderDetails', { order });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving order details");
  }
};
const cancelOrder = async (req, res) => {
  try {
      const orderId = req.params.orderId;
      await Order.updateOne({ _id: orderId, userId: req.session.user._id }, { status: 'Cancelled' });
      res.json({ success: true, message: 'Order status updated successfully!' });
    } catch (err) {
      console.error(err);
      res.status(500).send("Error cancelling the order");
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
};
