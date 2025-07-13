const User = require("../models/User");

class UserController {
  constructor(bettingService) {
    this.bettingService = bettingService;
  }

  async getUserStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await this.bettingService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  }
}

module.exports = UserController;
