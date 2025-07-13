const TransactionService = require("../services/TransactionService");
const { validationResult } = require("express-validator");
const { successResponse, errorResponse } = require("../utils/Helpers");
const Transaction = require("../models/Transaction");

class TransactionController {
  async createDeposit(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation errors", 400, errors.array());
      }

      const { amount, utrNumber, channel } = req.body;
      const userId = req.user.userId;

      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      };

      const transaction = await TransactionService.createDeposit(
        userId,
        amount,
        utrNumber,
        channel,
        metadata
      );

      return successResponse(
        res,
        `Deposit request created successfully, please wait if you deposited money, it will be
        added in your wallet as soon as possible. Thank you!`,
        201
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async createWithdrawal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, "Validation errors", 400, errors.array());
      }

      const { amount, upiId } = req.body;
      const userId = req.user.userId;

      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      };

      const transaction = await TransactionService.createWithdrawal(
        userId,
        amount,
        upiId,
        metadata
      );

      return successResponse(
        res,
        "Withdrawal Request Created Successfully",
        201
      );
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  async getUserTransactions(req, res) {
    try {
      const userId = req.user.userId;

      const result = await TransactionService.getUserTransactions(userId);

      return successResponse(res, "Transactions fetched successfully", result);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getTransactionDetails(req, res) {
    try {
      const { orderId, userId } = req.query;

      const query = {};
      if (orderId) query.orderId = orderId;
      if (userId) query.userId = userId;

      if (Object.keys(query).length === 0) {
        return errorResponse(
          res,
          "At least orderId or userId is required",
          400
        );
      }

      const transaction = await Transaction.findOne(query);

      if (!transaction) {
        return errorResponse(res, "Transaction not found", 404);
      }

      return successResponse(res, "Transaction details fetched successfully", {
        transaction,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = TransactionController;
