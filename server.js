// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let waitingPlayer = null;
const scores = {};

io.on('connection', (socket) => {
  console.log('Připojen:', socket.id);

  socket.on('join', (name) => {
    socket.data.name = name;

    if (waitingPlayer) {
      const playerX = waitingPlayer;
      const playerO = socket;
      const room = playerX.id + '#' + playerO.id;

      playerX.join(room);
      playerO.join(room);

      playerX.emit('gameStart', 'X');
      playerO.emit('gameStart', 'O');

      playerX.on('move', (index) => {
        io.to(room).emit('move', { index, symbol: 'X' });
      });

      playerO.on('move', (index) => {
        io.to(room).emit('move', { index, symbol: 'O' });
      });

      const handleGameOver = (winnerSymbol) => {
        io.to(room).emit('restart');
        let winner = winnerSymbol === 'draw' ? null : (winnerSymbol === 'X' ? playerX : playerO);
        if (winner) {
          const name = winner.data.name;
          scores[name] = (scores[name] || 0) + 1;
          io.emit('scores', scores);
        }
      };

      playerX.on('gameOver', ({ winner }) => handleGameOver(winner));
      playerO.on('gameOver', ({ winner }) => handleGameOver(winner));

      playerX.on('restart', () => io.to(room).emit('restart'));
      playerO.on('restart', () => io.to(room).emit('restart'));

      playerX.on('chat', msg => io.to(room).emit('chat', { name: playerX.data.name, message: msg }));
      playerO.on('chat', msg => io.to(room).emit('chat', { name: playerO.data.name, message: msg }));

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('message', 'Čekání na soupeře...');
    }
  });

  socket.on('disconnect', () => {
    console.log('Odpojen:', socket.id);
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server běží na http://localhost:${PORT}`));
