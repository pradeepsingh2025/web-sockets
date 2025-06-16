const express = require('express');
const router = express.Router();
const authenticateToken = require("../middlewares/userAuth")

function createUserRoutes(userController) {
  router.get('/stats', authenticateToken, userController.getUserStats.bind(userController));
  router.get('/balance', authenticateToken, userController.getUserBalance.bind(userController));
  
  return router;
}

module.exports = createUserRoutes;