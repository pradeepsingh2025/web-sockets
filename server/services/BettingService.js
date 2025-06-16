const { User } = require('../models');

class BettingService {

  async getUserStats(userId) {
    const user = await User.findOne({ userId });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      balance: user.wallet.balance,
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