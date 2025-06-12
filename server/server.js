const http = require('http');
const App = require('./app');
const setupWebSocket = require('./config/websocket');
const Database = require('./config/database');

class Server {
  constructor() {
    this.port = process.env.PORT || 3001;
  }

  async start() {
    try {
      // Initialize Express app
      const appInstance = new App();
      this.app = await appInstance.start();
      
      // Create HTTP server
      this.server = http.createServer(this.app);
      
      // Setup WebSocket
      const { io } = setupWebSocket(this.server);
      this.io = io;
      
      // Start server
      this.server.listen(this.port, () => {
        console.log(`Betting game server running on port ${this.port}`);
        console.log(`WebSocket server ready for connections`);
      });
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  async shutdown() {
    console.log('Shutting down gracefully...');
    
    // Close Socket.IO connections
    if (this.io) {
      this.io.close();
    }
    
    // Close database connection
    await Database.disconnect();
    
    // Close HTTP server
    this.server.close(() => {
      console.log('Server shut down complete');
      process.exit(0);
    });
  }
}

// Start the server
const server = new Server();
server.start();