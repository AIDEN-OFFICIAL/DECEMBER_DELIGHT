const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Schema
const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
    },
    regularPrice: {
      type: Number,
      required: [true, 'Regular price is required'],
      min: [0, 'Regular price must be a positive number'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price must be a positive number'],
      validate: {
        validator: function (value) {
          // salePrice must be less than or equal to regularPrice
          return value <= this.regularPrice;
        },
        message: 'Sale price should be less than or equal to the regular price',
      },
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category', // Links product to the Category model
      required: [true, 'Product category is required'],
    },
    images: [
      {
        url: {
          type: String,
          required: [true, 'Image URL is required'],
        },
        altText: {
          type: String,
          default: '', // Optional alt text for accessibility
        },
      },
    ],
    isBlocked: {
      type: Boolean,
      default:false,
    },
    status: {
      type: String,
      enum: ['available', 'not available'],
      default: 'available',
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock quantity must be a positive number'],
    },
    productOffer: {
      type: Number,
      required: false,
    },
    weights: { 
      type: [Number], 
      required: [true, 'Weights are required'],
    },
  },
  { timestamps: true }
);

// Export Product Model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
