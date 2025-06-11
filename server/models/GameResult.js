const mongoose = require('mongoose');

const GameResultSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  result: {
    number: { type: Number, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true }
  },
  bets: [{
    playerId: String,
    betType: String,
    betValue: mongoose.Schema.Types.Mixed,
    amount: Number,
    won: Boolean,
    winAmount: Number
  }]
}, {
  timestamps: true
});

// Static methods
GameResultSchema.statics.getRecentHistory = function(limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('round result createdAt');
};

GameResultSchema.statics.getGameStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalRounds: { $sum: 1 },
        avgBetsPerRound: { $avg: { $size: '$bets' } }
      }
    }
  ]);
};

module.exports = mongoose.model('GameResult', GameResultSchema);