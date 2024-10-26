const User = require('../models/userSchema');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();

const customerInfo = async (req, res) => {
  try {
    let search = req.query.search || '';
    let page = req.query.page || 1;

    const limit = 4;
    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: '.*' + search + '.*' } },
        { email: { $regex: '.*' + search + '.*' } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.countDocuments({
      isAdmin: false,
      $or: [
        { name: { $regex: '.*' + search + '.*' } },
        { email: { $regex: '.*' + search + '.*' } },
      ],
    });
    const totalPages = Math.ceil(count / limit);
    res.render('customers', {
      data: userData,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error retrieving customer data:', error);
    res.status(500).send('Server error while retrieving customer information');
  }
};

const customerBlocked = async (req, res) => {
  try {
    let id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/pageError');
  }
};
const customerUnblocked = async (req, res) => {
  try {
    let id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/pageError');
  }
};
module.exports = {
  customerInfo,
  customerBlocked,
  customerUnblocked,
};
