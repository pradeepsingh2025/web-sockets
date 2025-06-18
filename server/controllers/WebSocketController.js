class WebSocketController {
  constructor(gameService, bettingService, io) {
    this.gameService = gameService;
    this.bettingService = bettingService;
    this.io = io;
    this.gameTimer = null;
  }

  handleConnection(socket) {
    console.log('New client connected:', socket.id);
    
    // Send current game state to new client
    socket.emit('gameState', this.gameService.getCurrentState());

    // Handle different events
    socket.on('placeBet', (data) => this.handlePlaceBet(socket, data));
    socket.on('getUserBalance', (data) => this.handleGetUserBalance(socket, data));
    socket.on('getCurrentBet', (data) => this.handleGetCurrentBet(socket, data));
    
    socket.on('disconnect', () => this.handleDisconnection(socket));
    socket.on('error', (error) => this.handleError(socket, error));
  }

  async handlePlaceBet(socket, data) {
    try {
      console.log('received data', JSON.stringify(data.userId))
      // const playerId = socket.playerId || `player_${Date.now()}_${Math.random()}`;
      // socket.playerId = playerId;

      const playerId = data.userId
      
      // Player can only bet on one type at a time - this will replace any existing bet
      this.gameService.addBet(playerId, data.bet);
      
      // Send confirmation to the player about their current bet
      socket.emit('betPlaced', {
        bet: data.bet,
        message: 'Bet placed successfully'
      });
      
      console.log(`Player ${playerId} placed bet:`, data.bet);
    } catch (error) {
      socket.emit('error', {
        message: error.message
      });
    }
  }

  async handleGetUserBalance(socket, data) {
    try {
      const balance = await this.bettingService.getUserBalance(data.userId);
      socket.emit('userBalance', {
        balance
      });
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  }

  handleGetCurrentBet(socket, data) {
    try {
      const playerId = socket.playerId;
      if (playerId && this.gameService.gameState.bets.has(playerId)) {
        const playerBets = this.gameService.gameState.bets.get(playerId);
        const currentBet = playerBets.length > 0 ? playerBets[0] : null;
        
        socket.emit('currentBet', {
          bet: currentBet
        });
      } else {
        socket.emit('currentBet', {
          bet: null
        });
      }
    } catch (error) {
      console.error('Error fetching current bet:', error);
    }
  }

  handleDisconnection(socket) {
    console.log('Client disconnected:', socket.id);
  }

  handleError(socket, error) {
    console.error('Socket.IO error:', error);
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }

  startGameTimer() {
    this.gameTimer = setInterval(async () => {
      const timeRemaining = this.gameService.updateTimer();
      
      // Broadcast timer update
      this.broadcast('timer', {
        timeRemaining,
        phase: this.gameService.gameState.phase
      });
      
      // Handle phase transitions
      if (timeRemaining <= 0) {
        clearInterval(this.gameTimer);
        
        if (this.gameService.gameState.phase === 'betting') {
          await this.endBettingPhase();
        } else if (this.gameService.gameState.phase === 'result') {
          this.startNewRound();
        }
      }
    }, 1000);
  }

  async endBettingPhase() {
    try {
      const { result, bets } = await this.gameService.endBettingPhase();
      
      // Process winnings
      await this.bettingService.processWinnings(bets);
      
      // Broadcast result
      this.broadcast('gameResult', {
        result,
        round: this.gameService.gameState.currentRound
      });
      
      // Start result timer
      this.startGameTimer();
    } catch (error) {
      console.error('Error ending betting phase:', error);
    }
  }

  startNewRound() {
    const newState = this.gameService.startNewRound();
    
    this.broadcast('newRound', newState);
    
    this.startGameTimer();
  }
}

module.exports = WebSocketController;