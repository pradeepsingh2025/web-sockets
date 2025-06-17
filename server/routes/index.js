const createGameRoutes = require("./gameRoutes");
const {
  createUserBetRoutes,
  createUserInfoRoutes,
  createWalletInfoRoutes,
} = require("./userRoutes");
const { body } = require("express-validator");
const WalletController = require("../controllers");

function setupRoutes(app, controllers) {
  const {
    gameController,
    userController,
    userInfoController,
    walletController,
  } = controllers;

  // API routes
  app.use("/api/game", createGameRoutes(gameController));
  app.use("/api/user", createUserBetRoutes(userController));

  // Health check route
  app.get("/api/health", gameController.getHealthCheck.bind(gameController));

  // login/signup route
  app.use("/api/user", createUserInfoRoutes(userInfoController));

  //user wallet info
  app.use("/api/user", createWalletInfoRoutes(walletController));
}

module.exports = setupRoutes;
