const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const Order = require('../models/orderSchema');
const User = require('../models/userSchema');
const Address = require('../models/addressSchema');
const Wishlist = require('../models/wishlistSchema'); 


const addToWishlist = async (req,res)=>{
    try {
        const { productId, action } = req.body;
        const userId = req.session.user._id; 
        if (action === 'add') {
            await Wishlist.updateOne(
                { userId },
                { $addToSet: { items: { productId } } }, 
                { upsert: true } 
            );
        } else if (action === 'remove') {
            // Remove product from wishlist
            await Wishlist.updateOne(
                { userId },
                { $pull:{ items: { productId } } }
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'An error occurred' });
    }
}
const deleteWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.session.user._id; 

        await Wishlist.updateOne(
            { userId },
            { $pull: { items: { productId } } }
        );

        res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
    } catch (error) {
        console.error('Error removing product from wishlist:', error);
        res.status(500).json({ success: false, message: 'Failed to remove product.' });
    }
}

module.exports = {
    addToWishlist,
    deleteWishlist,
}