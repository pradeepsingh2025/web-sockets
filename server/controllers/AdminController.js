const TransactionService = require("../services/TransactionService");
const Transaction = require("../models/Transaction");
const Admin = require("../models/Admin");
const { successResponse, errorResponse } = require("../utils/Helpers");
const { generateTokenForAdmin } = require("../utils/jwt");

class AdminController {
  //admin creation
  async createAdmin(req, res) {
    try {
      const { adminName, password, role, permissions } = req.body;

      if (!adminName || !password) {
        return errorResponse(res, "admin name and password are required", 400);
      }

      if (password.length < 8) {
        return errorResponse(res, "Password must be atleast 8 character long");
      }

      const existingAdmin = await Admin.findOne({ adminName });
      if (existingAdmin) {
        return errorResponse(
          res,
          "Admin with this admin name already exists",
          409
        );
      }

      const admin = new Admin({ adminName, password, role, permissions });
      await admin.save();

      successResponse(res, "admin created successfully", 201);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  //admin login authentication

  async getAdmin(req, res) {
    try {
      const { adminName, password } = req.body;

      if (!adminName || !password) {
        errorResponse(res, "admin name and password are required", 400);
      }

      const admin = await Admin.findOne({ adminName });
      if (!admin) {
        return errorResponse(res, "admin not found", 404);
      }
      console.log(admin.adminName);
      console.log(admin.role);

      const isPasswordCorrect = await admin.comparePassword(password);
      if (!isPasswordCorrect) {
        return errorResponse(res, "Invalid password");
      }

      // Generate JWT token
      const admin_token = generateTokenForAdmin(admin.adminName, admin.role);

      // res.cookie("adminToken", admin_token, {
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "strict",
      //   path: "/",
      //   maxAge: 60 * 60 * 1000,
      // });

      return successResponse(res, "Succesfully logged in as Admin",{
        token : admin_token
      }, 201);
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getPendingTransactions(req, res) {
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

  async approveTransaction(req, res) {
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

  async completeTransaction(req, res) {
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

  async rejectTransaction(req, res) {
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

  async getTransactionStats(req, res) {
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

  // GET /api/admin/transactions?page=1&limit=10
  async getAllTransactions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        Transaction.find()
          .sort({ createdAt: -1 }) // newest first
          .skip(skip)
          .limit(limit),
        Transaction.countDocuments(),
      ]);

      return successResponse(res, "Transactions fetched", {
        transactions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = AdminController;
