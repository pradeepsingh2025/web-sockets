const mongoose = require('mongoose');

const transactionHistorySchema = new mongoose.Schema({
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  //how OrderId will be created:- it will decide on the time of creation a document of this model
  orderId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAWAL'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    required: true
  },
  tag: {
    type: String,
    enum: ['PROCESSING_PAYMENT', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    default: 'PROCESSING_PAYMENT'
  },
  description: {
    type: String,
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
  metadata: {
    utrNumber: String,
    upiId: String,
    adminRemarks: String,
    ipAddress: String,
    userAgent: String
  }
}, {
  timestamps: true
});


transactionHistorySchema.index({ userId: 1, createdAt: -1 });
transactionHistorySchema.index({ transactionId: 1 });
transactionHistorySchema.index({ orderId: 1 });

module.exports = mongoose.model('TransactionHistory', transactionHistorySchema);