const { type } = require('@testing-library/user-event/dist/cjs/utility/type.js');
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  adminUsername:{
    type: String,
    required: [true, 'Admin username is required']
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


module.exports = mongoose.model('Admin', adminSchema);