const express = require('express');
const router = express.Router();

function createGameRoutes(gameController) {
  router.get('/history', gameController.getGameHistory.bind(gameController));
  router.get('/state', gameController.getGameState.bind(gameController));
  router.get('/health', gameController.getHealthCheck.bind(gameController));
  
  return router;
}

module.exports = createGameRoutes;
