const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "REJECTED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },
    utrNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return this.type !== "DEPOSIT" || (v && v.length > 0);
        },
        message: "UTR number is required for deposits",
      },
    },
    upiId: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return this.type !== "WITHDRAWAL" || (v && v.length > 0);
        },
        message: "UPI ID is required for withdrawals",
      },
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    adminAction: {
      actionType: {
        type: String,
        enum: ["APPROVED", "REJECTED", "PAID"],
      },
      actionDate: Date,
      remarks: String,
    },
    paymentDetails: {
      gateway: String,
      transactionId: String,
      paymentDate: Date,
      screenshot: String,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: Date,
    completedAt: Date,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.pre("save", async function (next) {
  if (this.isModified("status")) {
    if (this.status === "PROCESSING") {
      this.processedAt = new Date();
    } else if (this.status === "COMPLETED") {
      this.completedAt = new Date();
    }
  }

  next();
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Transaction", transactionSchema);
