const Transaction = require("../models/Transaction");
const TransactionHistory = require("../models/TransactionHistory");
const User = require("../models/User");
const NotificationService = require("./NotificationService");
const { generateOrderId } = require("../utils/Helpers");

class TransactionService {
  static async createDeposit(
    userId,
    amount,
    utrNumber,
    channel,
    metadata = {}
  ) {
    try {
      const user = await User.findOne({ userId });
      if (!user) throw new Error("User not found");

      const orderId = generateOrderId("DEPOSIT");

      const transaction = new Transaction({
        orderId,
        userId,
        type: "DEPOSIT",
        amount,
        utrNumber,
        channel,
        status: "PENDING",
      });

      await transaction.save();

      // Add to history
      await this.addToHistory(
        transaction,
        "Deposit request submitted",
        user.wallet.balance,
        metadata
      );

      // Notify admin
      await NotificationService.notifyAdminNewDeposit(transaction);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to create deposit: ${error.message}`);
    }
  }

  static async createWithdrawal(userId, amount, upiId, metadata = {}) {
    try {
      const user = await User.findOne({ userId });
      if (!user) throw new Error("User not found");

      if (user.wallet.balance < amount) {
        throw new Error("Insufficient wallet balance");
      }

      const orderId = generateOrderId("WITHDRAWAL");

      const transaction = new Transaction({
        orderId,
        userId,
        type: "WITHDRAWAL",
        amount,
        upiId,
        status: "PENDING",
      });

      await transaction.save();

      // Add to history
      await this.addToHistory(
        transaction,
        "Withdrawal request submitted",
        user.wallet.balance,
        metadata
      );

      // Notify admin
      await NotificationService.notifyAdminNewWithdrawal(transaction);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to create withdrawal: ${error.message}`);
    }
  }

  static async approveTransaction(transactionId, adminId, remarks = "") {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      if (transaction.status !== "PENDING") {
        throw new Error("Transaction cannot be approved in current status");
      }

      transaction.status = "PROCESSING";
      transaction.adminId = adminId;
      transaction.adminAction = {
        actionType: "APPROVED",
        actionDate: new Date(),
        remarks,
      };

      await transaction.save();

      // Update history
      await TransactionHistory.updateMany(
        { transactionId },
        { tag: "PROCESSING_PAYMENT" }
      );

      // Notify user
      await NotificationService.notifyUserTransactionApproved(transaction);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to approve transaction: ${error.message}`);
    }
  }

  static async rejectTransaction(transactionId, adminId, reason) {
    try {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) throw new Error("Transaction not found");

      transaction.status = "REJECTED";
      transaction.adminId = adminId;
      transaction.adminAction = {
        actionType: "REJECTED",
        actionDate: new Date(),
        remarks: reason,
      };

      await transaction.save();

      // Update history
      await TransactionHistory.updateMany(
        { transactionId },
        { tag: "REJECTED" }
      );

      // Notify user
      await NotificationService.notifyUserTransactionRejected(
        transaction,
        reason
      );

      return transaction;
    } catch (error) {
      throw new Error(`Failed to reject transaction: ${error.message}`);
    }
  }

  static async completeTransaction(transactionId, adminId, paymentDetails) {
    
    try {
      const transaction = await Transaction.findById(transactionId);
      console.log("tran service", transaction)
      if (!transaction) throw new Error("Transaction not found");
      
      transaction.status = "COMPLETED";
      transaction.adminId = adminId;
      transaction.adminAction = {
        actionType: "COMPLETED",
        actionDate: new Date(),
        remarks: paymentDetails,
      };

      console.log("just check")

      await transaction.save();
       
      console.log("after saving trns", transaction)
      // Update history
      await TransactionHistory.updateMany(
        { transactionId },
        { tag: "COMPLETED" }
      );

      // Notify user
      await NotificationService.notifyUserTransactionCompleted(
        transaction,
        paymentDetails
      );

      return transaction;
    } catch (error) {
      throw new Error(`${error}`);
      
    }
  }

  static async addToHistory(
    transaction,
    description,
    currentBalance,
    metadata = {}
  ) {
    const history = new TransactionHistory({
      transactionId: transaction._id,
      userId: transaction.userId,
      orderId: transaction.orderId,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      description,
      balanceBefore: currentBalance,
      balanceAfter: currentBalance,
      metadata: {
        channel: transaction.channel,
        utrNumber: transaction.utrNumber,
        upiId: transaction.upiId,
        ...metadata,
      },
    });

    await history.save();
    return history;
  }

  static async getUserTransactions(userId) {
    try {
      const transactions = await Transaction.find({ userId }).sort({
        createdAt: -1,
      });

      if (!transactions) throw new Error("no transactions found");

      return {
        transactions,
      };
    } catch (error) {
      throw new Error("error fetching user transactions");
    }
  }

  static async getPendingTransactions(type = null, page = 1, limit = 10) {
    const query = { status: "PENDING" };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    return transactions;
  }
}

module.exports = TransactionService;
