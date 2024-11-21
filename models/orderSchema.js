const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      default: uuidv4,
      unique: true,
    },
    userId: { 
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity cannot be less than 1'],
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        weight: {
          type: Number, 
          required: true,
        },
        itemTotalPrice: {
          type: Number,
        },
      },
    ],
    totalOrderPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    address: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'Pending',
        'Order Placed',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
        'Return Request',
        'Returned',
      ],
      default: 'Order Placed',
    },
    couponApplied: {
      type: Boolean,
      default: false,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    orderNotes: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['COD', 'Razorpay','Wallet'], // Extend as needed
      default: 'COD',
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
