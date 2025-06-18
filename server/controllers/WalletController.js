const WalletService = require("../services/WalletService");
const { successResponse, errorResponse } = require("../utils/Helpers");

class WalletController {
  async getWalletBalance(req, res) {
    try {
      const userId = req.user.userId;
      const balance = await WalletService.getWalletBalance(userId);

      return successResponse(res, "Wallet balance fetched successfully", {
        balance,
      });
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }

  async getHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10 } = req.query;

      const result = await WalletService.getWalletHistory(userId, page, limit);

      return successResponse(
        res,
        "Wallet history fetched successfully",
        result
      );
    } catch (error) {
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = WalletController;
