const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Category Schema
const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Category description is required'],
      trim: true,
    },
    isListed: {
      type: Boolean,
      default: true,
    },
    CategoryOffer: {
      type: Number,
      default: 0,
      required: false,
    },
  },
  { timestamps: true }
);

// Export Category Model
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
