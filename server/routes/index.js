const createGameRoutes = require('./gameRoutes');
const createUserRoutes = require('./userRoutes');

function setupRoutes(app, controllers) {
  const { gameController, userController } = controllers;
  
  // API routes
  app.use('/api/game', createGameRoutes(gameController));
  app.use('/api/user', createUserRoutes(userController));
  
  // Health check route
  app.get('/api/health', gameController.getHealthCheck.bind(gameController));
}

module.exports = setupRoutes;