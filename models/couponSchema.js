const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
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

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
