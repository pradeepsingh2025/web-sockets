const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "userId is required"],
      unique: true,
    },
    phone: {
      type: Number,
      required: [true, "phone is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    upiId: {
      type: String,
      trim: true,
      match: [/^[\w.-]+@[\w.-]+$/, "Please enter a valid UPI ID"],
    },
    wallet: {
      balance: {
        type: Number,
        default: 0,
        min: [0, "Wallet balance cannot be negative"],
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    totalBets: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance methods
UserSchema.methods.updateBalance = function (amount) {
  this.balance += amount;
  this.lastActive = new Date();
  return this.save();
};

UserSchema.methods.addBet = function (betAmount, winAmount = 0) {
  this.totalBets += betAmount;
  if (winAmount > 0) {
    this.totalWins += winAmount;
  }
  this.lastActive = new Date();
  return this.save();
};

UserSchema.methods.getWinRate = function () {
  return this.totalBets > 0
    ? ((this.totalWins / this.totalBets) * 100).toFixed(2)
    : 0;
};

module.exports = mongoose.model("User", UserSchema);
