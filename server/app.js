const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import configurations
const Database = require("./config/database");
const setupRoutes = require("./routes");

// Import services and controllers
const { GameService, BettingService } = require("./services");
const {
  GameController,
  UserController,
  UserInfoController,
  WalletController,
} = require("./controllers");

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.initializeServices();
    this.initializeControllers();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  initializeServices() {
    this.gameService = new GameService();
    this.bettingService = new BettingService();
  }

  initializeControllers() {
    this.gameController = new GameController(this.gameService);
    this.userController = new UserController(this.bettingService);
    this.userInfoController = new UserInfoController();
    this.walletController = new WalletController();
  }

  setupRoutes() {
    setupRoutes(this.app, {
      gameController: this.gameController,
      userController: this.userController,
      userInfoController: this.userInfoController,
      walletController: this.walletController
    });
  }

  setupErrorHandling() {
    this.app.use((error, req, res, next) => {
      console.error("Server error:", error);
      res.status(500).json({ error: "Internal server error" });
    });
  }

  async start() {
    await Database.connect();
    return this.app;
  }
}

module.exports = App;
