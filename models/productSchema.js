const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Product Schema
const productSchema = new Schema({
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
    price: {
        type: Number,
        required: [true, 'Product price is required'],
        min: [0, 'Price must be a positive number'],
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',  // Links product to the Category model
        required: [true, 'Product category is required'],
    },
    images: [{
        url: {
            type: String,
            required: [true, 'Image URL is required'],
        },
        altText: {
            type: String,
            default: '', // Optional alt text for accessibility
        },
    }],
    status: {
        type: String,
        enum: ['available', 'not available'],
        default: 'available',
    },
    stockQuantity: {
        type: Number,
        default: 0,  
        min: [0, 'Stock quantity must be a positive number'],
    },
    productOffer: {
        type: Number,
        required:false,
     },

}, { timestamps: true });



// Export Product Model
const Product = mongoose.model('Product', productSchema);
module.exports = Product;
