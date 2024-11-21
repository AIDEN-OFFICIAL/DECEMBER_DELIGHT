const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: { type: String, required: true }, 
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
  },
  expiredOn: {
    type: Date,
    required: true,
  },
  offerPrice: {
    type: Number,
    required: true,
  },
  minimumPrice: {
    type: Number,
    required: true,
  },
  totalUsageLimit: {
    type: Number,
    default: null, // No limit by default
  },  
  usesPerUser: {
    type: Number,
    default: null,
  },  
  isList: {
    type: Boolean,
    default: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = mongoose.model('Coupon', couponSchema);

