const express = require('express');
const http = require('http');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const HISTORY_FILE = 'chat-history.json';

// Helper to load and save chat history
function loadHistory(room) {
  let all = {};
  try { all = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
  return all[room] || [];
}
function saveHistory(room, message) {
  let all = {};
  try { all = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8')); } catch {}
  if (!all[room]) all[room] = [];
  all[room].push(message);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(all));
}

// Serve frontend from the "public" folder
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  socket.on('joinRoom', (room) => {
    socket.join(room);
    socket.room = room;

    // Send recent chat history on join
    const history = loadHistory(room).slice(-50);
    history.forEach(msg => socket.emit('chat message', msg));

    socket.to(room).emit('chat message', `🔔 Someone joined the room: ${room}`);
  });

  socket.on('chat message', (msg) => {
    if (socket.room) {
      io.to(socket.room).emit('chat message', msg);
      saveHistory(socket.room, msg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.room) {
      socket.to(socket.room).emit('chat message', '⚠️ A user has left the room.');
    }
  });
});

// Use dynamic port for Vercel or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

