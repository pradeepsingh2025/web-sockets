const TransactionService = require("../services/TransactionService");
const Transaction = require("../models/Transaction");
const { successResponse, errorResponse } = require("../utils/Helpers");

class AdminController {
  static async getPendingTransactions(req, res) {
    try {
      const { type, page = 1, limit = 10 } = req.query;

      const transactions = await TransactionService.getPendingTransactions(
        type,
        page,
        limit
      );

      return successResponse(res, "Pending transactions fetched successfully", {
        transactions,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  static async approveTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { remarks } = req.body;
      const adminId = req.admin.id;

      const transaction = await TransactionService.approveTransaction(
        transactionId,
        adminId,
        remarks
      );

      return successResponse(res, "Transaction approved successfully", {
        transaction,
      });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  static async completeTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { paymentDetails } = req.body;
      const adminId = req.admin.id;

      const result = await TransactionService.completeTransaction(
        transactionId,
        adminId,
        paymentDetails
      );

      return successResponse(res, "Transaction completed successfully", result);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  static async rejectTransaction(req, res) {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const adminId = req.admin.id;

      const transaction = await TransactionService.rejectTransaction(
        transactionId,
        adminId,
        reason
      );

      return successResponse(res, "Transaction rejected successfully", {
        transaction,
      });
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  static async getTransactionStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const matchQuery = {};
      if (startDate && endDate) {
        matchQuery.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const stats = await Transaction.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: { type: "$type", status: "$status" },
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);

      return successResponse(res, "Transaction stats fetched successfully", {
        stats,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = AdminController
