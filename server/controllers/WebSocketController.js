class WebSocketController {
  constructor(gameService, bettingService, io) {
    this.gameService = gameService;
    this.bettingService = bettingService;
    this.io = io;
    this.gameTimers = {};
  }

  handleConnection(socket) {
    console.log("New client connected:", socket.id);

    // Send current game states to new client
    socket.emit("gameState30s", this.gameService.getCurrentState("30s"));
    socket.emit("gameState1m", this.gameService.getCurrentState("1m"));
    socket.emit("gameState3m", this.gameService.getCurrentState("3m"));
    socket.emit("gameState5m", this.gameService.getCurrentState("5m"));

    // Handle different events
    socket.on("placeBet", (data) => this.handlePlaceBet(socket, data));
    socket.on("getUserBalance", (data) =>
      this.handleGetUserBalance(socket, data)
    );
    socket.on("getCurrentBet", (data) =>
      this.handleGetCurrentBet(socket, data)
    );

    socket.on("disconnect", () => this.handleDisconnection(socket));
    socket.on("error", (error) => this.handleError(socket, error));
  }

  async handlePlaceBet(socket, data) {
    try {
      // Parse the JSON string
      let parsedData;
      if (typeof data === "string") {
        parsedData = JSON.parse(data);
        console.log("Successfully parsed JSON");
      } else {
        parsedData = data;
        console.log("Data is already an object");
      }

      const playerId = parsedData.userId;
      const gameType = parsedData.gameType;

      // Player can only bet on one type at a time - this will replace any existing bet
      this.gameService.addBet(playerId, gameType, parsedData.bet);

      // Send confirmation to the player about their current bet
      socket.emit("betPlaced", {
        gameType: gameType,
        bet: parsedData.bet,
        message: "Bet placed successfully",
      });

      console.log(`Player ${playerId} placed bet ${gameType}:`, parsedData.bet);
    } catch (error) {
      socket.emit("error", {
        message: error.message,
      });
    }
  }

  async handleGetUserBalance(socket, data) {
    try {
      let parsedData;
      if (typeof data === "string") {
        parsedData = JSON.parse(data);
        console.log("Successfully parsed JSON");
      } else {
        parsedData = data;
        console.log("Data is already an object");
      }

      const balance = await this.bettingService.getUserBalance(
        parsedData.userId
      );
      socket.emit("userBalance", {
        balance,
      });
    } catch (error) {
      console.error("Error fetching user balance:", error);
    }
  }

  handleGetCurrentBet(socket, data) {
    try {
      let parsedData;
      if (typeof data === "string") {
        parsedData = JSON.parse(data);
        console.log("Successfully parsed JSON");
      } else {
        parsedData = data;
        console.log("Data is already an object");
      }

      const playerId = parsedData.userId;
      const gameType = parsedData.gameType;
      if (playerId && this.gameService.activePlayers.has(playerId)) {
        const currentBet = this.gameService.games[gameType].bets.get(playerId);
        // const currentBet = playerBets.length > 0 ? playerBets[0] : null;

        socket.emit("currentBet", {
          gameType: gameType,
          bet: currentBet,
        });
      } else {
        socket.emit("currentBet", {
          gametype: null,
          bet: null,
        });
      }
    } catch (error) {
      console.error("Error fetching current bet:", error);
    }
  }

  handleDisconnection(socket) {
    console.log("Client disconnected:", socket.id);
  }

  handleError(socket, error) {
    console.error("Socket.IO error:", error);
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }

  startGameTimer(gameType) {
    // Clear any existing timer for this gameType
    if (this.gameTimers[gameType]) {
      clearInterval(this.gameTimers[gameType]);
    }

    this.gameTimers[gameType] = setInterval(async () => {
      const timeRemaining = this.gameService.updateTimer(gameType);

      // Broadcast timer update
      this.broadcast("timer", {
        gameType,
        timeRemaining,
        phase: this.gameService.games[gameType].phase,
      });

      // Handle phase transitions
      if (timeRemaining <= 0) {
        clearInterval(this.gameTimers[gameType]);

        if (this.gameService.games[gameType].phase === "betting") {
          await this.endBettingPhase(gameType);
        } else if (this.gameService.games[gameType].phase === "result") {
          this.startNewRound(gameType);
        }
      }
    }, 1000);
  }

  async endBettingPhase(game_Type) {
    try {
      const { gameType, result, bets } = await this.gameService.endBettingPhase(
        game_Type
      );

      // Process winnings
      await this.bettingService.processWinnings(bets);

      // Broadcast result
      this.broadcast("gameResult", {
        gameType,
        result,
        round: this.gameService.games[gameType].currentRound,
      });

      // Start result timer
      this.startGameTimer(gameType);
    } catch (error) {
      console.error("Error ending betting phase:", error);
    }
  }

  startNewRound(gameType) {
    const newState = this.gameService.startNewRound(gameType);

    this.broadcast("newRound", {
      gameType,
      newState,
    });

    this.startGameTimer(gameType);
  }
}

module.exports = WebSocketController;
