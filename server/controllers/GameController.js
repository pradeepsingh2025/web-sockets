const { GameResult } = require('../models');

class GameController {
  constructor(gameService) {
    this.gameService = gameService;
  }

  async getGameHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const gameType = req.query.gameType
      const history = await GameResult.getRecentHistory(gameType, limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching game history:', error);
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  getGameState(req, res) {
    try {
      const state = this.gameService.getCurrentState();
      res.json(state);
    } catch (error) {
      console.error('Error fetching game state:', error);
      res.status(500).json({ error: 'Failed to fetch game state' });
    }
  }

  getHealthCheck(req, res) {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      currentRound: this.gameService.gameState.currentRound,
      gamePhase: this.gameService.gameState.phase
    });
  }
}

module.exports = GameController;