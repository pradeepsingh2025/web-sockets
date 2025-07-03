const { User } = require("../models");

class BettingService {
  async getUserStats(userId) {
    const user = await User.findOne({ userId });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      balance: user.wallet.balance,
      totalBets: user.totalBets,
      totalWins: user.totalWins,
      winRate: parseFloat(user.getWinRate()),
    };
  }

  async getUserBalance(userId) {
    const user = await User.findOne({ userId });
    if (!user) throw new Error("User not found");
    return user.wallet.balance;
  }

  async updateUserBalance(playerId, betAmount, winAmount = 0) {
    const balanceChange = winAmount > 0 ? winAmount - betAmount : -betAmount;

    try {
      await User.findOneAndUpdate(
        { userId: playerId },
        {
          $inc: {
            "wallet.balance": balanceChange,
            totalBets: betAmount,
            totalWins: winAmount > 0 ? winAmount : 0,
          },
          $set: {
            "wallet.lastUpdated": new Date(),
            lastActive: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Failed to update user balance:", error);
      throw error;
    }
  }

  async processWinnings(bets) {
    const updatePromises = bets.map((bet) =>
      this.updateUserBalance(bet.playerId, bet.amount, bet.winAmount)
    );

    await Promise.all(updatePromises);
  }
}

module.exports = BettingService;
