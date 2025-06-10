const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });



// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});



// Game Result Schema
const GameResultSchema = new mongoose.Schema({
  round: { type: Number, required: true },
  result: {
    number: { type: Number, required: true },
    color: { type: String, required: true },
    size: { type: String, required: true }
  },
  timestamp: { type: Date, default: Date.now },
  bets: [{
    playerId: String,
    betType: String,
    betValue: mongoose.Schema.Types.Mixed,
    amount: Number,
    won: Boolean,
    winAmount: Number
  }]
});

const GameResult = mongoose.model('GameResult', GameResultSchema);

// User Schema
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 1000 },
  totalBets: { type: Number, default: 0 },
  totalWins: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Game State
let gameState = {
  currentRound: 1,
  phase: 'betting', // 'betting', 'result', 'waiting'
  timeRemaining: 30,
  startTime: Date.now(),
  bets: new Map(), // playerId -> [bets]
  lastResult: null
};

// Connected clients
const clients = new Set();

// Game Logic Functions
function getNumberColor(num) {
  if (num === 0) return 'violet';
  if ([1, 3, 7, 9].includes(num)) return 'green';
  if ([2, 4, 6, 8].includes(num)) return 'red';
  return 'violet';
}

function getNumberSize(num) {
  return num >= 5 ? 'big' : 'small';
}

function generateGameResult() {
  const number = Math.floor(Math.random() * 10); // 0-9
  const color = getNumberColor(number);
  const size = getNumberSize(number);
  
  return { number, color, size };
}

function calculateWinnings(bet, result) {
  let multiplier = 0;
  
  // Color betting: 2x multiplier
  if (bet.type === 'color' && bet.value === result.color) {
    multiplier = 2;
  }
  
  // Number betting: 9x multiplier
  if (bet.type === 'number' && bet.value === result.number) {
    multiplier = 9;
  }
  
  // Size betting: 1.8x multiplier
  if (bet.type === 'size' && bet.value === result.size) {
    multiplier = 1.8;
  }
  
  return bet.amount * multiplier;
}

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Game Timer
function startGameTimer() {
  const timer = setInterval(() => {
    gameState.timeRemaining--;
    
    // Broadcast timer update every second
    broadcast({
      type: 'timer',
      timeRemaining: gameState.timeRemaining,
      phase: gameState.phase
    });
    
    // Handle phase transitions
    if (gameState.timeRemaining <= 0) {
      clearInterval(timer);
      
      if (gameState.phase === 'betting') {
        // End betting phase, show result
        endBettingPhase();
      } else if (gameState.phase === 'result') {
        // Start new round
        startNewRound();
      }
    }
  }, 1000);
}

async function endBettingPhase() {
  gameState.phase = 'result';
  gameState.timeRemaining = 10; // 10 seconds to show result
  
  // Generate result
  const result = generateGameResult();
  gameState.lastResult = result;
  
  // Process all bets
  const allBets = [];
  for (const [playerId, playerBets] of gameState.bets.entries()) {
    for (const bet of playerBets) {
      const winAmount = calculateWinnings(bet, result);
      const won = winAmount > 0;
      
      allBets.push({
        playerId,
        betType: bet.type,
        betValue: bet.value,
        amount: bet.amount,
        won,
        winAmount: won ? winAmount : 0
      });
      
      // Update user balance
      try {
        await User.findOneAndUpdate(
          { userId: playerId },
          { 
            $inc: { 
              balance: won ? (winAmount - bet.amount) : -bet.amount,
              totalBets: bet.amount,
              totalWins: won ? winAmount : 0
            },
            lastActive: new Date()
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('Error updating user balance:', error);
      }
    }
  }
  
  // Save game result to database
  try {
    const gameResult = new GameResult({
      round: gameState.currentRound,
      result,
      bets: allBets
    });
    await gameResult.save();
  } catch (error) {
    console.error('Error saving game result:', error);
  }
  
  // Broadcast result
  broadcast({
    type: 'gameResult',
    result,
    round: gameState.currentRound
  });
  
  // Start result timer
  startGameTimer();
}

function startNewRound() {
  gameState.currentRound++;
  gameState.phase = 'betting';
  gameState.timeRemaining = 30;
  gameState.bets.clear();
  
  broadcast({
    type: 'newRound',
    round: gameState.currentRound,
    phase: gameState.phase,
    timeRemaining: gameState.timeRemaining
  });
  
  startGameTimer();
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  // Send current game state to new client
  ws.send(JSON.stringify({
    type: 'gameState',
    phase: gameState.phase,
    timeRemaining: gameState.timeRemaining,
    round: gameState.currentRound,
    lastResult: gameState.lastResult
  }));
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'placeBet':
          if (gameState.phase === 'betting') {
            const playerId = ws.playerId || `player_${Date.now()}_${Math.random()}`;
            ws.playerId = playerId;
            
            if (!gameState.bets.has(playerId)) {
              gameState.bets.set(playerId, []);
            }
            
            // Add bet (replace existing bet of same type)
            const playerBets = gameState.bets.get(playerId);
            const existingBetIndex = playerBets.findIndex(bet => bet.type === message.bet.type);
            
            if (existingBetIndex >= 0) {
              playerBets[existingBetIndex] = message.bet;
            } else {
              playerBets.push(message.bet);
            }
            
            console.log(`Player ${playerId} placed bet:`, message.bet);
          }
          break;
          
        case 'getUserBalance':
          try {
            const user = await User.findOne({ userId: message.userId });
            ws.send(JSON.stringify({
              type: 'userBalance',
              balance: user ? user.balance : 1000
            }));
          } catch (error) {
            console.error('Error fetching user balance:', error);
          }
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// REST API Endpoints

// Get game history
app.get('/api/history', async (req, res) => {
  try {
    const history = await GameResult.find()
      .sort({ timestamp: -1 })
      .limit(50)
      .select('round result timestamp');
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Get user stats
app.get('/api/user/:userId/stats', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.json({
        balance: 1000,
        totalBets: 0,
        totalWins: 0,
        winRate: 0
      });
    }
    
    const winRate = user.totalBets > 0 ? (user.totalWins / user.totalBets * 100).toFixed(2) : 0;
    
    res.json({
      balance: user.balance,
      totalBets: user.totalBets,
      totalWins: user.totalWins,
      winRate: parseFloat(winRate)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Get current game state
app.get('/api/game/state', (req, res) => {
  res.json({
    phase: gameState.phase,
    timeRemaining: gameState.timeRemaining,
    round: gameState.currentRound,
    lastResult: gameState.lastResult
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connectedClients: clients.size,
    currentRound: gameState.currentRound,
    gamePhase: gameState.phase
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Betting game server running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  
  // Start the first game round
  startGameTimer();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  
  // Close all WebSocket connections
  clients.forEach(client => {
    client.close();
  });
  
  // Close database connection
  await mongoose.connection.close();
  
  server.close(() => {
    console.log('Server shut down complete');
    process.exit(0);
  });
});
