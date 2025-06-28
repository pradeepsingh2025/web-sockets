const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const WalletTransaction = require("../models/WalletTransaction");
const TransactionHistory = require("../models/TransactionHistory");

class WalletService {
  static async processTransaction(transactionId, adminId, paymentDetails) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const transaction = await Transaction.findById(transactionId).session(
        session
      );
      if (!transaction) throw new Error("Transaction not found in proccessing transactions");

      const user = await User.findOne({ userId: transaction.userId }).session(
        session
      );
      if (!user) throw new Error("User not found in proccessing transactions");

      const balanceBefore = user.wallet.balance;
      let balanceAfter;

      // Calculate new balance
      if (transaction.type === "DEPOSIT") {
        balanceAfter = balanceBefore + transaction.amount;
      } else if (transaction.type === "WITHDRAWAL") {
        if (balanceBefore < transaction.amount) {
          throw new Error("Insufficient wallet balance");
        }
        balanceAfter = balanceBefore - transaction.amount;
      }

      // Update user wallet
      user.wallet.balance = balanceAfter;
      user.wallet.lastUpdated = new Date();
      await user.save({ session });

      // Update transaction
      transaction.status = "COMPLETED";
      transaction.adminId = adminId;
      transaction.adminAction = {
        ...transaction.adminAction,
        actionType: transaction.type === "WITHDRAWAL" ? "PAID" : "APPROVED",
        actionDate: new Date(),
        remarks: paymentDetails,
      };
      // transaction.paymentDetails = paymentDetails;
      await transaction.save({ session });

      // Create wallet transaction record
      const walletTransaction = new WalletTransaction({
        userId: transaction.userId,
        transactionId: transaction._id,
        type: transaction.type === "DEPOSIT" ? "CREDIT" : "DEBIT",
        amount: transaction.amount,
        balanceBefore,
        balanceAfter,
        description: `${transaction.type} - ${transaction.orderId}`,
        orderId: transaction.orderId,
      });
      await walletTransaction.save({ session });

      // Update history
      await TransactionHistory.updateMany(
        { transactionId },
        {
          tag: "COMPLETED",
          balanceBefore,
          balanceAfter,
          "metadata.adminRemarks": transaction.adminAction.remarks,
        },
        { session }
      );

      await session.commitTransaction();

      return transaction

      // return {
      //   transaction,
      //   user,
      //   walletTransaction,
      //   balanceBefore,
      //   balanceAfter,
      // };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async getWalletBalance(userId) {
    const user = await User.findOne({ userId }).select("wallet");
    return user ? user.wallet.balance : 0;
  }

  static async getWalletHistory(userId, page = 1, limit = 10) {
    const walletTransactions = await WalletTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("transactionId", "orderId type status");

    const total = await WalletTransaction.countDocuments({ userId });

    return {
      transactions: walletTransactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    };
  }
}

module.exports = WalletService;
