const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Coupon = require('../models/couponSchema');
const Order = require('../models/orderSchema');
const Address = require('../models/addressSchema');

const getCoupons = async (req, res) => {
  try {
    const searchQuery = req.query.search || ''; // To handle search functionality
    const currentPage = parseInt(req.query.page) || 1;
    const itemsPerPage = 10;

    // Fetch coupons with optional search
    const filter = searchQuery
      ? { code: { $regex: searchQuery, $options: 'i' } } // Case-insensitive search on 'code'
      : {};

    const totalCoupons = await Coupon.countDocuments(filter);
    const totalPages = Math.ceil(totalCoupons / itemsPerPage);

    const coupons = await Coupon.find(filter)
      .skip((currentPage - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .sort({ createdAt: -1 }); 

    res.render('coupon', {
      coupons,
      currentPage,
      totalPages,
      searchQuery,
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).send('Internal Server Error');
  }
};

const addCoupon = async (req, res) => {
  try {
    const { name, description, offerPrice, minimumPrice, expiredOn } = req.body;

    if (!name || !description || !offerPrice || !minimumPrice || !expiredOn) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existingCoupon = await Coupon.findOne({ name });
    if (existingCoupon) {
      return res.status(400).json({ success: false, message: 'A coupon with this name already exists.' });
    }

    const newCoupon = new Coupon({
      name,
      description,
      offerPrice,
      minimumPrice,
      expiredOn,
    });

    await newCoupon.save();
      res.status(201).json({ success: true, message: 'Coupon added successfully!' });
      
  } catch (error) {
    console.error(error);
      res.status(500).json({ success: false, message: 'Server error. Please try again.' });
        
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const {couponId} = req.params;
console.log(couponId);

    // Find and delete the coupon
    const deletedCoupon = await Coupon.findByIdAndDelete(couponId);

    if (!deletedCoupon) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    res.status(200).json({ success:true,message: 'Coupon deleted successfully.' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Failed to delete coupon. Please try again later.' });
  }
};


const editCoupon = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const coupon = await Coupon.findById(couponId);
      
    
    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found.' });
    }

    res.render('edit-coupon', { coupon });
  } catch (error) {
    console.error('Error fetching coupon for edit:', error);
    res.status(500).json({ error: 'Failed to fetch coupon for editing.' });
  }
};


// Controller to update the coupon in the database
const updateCoupon = async (req, res) => {
    try {
      const { couponId } = req.params;
      const { name, description, offerPrice, minimumPrice, expiredOn } = req.body;
  
      // Validate input data
      if (!name || !description || !offerPrice || !minimumPrice || !expiredOn) {
        return res.status(400).json({ error: 'All fields are required.' });
        }
        console.log(name, description, offerPrice, minimumPrice, expiredOn );
        

      // Find the coupon and update its details
      const updatedCoupon = await Coupon.findByIdAndUpdate(
        couponId,
        { name, description, offerPrice, minimumPrice, expiredOn },
        { new: true }
      );
  
      if (!updatedCoupon) {
        return res.status(404).json({ error: 'Coupon not found.' });
      }
  
      res.status(200).json({ success: true, message: 'Coupon updated successfully.' });
    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ error: 'Failed to update coupon. Please try again later.' });
    }
  };
  

module.exports = {
    getCoupons,
    addCoupon,
    deleteCoupon,
    editCoupon,
    updateCoupon,
    
};