const { GameResult } = require('../models');
const { getNumberColor, getNumberSize, generateRandomNumber } = require('../utils/gameUtils');

class GameService {
  constructor() {
    this.gameState = {
      currentRound: 1,
      phase: 'betting', // 'betting', 'result', 'waiting'
      timeRemaining: 30,
      startTime: Date.now(),
      bets: new Map(),
      lastResult: null
    };
  }

  getCurrentState() {
    return {
      phase: this.gameState.phase,
      timeRemaining: this.gameState.timeRemaining,
      round: this.gameState.currentRound,
      lastResult: this.gameState.lastResult
    };
  }

  generateGameResult() {
    const number = generateRandomNumber();
    const color = getNumberColor(number);
    const size = getNumberSize(number);
    
    return { number, color, size };
  }

  addBet(playerId, bet) {
    if (this.gameState.phase !== 'betting') {
      throw new Error('Betting phase has ended');
    }

    // Player can only have one bet at a time (one type: color, size, or number)
    // Replace any existing bet with the new one
    this.gameState.bets.set(playerId, [bet]);
  }

  async endBettingPhase() {
    this.gameState.phase = 'result';
    this.gameState.timeRemaining = 5;
    
    const result = this.generateGameResult();
    this.gameState.lastResult = result;
    
    const allBets = this.processBets(result);
    
    // Save to database
    const gameResult = new GameResult({
      round: this.gameState.currentRound,
      result,
      bets: allBets
    });
    
    await gameResult.save();
    return { result, bets: allBets };
  }

  processBets(result) {
    const allBets = [];
    
    for (const [playerId, playerBets] of this.gameState.bets.entries()) {
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
          winAmount: won ? winAmount : 0
        });
      }
    }
    
    return allBets;
  }

  calculateWinnings(bet, result) {
    let multiplier = 0;
    
    switch (bet.type) {
      case 'color':
        if (bet.value === result.color) multiplier = 2;
        break;
      case 'number':
        if (bet.value === result.number) multiplier = 9;
        break;
      case 'size':
        if (bet.value === result.size) multiplier = 1.8;
        break;
    }
    
    return bet.amount * multiplier;
  }

  startNewRound() {
    this.gameState.currentRound++;
    this.gameState.phase = 'betting';
    this.gameState.timeRemaining = 30;
    this.gameState.bets.clear();
    
    return this.getCurrentState();
  }

  updateTimer() {
    this.gameState.timeRemaining--;
    return this.gameState.timeRemaining;
  }
}

module.exports = GameService;