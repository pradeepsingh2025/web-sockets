const express = require('express');
const router = express.Router();

function createUserRoutes(userController) {
  router.get('/:userId/stats', userController.getUserStats.bind(userController));
  router.get('/:userId/balance', userController.getUserBalance.bind(userController));
  
  return router;
}

module.exports = createUserRoutes;