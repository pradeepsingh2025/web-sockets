const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  type: {
    type: String,
    enum: ['CREDIT', 'DEBIT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ transactionId: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);