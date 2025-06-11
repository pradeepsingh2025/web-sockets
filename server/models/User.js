const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  totalBets: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Instance methods
UserSchema.methods.updateBalance = function(amount) {
  this.balance += amount;
  this.lastActive = new Date();
  return this.save();
};

UserSchema.methods.addBet = function(betAmount, winAmount = 0) {
  this.totalBets += betAmount;
  if (winAmount > 0) {
    this.totalWins += winAmount;
  }
  this.lastActive = new Date();
  return this.save();
};

UserSchema.methods.getWinRate = function() {
  return this.totalBets > 0 ? (this.totalWins / this.totalBets * 100).toFixed(2) : 0;
};

module.exports = mongoose.model('User', UserSchema);