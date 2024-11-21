const Product = require('../models/productSchema');
const Category = require('../models/categorySchema');
const Cart = require('../models/cartSchema');
const User = require('../models/userSchema');
const Wallet = require('../models/walletSchema');

const getWallet=async (req, res) => {
    try {
        const user = req.session.user
        const userId =  req.session.user._id 
        
        const cartAmount = await Cart.findOne({ userId:userId, status: 'active' })
      const wallet = await Wallet.findOne({ userId:userId }); 
      res.render("wallet", { wallet ,user,cartAmount });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).send("Internal Server Error");
    }
  }
  
  const addMoney =async (req, res) => {
    const { amount } = req.body;
  
    try {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: req.session.user._id},
        { $inc: { balance: amount }, $push: { transactions: {
          description: "credited",
          amount,
        }}},
        { new: true, upsert: true }
      );
  
      res.json({ success: true, balance: wallet.balance });
    } catch (error) {
      console.error("Error adding money:", error);
      res.status(500).json({ success: false, message: "Failed to add money" });
    }
  }
  
module.exports = {
    getWallet,
    addMoney,
  };