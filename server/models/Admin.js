const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      required: [true, "Admin name is required"],
      unique: true,
      minlength: [4, "admin name must be at least 4 characters long"],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "PAYMENT_ADMIN", "SUPPORT_ADMIN"],
      default: "SUPER_ADMIN",
    },
    permissions: [
      {
        type: String,
        enum: [
          "APPROVE_DEPOSITS",
          "APPROVE_WITHDRAWALS",
          "VIEW_TRANSACTIONS",
          "MANAGE_USERS",
          "VIEW_REPORTS",
        ],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  {
    timestamps: true,
  }
);

adminSchema.pre("save", async function (next) {
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
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
