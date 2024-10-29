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
      const croppedImages = JSON.parse(products.croppedImages || '[]'); // Retrieve the cropped images array

      for (let i = 0; i < croppedImages.length; i++) {
        const base64Data = croppedImages[i].replace(/^data:image\/\w+;base64,/, ''); // Remove base64 header
        const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer
        const filename = `${Date.now()}-${i}.jpg`;
        const filePath = path.join('public', 'uploads', 'product-images', filename);

        // Save the decoded file buffer
        fs.writeFileSync(filePath, buffer);

        images.push({
          url: `/uploads/product-images/${filename}`, // URL to access the image
          altText: `Product image ${i + 1}`, // Generic alt text, can be customized
        });
      }

      const categoryId = await Category.findOne({ name: products.category });
      if (!categoryId) {
        return res.status(400).json('Invalid category name');
      }

      // Create the new product document
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
      return res.status(400).json('Product already exists, please try with another name');
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
