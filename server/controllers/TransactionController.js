const TransactionService = require('../services/TransactionService');
const { validationResult } = require('express-validator');
const { successResponse, errorResponse } = require('../utils/Helpers');
const Transaction = require("../models/Transaction")

class TransactionController {
    static async createDeposit(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation errors', 400, errors.array());
      }

      const { amount, utrNumber } = req.body;
      const userId = req.user.id;
      
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const transaction = await TransactionService.createDeposit(userId, amount, utrNumber, metadata);
      
      return successResponse(res, 'Deposit request created successfully', {
        transaction: {
          orderId: transaction.orderId,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      }, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  static async createWithdrawal(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(res, 'Validation errors', 400, errors.array());
      }

      const { amount, upiId } = req.body;
      const userId = req.user.id;
      
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const transaction = await TransactionService.createWithdrawal(userId, amount, upiId, metadata);
      
      return successResponse(res, 'Withdrawal request created successfully', {
        transaction: {
          orderId: transaction.orderId,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.createdAt
        }
      }, 201);
    } catch (error) {
      return errorResponse(res, error.message, 400);
    }
  }

  static async getUserTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10, status } = req.query;

      const result = await TransactionService.getUserTransactions(userId, page, limit, status);
      
      return successResponse(res, 'Transactions fetched successfully', result);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  static async getTransactionDetails(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findOne({ orderId, userId })
        .populate('adminId', 'name email');

      if (!transaction) {
        return errorResponse(res, 'Transaction not found', 404);
      }

      return successResponse(res, 'Transaction details fetched successfully', { transaction });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = TransactionController