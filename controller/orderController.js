const User = require('../models/userSchema');
const Product = require('../models/productSchema');
const Cart = require('../models/cartSchema');
const Order = require('../models/orderSchema');
const Address = require('../models/addressSchema');
const nodemailer = require('nodemailer');
const { error } = require('jquery');
const env = require('dotenv').config();

const getOrder = async (req, res) => {
    try {
        
        const user = req.session.user;
        const userId = req.session.user._id;
        const cartAmount = await Cart.findOne({ userId: user._id, status: 'active' })
        const addressDoc = await Address.findOne({ userId }).sort({ createdAt: -1 }).limit(3);
        const addresses = addressDoc ? addressDoc.address : [];
        const cart = await Cart.findOne({ userId: user._id, status: 'active' }).populate('items.productId');
 
        const defaultAddress = await Address.findOne({ userId: user._id,'address.isDefault': true },{'address.$':1});
        
        res.render('checkout', { success: false, user, error: false, cartAmount ,user,addresses,cart,defaultAddress: defaultAddress.address[0]})

    } catch (error) {
        console.log("Error while getting the order page", error)
        
    }
}
const placeOrder = async (req, res) => {
    try {
        const error = false;
        const {selectedAddress, name, email, country, street, city, state, pinCode, phone, notes } = req.body;
        const userId = req.session.user._id;
        let addressId;


        // Look for an existing address with the same details for the user
        let userAddressDoc = await Address.findOne({ userId })
        if (selectedAddress) {
            const parsedAddress = JSON.parse(selectedAddress);
            addressId = parsedAddress._id; // Use the selected address
        } else {
            const addressData = { street, city, state, pinCode, country, phone };
            if (userAddressDoc) {
                // Find the matched address ID within the array of addresses
                const matchedAddress = userAddressDoc.address.find(addr =>
                    addr.street === addressData.street &&
                    addr.city === addressData.city &&
                    addr.state === addressData.state &&
                    addr.pinCode === addressData.pinCode &&
                    addr.country === addressData.country
                );
                if (matchedAddress) {
                    addressId = matchedAddress._id; // This ID is passed to the Order schema
                }
                else {
                    userAddressDoc.address.push(addressData);
                    const savedUserAddress = await userAddressDoc.save();
                    addressId = savedUserAddress.address[savedUserAddress.address.length - 1]._id;
                }
            } else {
                // Create a new Address document for the user with the new address
                const newUserAddress = new Address({
                    userId,
                    address: [addressData],
                });
                const savedNewAddress = await newUserAddress.save();
                addressId = savedNewAddress.address[0]._id;
            }
        }
        // Fetch the user's active cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        // Update stock levels for each product in the cart
        for (const item of cart.items) {
            const product = item.productId;
            if (product.quantity < item.quantity) {
                    error= `Insufficient stock for product: ${product.name}. Available: ${product.quantity}.`
            }
            product.quantity -= item.quantity;
            await product.save();
        }
        // Create a new order
        const newOrder = new Order({
            userId,
            orderItems: cart.items.map(item => ({
                productId: item.productId._id,
                quantity: item.quantity,
                price: item.productId.salePrice,
                weight: item.weight,
                itemTotalPrice: item.productId.salePrice * item.quantity
            })),
            totalOrderPrice: cart.totalCartPrice,
            finalAmount: cart.totalCartPrice, // Adjust as needed for discounts
            address: addressId, // Use the correct address ID
            orderNotes: notes || ''
        });

        await newOrder.save(); // Save the order

        // Clear the cart
        await Cart.updateOne({ userId }, { $set: { items: [] } });

        res.render('checkout', { success: true, user: req.session.user,error, cartAmount: 0, defaultAddress: null });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getOrder,
    placeOrder,
    

}