const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'PAYMENT_ADMIN', 'SUPPORT_ADMIN'],
    default: 'PAYMENT_ADMIN'
  },
  permissions: [{
    type: String,
    enum: ['APPROVE_DEPOSITS', 'APPROVE_WITHDRAWALS', 'VIEW_TRANSACTIONS', 'MANAGE_USERS', 'VIEW_REPORTS']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

adminSchema.index({ email: 1 });

module.exports = mongoose.model('Admin', adminSchema);