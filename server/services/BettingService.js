const { User } = require('../models');

class BettingService {
  async getUserBalance(userId) {
    const user = await User.findOne({ userId });
    return user ? user.balance : 1000;
  }

  async getUserStats(userId) {
    const user = await User.findOne({ userId });
    
    if (!user) {
      return {
        balance: 1000,
        totalBets: 0,
        totalWins: 0,
        winRate: 0
      };
    }
    
    return {
      balance: user.balance,
      totalBets: user.totalBets,
      totalWins: user.totalWins,
      winRate: parseFloat(user.getWinRate())
    };
  }

  async updateUserBalance(playerId, betAmount, winAmount = 0) {
    const balanceChange = winAmount > 0 ? (winAmount - betAmount) : -betAmount;
    
    await User.findOneAndUpdate(
      { userId: playerId },
      { 
        $inc: { 
          balance: balanceChange,
          totalBets: betAmount,
          totalWins: winAmount > 0 ? winAmount : 0
        },
        lastActive: new Date()
      },
      { upsert: true }
    );
  }

  async processWinnings(bets) {
    const updatePromises = bets.map(bet => 
      this.updateUserBalance(bet.playerId, bet.amount, bet.winAmount)
    );
    
    await Promise.all(updatePromises);
  }
}

module.exports = BettingService;