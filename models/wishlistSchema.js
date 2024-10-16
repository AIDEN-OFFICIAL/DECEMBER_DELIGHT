const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Wishlist Schema
const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",  // Corrected typo from 'res' to 'ref'
        required: true,
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        addedOn: {
            type: Date,
            default: Date.now,  // Automatically set the date when a product is added
        },
    }]
}, { timestamps: true });  // Automatically adds `createdAt` and `updatedAt` fields

// Export Wishlist Model
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
module.exports = Wishlist;
 