const mongoose = require("mongoose");

const GameResultSchema = new mongoose.Schema(
  {
    gameType: { type: String, required: true },
    round: { type: Number, required: true },
    result: {
      number: { type: Number, required: true },
      color: { type: String, required: true },
      size: { type: String, required: true },
    },
    bets: [
      {
        playerId: String,
        betType: String,
        betValue: mongoose.Schema.Types.Mixed,
        amount: Number,
        won: Boolean,
        winAmount: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

GameResultSchema.index({ createdAt: -1 });

// Static methods
GameResultSchema.statics.getRecentHistory = function (limit = 50) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("gameType round result createdAt");
};

GameResultSchema.statics.getGameStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalRounds: { $sum: 1 },
        avgBetsPerRound: { $avg: { $size: "$bets" } },
      },
    },
  ]);
};

GameResultSchema.statics.getUserGameHistory = function (userId) {
  if (!userId)
    throw new Error("userId is required to get game histrory for the user");

  try {
    return this.aggregate([
      { $match: { "bets.playerId": userId } },
      {
        $project: {
          gameType: 1,
          round: 1,
          result: 1,
          createdAt: 1,
          bets: {
            $filter: {
              input: "$bets",
              as: "bet",
              cond: { $eq: ["$$bet.playerId", userId] },
            },
          },
        },
      },
    ]);
  } catch (error) {
    throw new Error(`failed to fetch user game history: ${error.message}`);
  }
};

module.exports = mongoose.model("GameResult", GameResultSchema);
