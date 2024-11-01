const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const User = require('../models/userSchema');
const fs = require('fs');
const path = require('path');

const getProductAddPage = async (req, res) => {
  try {
    const category = await Category.find({ isListed: true });
    res.render('product-add', {
      cat: category,
    });
  } catch (error) {
    res.redirect('/admin/pageError');
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
        const base64Data = croppedImages[i].replace(
          /^data:image\/\w+;base64,/,
          ''
        ); // Remove base64 header
        const buffer = Buffer.from(base64Data, 'base64'); // Convert base64 to buffer
        const filename = `${Date.now()}-${i}.jpg`;
        const filePath = path.join(
          'public',
          'uploads',
          'product-images',
          filename
        );

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
      return res
        .status(400)
        .json('Product already exists, please try with another name');
    }
  } catch (error) {
    console.error('Error saving product', error);
    return res.redirect('/admin/pageError');
  }
};

const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 4;
    const productsData = await Product.find({
      name: { $regex: new RegExp('.*' + search + '.*', 'i') },
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('category')
      .exec();

    // Get count of all matching products for pagination
    const count = await Product.countDocuments({
      name: { $regex: new RegExp('.*' + search + '.*', 'i') },
    });

    const category = await Category.find({ isListed: true });
    if (category && category.length > 0) {
      res.render('products', {
        data: productsData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
      });
    } else {
      res.status(404).render('page-404');
    }
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.redirect('/admin/pageError');
  }
};

const addProductOffer = async (req, res) => {
  try {
    const { productId, percentage } = req.body;

    const parsedPercentage = parseInt(percentage);
    if (
      isNaN(parsedPercentage) ||
      parsedPercentage < 0 ||
      parsedPercentage > 100
    ) {
      return res
        .status(400)
        .json({ status: false, message: 'Invalid percentage value' });
    }

    const findProduct = await Product.findOne({ _id: productId });
    if (!findProduct) {
      return res
        .status(404)
        .json({ status: false, message: 'Product not found' });
    }
    const findCategory = await Category.findOne({ _id: findProduct.category });

    if (findCategory && findCategory.CategoryOffer > parsedPercentage) {
      return res.json({
        status: false,
        message: 'This product  category already  has a category offer',
      });
    }

    findProduct.salePrice =
      findProduct.salePrice -
      Math.floor(findProduct.regularPrice * (parsedPercentage / 100));
    findProduct.productOffer = parsedPercentage;

    await findProduct.save();
    if (findCategory) {
      findCategory.CategoryOffer = 0;
      await findCategory.save();
    }
    res.json({ status: true, message: 'Offer added successfully' });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/pageError');
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const removeProductOffer = async (req, res) => {
  try {
    const { productId } = req.body;
    const findProduct = await Product.findOne({ _id: productId });
    if (!findProduct) {
      return res
        .status(404)
        .json({ status: false, message: 'Product not found' });
    }
    const percentage = findProduct.productOffer;
    findProduct.salePrice =
      findProduct.salePrice +
      Math.floor(findProduct.regularPrice * (percentage / 100));
    findProduct.productOffer = 0;
    await findProduct.save();
    res.json({ status: true });
  } catch (error) {
    res.redirect('/admin/pageError');
  }
};

const blockProduct = async (req, res) => {
  try {
    let id = req.query.id;

    const result = await Product.updateOne(
      { _id: id },
      { $set: { isBlocked: true } }
    );

    if (result.modifiedCount === 1) {
      res.redirect('/admin/products');
    } else {
      console.error('Product not found or update failed');
      res.redirect('/admin/pageError');
    }
  } catch (error) {
    console.error('Error while blocking product:', error);
    res.redirect('/admin/pageError');
  }
};

const unblockProduct = async (req, res) => {
  try {
    let id = req.query.id;
    await Product.updateOne({ _id: id }, { $set: { isBlocked: false } });
    res.redirect('/admin/products');
  } catch (error) {
    console.error(error);
    res.redirect('/pageerror');
  }
};

const getEditProduct = async (req, res) => {
  try {
    let id = req.query.id;
    const product = await Product.findOne({ _id: id }).populate('category');
    const category = await Category.find({});

    res.render('edit-product', {
      product: product,
      cat: category,
    });
  } catch (error) {
    res.redirect('/admin/pageError');
  }
};

const editProduct = async (req, res) => {
  try {
  let id = req.params.id;
  const product = await Product.findOne({ _id: id });
  const data = req.body;
  const existingProduct = await Product.findOne({
    name: data.productName,
    _id: { $ne: id },
  });

  if (existingProduct) {
    return res
      .status(400)
      .json({
        success: false,
        error:
          'Product with this name already exists. Please try with another name',
      });
  }
  const category = await Category.findById(data.category);
  
  if (!category) {
    return res
      .status(400)
      .json({ success: false, error: 'Invalid category name.' });
  }
  const newImages = [];
  if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
      newImages.push({
        url: `/uploads/product-images/${req.files[i].filename}`,
        altText: `Product image ${i + 1}`,
      });
    }
  }
  console.log("New images being saved:", newImages);

  const updateFields = {
    name: data.productName,
    description: data.description,
    category: category._id,
    regularPrice: data.regularPrice,
    salePrice: data.salePrice,
    quantity: data.quantity,
  };

  if (newImages.length > 0) {
    updateFields.images = [...product.images, ...newImages]; // Combine existing images with new images
  }

  await Product.findByIdAndUpdate(id, updateFields, { new: true });
  res.status(200).json({ success: true }); // Send success response
} catch (error) {
  console.error(error);
  res.redirect('/admin/pageError');
}
};

const deleteImage= async (req,res)=>{
  try {
      const {imageId,productId}=req.body;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const imageIndex = product.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    const imageUrl = product.images[imageIndex].url;

    product.images.splice(imageIndex, 1);
    await product.save();

    const imagePath = path.join(__dirname, '../public/uploads/product-images', imageUrl.split('/').pop());
      if(fs.existsSync(imagePath)){
           fs.unlinkSync(imagePath);
           console.log(`Image file ${imageUrl} deleted successfully`);
          }else{
            console.log(`Image file ${imageUrl} not found on server`);
          }
          res.json({ success: true, message: 'Image deleted successfully' });
        } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error occurred' });
    }
}
module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  addProductOffer,
  removeProductOffer,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
  deleteImage,
};
