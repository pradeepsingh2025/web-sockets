const { Server } = require('socket.io');
const { WebSocketController } = require('../controllers');
const { GameService, BettingService } = require('../services');

function setupWebSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173/",
      methods: ["GET", "POST", "PUT"]
    }
  });
  
  // Initialize services
  const gameService = new GameService();
  const bettingService = new BettingService();
  
  // Initialize WebSocket controller
  const wsController = new WebSocketController(gameService, bettingService, io);
  
  // Handle connections
  io.on('connection', (socket) => {
    wsController.handleConnection(socket);
  });
  
  // Start the game timer
  wsController.startGameTimer();
  
  return { io, wsController, gameService, bettingService };
}

module.exports = setupWebSocket;