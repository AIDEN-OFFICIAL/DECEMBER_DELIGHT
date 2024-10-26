const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Cart Schema
const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
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
        totalPrice: {
          type: Number,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalCartPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'ordered', 'canceled'],
      default: 'active', // Cart status (active before order, ordered after checkout, canceled if discarded)
    },
  },
  { timestamps: true }
);

cartSchema.pre('save', function (next) {
  let total = 0;
  this.items.forEach((item) => {
    item.totalPrice = item.quantity * item.price;
    total += item.totalPrice; // Sum the total price for each item in the cart
  });
  this.totalCartPrice = total;
  next();
});

// Export Cart Model
const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
