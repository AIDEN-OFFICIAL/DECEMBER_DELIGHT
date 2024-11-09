const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');

const getProfile = async (req, res) => {
    try {
        const user = req.session.user
        console.log(user);
        
        
        res.render('profile', { user })
        shop = false;
      } catch (error) {
      res.redirect('/pageError');
    }
}
  
module.exports = {
    getProfile,
}