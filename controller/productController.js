const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    res.render('product-add', {
      cat: category,
    });
  } catch (error) {
    res.redirect('/pageError');
  }
};

const addProducts = async (req, res) => {
  try {
    const products = req.body;
    const productExists = await Product.findOne({
      name: products.productName,
    });
    if (!productExists) {
      const images = [];
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const originalImagePath = req.files[i].path;
          const resizedImagePath = path.join(
            'public',
            'uploads',
            'product-images',
            `${Date.now()}-${req.files[i].filename}`
          );
          await sharp(originalImagePath)
            .resize({ width: 404, height: 440 })
            .toFile(resizedImagePath);
          images.push({
            url: `/uploads/product-images/${path.basename(resizedImagePath)}`, // URL to access the image
            altText: req.files[i].originalname, // Original name as alt text
          });
        }
      }

      const categoryId = await Category.findOne({ name: products.category });

      if (!categoryId) {
        return res.status(400).json('Invalid category name');
      }
      const newProduct = new Product({
        name: products.productName,
        description: products.description,
        category: categoryId._id,
        regularPrice: products.regularPrice,
        salePrice: products.salePrice,
        quantity: products.quantity,
        images: images,
        status: 'available',
        productOffer: products.productOffer || 0,
        createdOn: new Date(),
      });
      await newProduct.save();
      return res.redirect('/admin/addProducts');
    } else {
      return res
        .status(400)
        .json('Product already exists please try with another name');
    }
  } catch (error) {
    console.error('Error saving product', error);
    return res.redirect('/admin/pageError');
  }
};

module.exports = {
  getProductAddPage,
  addProducts,
};
