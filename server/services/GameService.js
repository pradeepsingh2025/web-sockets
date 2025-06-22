const { GameResult } = require("../models");
const {
  getNumberColor,
  getNumberSize,
  generateRandomNumber,
} = require("../utils/gameUtils");

class GameService {
  constructor() {
    this.games = {
      "30s": {
        currentRound: 1,
        phase: "betting",
        timeRemaining: 30,
        startTime: Date.now(),
        bets: new Map(),
        lastResult: null,
      },
      "1m": {
        currentRound: 1,
        phase: "betting", // 'betting', 'result', 'waiting'
        timeRemaining: 60,
        startTime: Date.now(),
        bets: new Map(),
        lastResult: null,
      },
      "3m": {
        currentRound: 1,
        phase: "betting", // 'betting', 'result', 'waiting'
        timeRemaining: 180,
        startTime: Date.now(),
        bets: new Map(),
        lastResult: null,
      },
      "5m": {
        currentRound: 1,
        phase: "betting", // 'betting', 'result', 'waiting'
        timeRemaining: 300,
        startTime: Date.now(),
        bets: new Map(),
        lastResult: null,
      },
    };

    this.activePlayers = new Map();
  }

  getCurrentState(gameType) {
    return {
      phase: this.games[gameType].phase,
      timeRemaining: this.games[gameType].timeRemaining,
      round: this.games[gameType].currentRound,
      lastResult: this.games[gameType].lastResult,
    };
  }

  generateGameResult() {
    const number = generateRandomNumber();
    const color = getNumberColor(number);
    const size = getNumberSize(number);

    return { number, color, size };
  }

  addBet(playerId, gameType, bet) {
    const currentGame = this.activePlayers.get(playerId);
    if (currentGame && currentGame !== gameType) {
      throw new Error(
        `You already have an active bet in ${currentGame} game. Wait for result before betting on ${gameType}.`
      );
    }

    if (this.games[gameType].phase !== "betting") {
      throw new Error(`${gameType} game betting phase has ended`);
    }

    // Player can only have one bet at a time (one type: color, size, or number)
    // Replace any existing bet with the new one
    this.games[gameType].bets.set(playerId, [bet]);

    // Mark player as active in this game
    this.activePlayers.set(playerId, gameType);
  }

  async endBettingPhase(gameType) {
    this.games[gameType].phase = "result";
    this.games[gameType].timeRemaining = 3;

    const result = this.generateGameResult();
    this.games[gameType].lastResult = result;

    const allBets = this.processBets(result, gameType);

    // Save to database
    const gameResult = new GameResult({
      gameType,
      round: this.games[gameType].currentRound,
      result,
      bets: allBets,
    });

    await gameResult.save();
    return { gameType, result, bets: allBets };
  }

  processBets(result, gameType) {
    const allBets = [];

    for (const [playerId, playerBets] of this.games[gameType].bets.entries()) {
      // Since each player can only have one bet, playerBets will contain only one bet
      const bet = playerBets[0];
      if (bet) {
        const winAmount = this.calculateWinnings(bet, result);
        const won = winAmount > 0;

        allBets.push({
          playerId,
          betType: bet.type,
          betValue: bet.value,
          amount: bet.amount,
          won,
          winAmount: won ? winAmount : 0,
        });

        const playerGame = this.activePlayers.get(playerId);

        if (playerGame === gameType) {
          this.activePlayers.delete(playerId);
        }
      }
    }

    return allBets;
  }

  calculateWinnings(bet, result) {
    let multiplier = 0;

    switch (bet.type) {
      case "color":
        if (bet.value === result.color) multiplier = 2;
        break;
      case "number":
        if (bet.value === result.number) multiplier = 9;
        break;
      case "size":
        if (bet.value === result.size) multiplier = 1.8;
        break;
    }

    return bet.amount * multiplier;
  }

  startNewRound(gameType) {
    let timeRemain;
    switch (gameType) {
      case "30s":
        timeRemain = 30;
        break;
      case "1m":
        timeRemain = 60;
        break;
      case "3m":
        timeRemain = 180;
        break;
      case "5m":
        timeRemain = 300;
        break;
      default:
        break;
    }

    this.games[gameType].currentRound++;
    this.games[gameType].phase = "betting";
    this.games[gameType].timeRemaining = timeRemain;
    this.games[gameType].bets.clear();

    return this.getCurrentState(gameType);
  }

  updateTimer(gameType) {
    this.games[gameType].timeRemaining--;
    return this.games[gameType].timeRemaining;
  }
}

module.exports = GameService;
