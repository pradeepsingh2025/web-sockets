const { Server } = require("socket.io");
const { WebSocketController } = require("../controllers");
const { GameService, BettingService } = require("../services");

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST", "PUT"],
    },
  });

  // Initialize services
  const gameService = new GameService();
  const bettingService = new BettingService();

  // Initialize WebSocket controller
  const wsController = new WebSocketController(gameService, bettingService, io);

  // Handle connections
  io.on("connection", (socket) => {
    wsController.handleConnection(socket);
  });

  // Start the game timers
  wsController.startGameTimer("30s");
  wsController.startGameTimer("1m");
  wsController.startGameTimer("3m");
  wsController.startGameTimer("5m");

  return { io, wsController, gameService, bettingService };
}

module.exports = setupWebSocket;
