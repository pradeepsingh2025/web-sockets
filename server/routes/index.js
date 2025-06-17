const createGameRoutes = require("./gameRoutes");
const {
  createUserBetRoutes,
  createUserInfoRoutes,
  createWalletInfoRoutes,
} = require("./userRoutes");
const createAdminRoutes = require("./adminRoutes");
const createTransaction = require("./transactionRoutes");

function setupRoutes(app, controllers) {
  const {
    gameController,
    userController,
    userInfoController,
    walletController,
    adminController,
    transactionController,
  } = controllers;

  // Game Routes
  app.use("/api/game", createGameRoutes(gameController));

  // Health check route
  app.get("/api/health", gameController.getHealthCheck.bind(gameController));

  // User Routes
  app.use("/api/user", createUserBetRoutes(userController));

  //User login/signup route
  app.use("/api/user", createUserInfoRoutes(userInfoController));

  //user wallet info
  app.use("/api/user", createWalletInfoRoutes(walletController));

  //admin routes
  app.use("/api/admin", createAdminRoutes(adminController));

  //transaction controller
  app.use("/api/user", createTransaction(transactionController));
}

module.exports = setupRoutes;
