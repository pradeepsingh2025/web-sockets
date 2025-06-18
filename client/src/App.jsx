import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  Divider,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  CloudOff,
  CloudDone,
  Person,
  Casino,
  Timer,
  List,
  Clear,
  Send,
  AccountBalance,
  Refresh
} from '@mui/icons-material';
import { io } from 'socket.io-client';

export default function SocketIOTestClient() {
  // Connection state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  
  // User state
  const [userId, setUserId] = useState('user123');
  const [balance, setBalance] = useState('--');
  const [currentBet, setCurrentBet] = useState('None');
  
  // Betting state
  const [betAmount, setBetAmount] = useState(10);
  const [betType, setBetType] = useState('red');
  
  // Game state
  const [gameState, setGameState] = useState({
    currentRound: '--',
    phase: '--',
    timeRemaining: 0
  });
  const [lastResult, setLastResult] = useState('--');
  
  // Event log
  const [eventLog, setEventLog] = useState([]);
  const logRef = useRef(null);

  const logEvent = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newEvent = {
      id: Date.now(),
      timestamp,
      message,
      type
    };
    
    setEventLog(prev => [...prev, newEvent]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };

  const connect = () => {
    if (!serverUrl.trim()) {
      alert('Please enter a server URL');
      return;
    }

    logEvent(`Connecting to ${serverUrl}...`);
    
    const newSocket = io(serverUrl);
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      logEvent('Connected successfully', 'success');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      logEvent('Disconnected from server', 'error');
    });

    newSocket.on('gameState', (data) => {
      logEvent(`Received game state: ${JSON.stringify(data)}`);
      setGameState(prev => ({
        ...prev,
        currentRound: data.currentRound || prev.currentRound,
        phase: data.phase || prev.phase
      }));
    });

    newSocket.on('timer', (data) => {
      setGameState(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining,
        phase: data.phase
      }));
    });

    newSocket.on('betPlaced', (data) => {
      logEvent(`Bet placed: ${JSON.stringify(data)}`, 'success');
    });

    newSocket.on('userBalance', (data) => {
      logEvent(`Balance received: ${data.balance}`, 'success');
      setBalance(data.balance);
    });

    newSocket.on('currentBet', (data) => {
      logEvent(`Current bet: ${JSON.stringify(data.bet)}`);
      setCurrentBet(data.bet ? `${data.bet.amount} on ${data.bet.type}` : 'None');
    });

    newSocket.on('gameResult', (data) => {
      logEvent(`Game result: ${JSON.stringify(data)}`, 'success');
      setLastResult(data.result || 'Unknown');
    });

    newSocket.on('newRound', (data) => {
      logEvent(`New round started: ${JSON.stringify(data)}`, 'success');
      setGameState(prev => ({
        ...prev,
        currentRound: data.currentRound || prev.currentRound,
        phase: data.phase || prev.phase
      }));
    });

    newSocket.on('error', (data) => {
      logEvent(`Error: ${data.message}`, 'error');
    });

    newSocket.on('connect_error', (error) => {
      logEvent(`Connection error: ${error.message}`, 'error');
    });

    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      logEvent('Disconnected by user');
    }
  };

  const getUserBalance = () => {
    if (!socket || !isConnected) return;
    
    if (!userId.trim()) {
      alert('Please enter a User ID');
      return;
    }

    socket.emit('getUserBalance', { userId });
    logEvent(`Requesting balance for user: ${userId}`);
  };

  const getCurrentBet = () => {
    if (!socket || !isConnected) return;
    
    socket.emit('getCurrentBet', { userId });
    logEvent('Requesting current bet');
  };

  const placeBet = () => {
    if (!socket || !isConnected) return;
    
    if (!userId.trim() || !betAmount || !betType.trim()) {
      alert('Please fill in all bet fields');
      return;
    }

    const betData = {
      userId,
      bet: {
        amount: betAmount,
        type: betType
      }
    };

    socket.emit('placeBet', betData);
    logEvent(`Placing bet: ${JSON.stringify(betData)}`);
  };

  const clearLog = () => {
    setEventLog([]);
    logEvent('Event log cleared');
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    return isConnected ? 'success' : 'error';
  };

  const getPhaseColor = () => {
    if (gameState.phase === 'betting') return 'primary';
    if (gameState.phase === 'result') return 'secondary';
    return 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Socket.IO Game Test Client
      </Typography>
      
      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="center">
            <Chip
              icon={isConnected ? <CloudDone /> : <CloudOff />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={getStatusColor()}
              variant="outlined"
              size="large"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Timer Display */}
      {isConnected && gameState.timeRemaining > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" component="div">
              <Chip 
                label={gameState.phase.toUpperCase()} 
                color={getPhaseColor()} 
                size="small" 
                sx={{ mb: 1 }}
              />
            </Typography>
            <Typography variant="h3" component="div">
              <Timer sx={{ mr: 1, verticalAlign: 'middle' }} />
              {formatTime(gameState.timeRemaining)}
            </Typography>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Connection Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CloudDone sx={{ mr: 1, verticalAlign: 'middle' }} />
                Connection
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Server URL"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  onClick={connect}
                  disabled={isConnected}
                  startIcon={<Send />}
                >
                  Connect
                </Button>
                <Button
                  variant="outlined"
                  onClick={disconnect}
                  disabled={!isConnected}
                  startIcon={<CloudOff />}
                >
                  Disconnect
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* User Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                User Settings
              </Typography>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <Box display="flex" gap={1} sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  onClick={getUserBalance}
                  disabled={!isConnected}
                  startIcon={<AccountBalance />}
                  size="small"
                >
                  Get Balance
                </Button>
                <Button
                  variant="outlined"
                  onClick={getCurrentBet}
                  disabled={!isConnected}
                  startIcon={<Refresh />}
                  size="small"
                >
                  Get Bet
                </Button>
              </Box>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  <strong>Balance:</strong> {balance}
                </Typography>
                <Typography variant="body2">
                  <strong>Current Bet:</strong> {currentBet}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Betting Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Casino sx={{ mr: 1, verticalAlign: 'middle' }} />
                Place Bet
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bet Amount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    variant="outlined"
                    size="small"
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Bet Type"
                    value={betType}
                    onChange={(e) => setBetType(e.target.value)}
                    variant="outlined"
                    size="small"
                    placeholder="red/black/green"
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                onClick={placeBet}
                disabled={!isConnected}
                startIcon={<Casino />}
                fullWidth
              >
                Place Bet
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Game State */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Timer sx={{ mr: 1, verticalAlign: 'middle' }} />
                Game State
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Round:</strong> {gameState.currentRound}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Phase:</strong> 
                  <Chip 
                    label={gameState.phase} 
                    size="small" 
                    sx={{ ml: 1 }} 
                    color={getPhaseColor()}
                  />
                </Typography>
                <Typography variant="body2">
                  <strong>Last Result:</strong> {lastResult}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Log */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  <List sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Event Log
                </Typography>
                <IconButton onClick={clearLog} size="small">
                  <Clear />
                </IconButton>
              </Box>
              <Paper
                ref={logRef}
                sx={{
                  p: 2,
                  bgcolor: 'grey.900',
                  color: 'white',
                  maxHeight: 300,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {eventLog.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    [Ready] Waiting for connection...
                  </Typography>
                ) : (
                  eventLog.map((event) => (
                    <Box key={event.id} sx={{ mb: 0.5 }}>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ color: 'lightblue' }}
                      >
                        [{event.timestamp}]
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          ml: 1,
                          color: event.type === 'error' ? 'error.light' : 
                                 event.type === 'success' ? 'success.light' : 'white'
                        }}
                      >
                        {event.type === 'error' && '❌ '}
                        {event.type === 'success' && '✅ '}
                        {event.type === 'info' && 'ℹ️ '}
                        {event.message}
                      </Typography>
                    </Box>
                  ))
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}