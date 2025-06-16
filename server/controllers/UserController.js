const User = require("../models/User");
const {
  successResponse,
  errorResponse,
} = require("../utils/Helpers");
const { validationResult } = require("express-validator");

class UserController {
  constructor(bettingService) {
    this.bettingService = bettingService;
  }

  async getUserStats(req, res) {
    try {
      const userId = req.user;
      const stats = await this.bettingService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }

  async getUserBalance(req, res) {
    try {
      const userId = req.user;
      const balance = await this.bettingService.getUserBalance(userId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ error: "Failed to fetch user balance" });
    }
  }
}

module.exports = UserController;
