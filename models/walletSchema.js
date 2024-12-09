const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const Schema = mongoose.Schema;

const walletSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 },
  transactions: [
    {
      transactionId: { type: String, default: () => uuidv4().substring(0, 8), }, // Automatically generates a UUID
      description: { type: String, required: true }, // "credited" or "debited"
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
