// public/script.js
const socket = io();

const loginDiv = document.getElementById('login');
const gameDiv = document.getElementById('game');
const board = document.getElementById('game-board');
const statusP = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const chatDiv = document.getElementById('chat');
const chatInput = document.getElementById('chatInput');
const scoresList = document.getElementById('scores');

let symbol = null;
let myTurn = false;

function createBoard() {
  board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.dataset.index = i;
    cell.addEventListener('click', () => {
      if (myTurn && cell.textContent === '') {
        socket.emit('move', i);
        myTurn = false;
      }
    });
    board.appendChild(cell);
  }
}

function checkWinner() {
  const cells = Array.from(board.children).map(c => c.textContent);
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return cells[a];
    }
  }
  return cells.includes('') ? null : 'draw';
}

document.getElementById('join').onclick = () => {
  const name = document.getElementById('name').value.trim();
  if (name) {
    socket.emit('join', name);
    loginDiv.style.display = 'none';
    gameDiv.style.display = 'block';
  }
};

socket.on('gameStart', (s) => {
  symbol = s;
  createBoard();
  statusP.textContent = `Hraješ jako ${symbol}`;
  myTurn = symbol === 'X';
});

socket.on('move', ({ index, symbol: s }) => {
  const cell = board.children[index];
  cell.textContent = s;
  const winner = checkWinner();
  if (winner) {
    if (winner === 'draw') {
      statusP.textContent = 'Remíza!';
    } else {
      statusP.textContent = `Vyhrál ${winner}`;
    }
    socket.emit('gameOver', { winner });
  } else {
    myTurn = symbol === s ? false : true;
  }
});

restartBtn.onclick = () => {
  socket.emit('restart');
};

socket.on('restart', () => {
  createBoard();
  myTurn = symbol === 'X';
  statusP.textContent = `Hraješ jako ${symbol}`;
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    socket.emit('chat', chatInput.value);
    chatInput.value = '';
  }
});

socket.on('chat', ({ name, message }) => {
  const msg = document.createElement('div');
  msg.textContent = `${name}: ${message}`;
  chatDiv.appendChild(msg);
  chatDiv.scrollTop = chatDiv.scrollHeight;
});

socket.on('scores', (scores) => {
  scoresList.innerHTML = '';
  for (const [name, score] of Object.entries(scores)) {
    const li = document.createElement('li');
    li.textContent = `${name}: ${score}`;
    scoresList.appendChild(li);
  }
});

socket.on('message', msg => {
  statusP.textContent = msg;
});
