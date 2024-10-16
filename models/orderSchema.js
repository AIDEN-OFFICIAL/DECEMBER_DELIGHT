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
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled',
        'Return Request',
        'Returned',
      ],
      default: 'Pending',
    },
    couponApplied: {
      type: Boolean,
      default: false,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  let total = 0;
  this.orderItems.forEach((orderItem) => {
    orderItem.itemTotalPrice = orderItem.quantity * orderItem.price;
    total += orderItem.itemTotalPrice;
  });
  this.totalOrderPrice = total;
  this.finalAmount = total - this.discount;
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
