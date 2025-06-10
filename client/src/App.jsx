import React, { useState, useEffect, useRef } from 'react';

const BettingGameClient = () => {
  // Game state
  const [gameState, setGameState] = useState({
    timeRemaining: 30,
    gamePhase: 'betting', // 'betting', 'result', 'waiting'
    currentRound: 1,
    lastResult: null,
    isConnected: false
  });
  
  // User state
  const [selectedBets, setSelectedBets] = useState({
    color: null,
    number: null,
    size: null
  });
  const [balance, setBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState(10);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Refs
  const wsRef = useRef(null);
  const timerRef = useRef(null);

  // WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      // Replace with your actual WebSocket server URL
      wsRef.current = new WebSocket('ws://localhost:3001');
      
      wsRef.current.onopen = () => {
        setConnectionStatus('connected');
        setGameState(prev => ({ ...prev, isConnected: true }));
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      };
      
      wsRef.current.onclose = () => {
        setConnectionStatus('disconnected');
        setGameState(prev => ({ ...prev, isConnected: false }));
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'gameState':
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.timeRemaining,
          gamePhase: data.phase,
          currentRound: data.round
        }));
        break;
      
      case 'gameResult':
        setGameState(prev => ({
          ...prev,
          lastResult: data.result,
          gamePhase: 'result'
        }));
        calculateWinnings(data.result);
        break;
      
      case 'newRound':
        setGameState(prev => ({
          ...prev,
          gamePhase: 'betting',
          timeRemaining: 30,
          currentRound: data.round
        }));
        setSelectedBets({ color: null, number: null, size: null });
        break;
      
      case 'timer':
        setGameState(prev => ({
          ...prev,
          timeRemaining: data.timeRemaining
        }));
        break;
    }
  };

  const calculateWinnings = (result) => {
    let winnings = 0;
    
    if (selectedBets.color && selectedBets.color === result.color) {
      winnings += betAmount * 2; // 2x for color
    }
    
    if (selectedBets.number && selectedBets.number === result.number) {
      winnings += betAmount * 9; // 9x for exact number
    }
    
    if (selectedBets.size && selectedBets.size === result.size) {
      winnings += betAmount * 1.8; // 1.8x for size
    }
    
    if (winnings > 0) {
      setBalance(prev => prev + winnings - betAmount);
    } else if (selectedBets.color || selectedBets.number || selectedBets.size) {
      setBalance(prev => prev - betAmount);
    }
  };

  const placeBet = (type, value) => {
    if (gameState.gamePhase !== 'betting') return;
    
    setSelectedBets(prev => ({
      ...prev,
      [type]: prev[type] === value ? null : value
    }));
    
    // Send bet to server
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'placeBet',
        bet: { type, value, amount: betAmount }
      }));
    }
  };

  const getNumberColor = (num) => {
    if (num === 0) return 'violet';
    if ([1, 3, 7, 9].includes(num)) return 'green';
    if ([2, 4, 6, 8].includes(num)) return 'red';
    return 'violet';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return ((30 - gameState.timeRemaining) / 30) * 100;
  };

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    },
    alert: {
      background: '#ff9800',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px',
      textAlign: 'center'
    },
    timer: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: '10px'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      background: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '10px'
    },
    progress: {
      height: '100%',
      background: 'linear-gradient(90deg, #4caf50, #ffc107)',
      transition: 'width 0.3s ease'
    },
    colorButton: {
      padding: '15px 30px',
      margin: '10px',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      textTransform: 'uppercase'
    },
    numberButton: {
      width: '50px',
      height: '50px',
      margin: '5px',
      borderRadius: '50%',
      fontSize: '1.1rem',
      fontWeight: 'bold',
      border: '2px solid #ddd',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    sizeButton: {
      padding: '12px 24px',
      margin: '10px',
      fontSize: '1rem',
      fontWeight: 'bold',
      border: '2px solid white',
      borderRadius: '8px',
      background: 'transparent',
      color: 'white',
      cursor: 'pointer',
      transition: 'all 0.3s ease'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      marginBottom: '10px'
    },
    subtitle: {
      fontSize: '1.2rem',
      color: 'white',
      textAlign: 'center',
      marginBottom: '20px'
    },
    chip: {
      display: 'inline-block',
      padding: '5px 15px',
      borderRadius: '20px',
      fontSize: '0.9rem',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    resultChip: {
      display: 'inline-block',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '1rem',
      fontWeight: 'bold',
      color: 'white',
      margin: '5px'
    },
    balance: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div style={styles.alert}>
          {connectionStatus === 'disconnected' ? 'Disconnected from server. Attempting to reconnect...' :
           connectionStatus === 'error' ? 'Connection error. Please refresh the page.' :
           'Connecting to server...'}
        </div>
      )}

      {/* Game Header */}
      <div style={styles.card}>
        <div style={styles.title}>68LOTTERY</div>
        <div style={styles.subtitle}>Round {gameState.currentRound}</div>
        <div style={{textAlign: 'center'}}>
          <span style={{
            ...styles.chip,
            background: gameState.gamePhase === 'betting' ? '#4caf50' : '#ff9800',
            color: 'white'
          }}>
            {gameState.gamePhase.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div style={styles.card}>
        <div style={styles.timer}>{formatTime(gameState.timeRemaining)}</div>
        <div style={styles.progressBar}>
          <div 
            style={{
              ...styles.progress,
              width: `${getProgressPercentage()}%`
            }}
          />
        </div>
        <div style={{color: 'white', textAlign: 'center'}}>
          {gameState.gamePhase === 'betting' ? 'Time to place bets' : 
           gameState.gamePhase === 'result' ? 'Round finished' : 'Waiting for next round'}
        </div>
      </div>

      {/* Last Result */}
      {gameState.lastResult && (
        <div style={styles.card}>
          <div style={{...styles.subtitle, marginBottom: '15px'}}>Last Result</div>
          <div style={{textAlign: 'center'}}>
            <span style={{
              ...styles.resultChip,
              background: getNumberColor(gameState.lastResult.number) === 'green' ? '#4caf50' : 
                         getNumberColor(gameState.lastResult.number) === 'red' ? '#f44336' : '#9c27b0'
            }}>
              Number: {gameState.lastResult.number}
            </span>
            <span style={{
              ...styles.resultChip,
              background: gameState.lastResult.color === 'green' ? '#4caf50' : 
                         gameState.lastResult.color === 'red' ? '#f44336' : '#9c27b0'
            }}>
              Color: {gameState.lastResult.color}
            </span>
          </div>
        </div>
      )}

      {/* Betting Interface */}
      <div style={styles.card}>
        {/* Color Betting */}
        <div style={{...styles.subtitle, marginBottom: '15px'}}>Choose Color</div>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          {['green', 'violet', 'red'].map((color) => (
            <button
              key={color}
              style={{
                ...styles.colorButton,
                background: color === 'green' ? '#4caf50' : 
                           color === 'red' ? '#f44336' : '#9c27b0',
                opacity: selectedBets.color === color ? 1 : 0.7,
                transform: selectedBets.color === color ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedBets.color === color ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
              }}
              onClick={() => placeBet('color', color)}
              disabled={gameState.gamePhase !== 'betting'}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = selectedBets.color === color ? 'scale(1.05)' : 'scale(1)'}
            >
              {color.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Number Betting */}
        <div style={{...styles.subtitle, marginBottom: '15px'}}>Choose Number</div>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
            const numColor = getNumberColor(num);
            return (
              <button
                key={num}
                style={{
                  ...styles.numberButton,
                  background: selectedBets.number === num ? '#ffd700' : 
                             numColor === 'green' ? '#4caf50' : 
                             numColor === 'red' ? '#f44336' : '#9c27b0',
                  color: selectedBets.number === num ? '#000' : '#fff',
                  border: selectedBets.number === num ? '3px solid #ff6b35' : '2px solid #ddd',
                  transform: selectedBets.number === num ? 'scale(1.1)' : 'scale(1)'
                }}
                onClick={() => placeBet('number', num)}
                disabled={gameState.gamePhase !== 'betting'}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.target.style.transform = selectedBets.number === num ? 'scale(1.1)' : 'scale(1)'}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* Size Betting */}
        <div style={{...styles.subtitle, marginBottom: '15px'}}>Choose Size</div>
        <div style={{textAlign: 'center', marginBottom: '20px'}}>
          <button
            style={{
              ...styles.sizeButton,
              background: selectedBets.size === 'big' ? '#4caf50' : 'transparent',
              color: selectedBets.size === 'big' ? 'white' : 'white'
            }}
            onClick={() => placeBet('size', 'big')}
            disabled={gameState.gamePhase !== 'betting'}
          >
            BIG (5-9)
          </button>
          <button
            style={{
              ...styles.sizeButton,
              background: selectedBets.size === 'small' ? '#2196f3' : 'transparent',
              color: selectedBets.size === 'small' ? 'white' : 'white'
            }}
            onClick={() => placeBet('size', 'small')}
            disabled={gameState.gamePhase !== 'betting'}
          >
            SMALL (0-4)
          </button>
        </div>
      </div>

      {/* Balance */}
      <div style={styles.card}>
        <div style={styles.balance}>Balance: ${balance}</div>
        <div style={{color: 'white', textAlign: 'center', marginTop: '10px'}}>
          Bet Amount: ${betAmount}
        </div>
        <div style={{textAlign: 'center', marginTop: '15px'}}>
          <button
            style={{
              padding: '8px 16px',
              margin: '5px',
              borderRadius: '6px',
              border: '1px solid white',
              background: betAmount === 10 ? '#4caf50' : 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => setBetAmount(10)}
          >
            $10
          </button>
          <button
            style={{
              padding: '8px 16px',
              margin: '5px',
              borderRadius: '6px',
              border: '1px solid white',
              background: betAmount === 50 ? '#4caf50' : 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => setBetAmount(50)}
          >
            $50
          </button>
          <button
            style={{
              padding: '8px 16px',
              margin: '5px',
              borderRadius: '6px',
              border: '1px solid white',
              background: betAmount === 100 ? '#4caf50' : 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={() => setBetAmount(100)}
          >
            $100
          </button>
        </div>
      </div>

      {/* Game History */}
      <div style={styles.card}>
        <div style={{...styles.subtitle, marginBottom: '15px'}}>Connection Status</div>
        <div style={{textAlign: 'center'}}>
          <span style={{
            ...styles.chip,
            background: connectionStatus === 'connected' ? '#4caf50' : '#f44336',
            color: 'white'
          }}>
            {connectionStatus === 'connected' ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}
          </span>
        </div>
        {gameState.isConnected && (
          <div style={{color: 'white', textAlign: 'center', marginTop: '10px', fontSize: '0.9rem'}}>
            Server synchronized • Real-time updates active
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingGameClient;