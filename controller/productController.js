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

const getAllProducts= async(req,res)=>{
  try {
    const search = req.query.search || "";
    const page = Math.max(1, parseInt(req.query.page) || 1);    const limit = 4;
    const productsData = await Product.find({
      name: { $regex: new RegExp('.*' + search + '.*', 'i') }
    })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('category')
      .exec();

    // Get count of all matching products for pagination
    const count = await Product.countDocuments({
      name: { $regex: new RegExp('.*' + search + '.*', 'i') }
    });

    const category = await Category.find({ isListed: true });
    if(category && category.length > 0){
        res.render("products", {
          data: productsData,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          cat: category,
        });
    }else{
        res.status(404).render("page-404");
      }
    } catch (error) {
      console.error("Error in getAllProducts:", error); 
      res.redirect("/pageError");
  }
}

const addProductOffer= async (req,res)=>{
    try {
      const { productId, percentage } = req.body;

      const parsedPercentage = parseInt(percentage);
      if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
        return res.status(400).json({ status: false, message: 'Invalid percentage value' });
      }

      const findProduct = await Product.findOne({ _id: productId });
      if (!findProduct) {
        return res.status(404).json({ status: false, message: 'Product not found' });
      }
        const findCategory= await Category.findOne({_id:findProduct.category});

        if(findCategory && findCategory.categoryOffer > parsedPercentage){
            return res.json({status:false,message:'This product  category already  has a category offer'});
        }

        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice * (parsedPercentage / 100)); 
      findProduct.productOffer = parsedPercentage;
      
        await findProduct.save();
        if (findCategory) {
          findCategory.categoryOffer = 0;
          await findCategory.save();
        }
        res.json({ status: true, message: 'Offer added successfully' });
    } catch (error) {
        console.error(error)
        res.redirect('/pageError')
        res.status(500).json({status:false,message:"Internal server error"})
    }
}

const removeProductOffer= async(req,res)=>{
    try {
        const {productId}=req.body;
      const findProduct = await Product.findOne({ _id: productId });
      if (!findProduct) {
        return res.status(404).json({ status: false, message: 'Product not found' });
      }
        const percentage=findProduct.productOffer;
        findProduct.salePrice=findProduct.salePrice+Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer=0;
        await findProduct.save();
        res.json({status:true})
    } catch (error) {
        res.redirect('/pageError');
    }
}

module.exports = {
  getProductAddPage,
  addProducts,
  getAllProducts,
  addProductOffer,
  removeProductOffer,
};
