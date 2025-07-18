const express = require('express');
const http = require('http');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const HISTORY_FILE = 'chat-history.json';

function loadHistory(room) {
  try {
    const all = JSON.parse(fs.readFileSync(HISTORY_FILE));
    return all[room] || [];
  } catch {
    return [];
  }
}

function saveHistory(room, msg) {
  let all = {};
  try {
    all = JSON.parse(fs.readFileSync(HISTORY_FILE));
  } catch {}
  if (!all[room]) all[room] = [];
  all[room].push(msg);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(all, null, 2));
}

app.use(express.static(__dirname + '/public'));

io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.username = username;
    socket.room = room;
    socket.join(room);

    const history = loadHistory(room).slice(-50);
    history.forEach(m => socket.emit('chat message', m));

    socket.to(room).emit('chat message', {
      system: true,
      message: `🔔 ${username} joined the room.`
    });
  });

  socket.on('chat message', ({ message }) => {
    if (!message || !socket.username || !socket.room) return;
    const msgObj = {
      username: socket.username,
      message,
      time: new Date().toLocaleTimeString()
    };
    io.to(socket.room).emit('chat message', msgObj);
    saveHistory(socket.room, msgObj);
  });

  socket.on('disconnect', () => {
    if (socket.username && socket.room) {
      socket.to(socket.room).emit('chat message', {
        system: true,
        message: `⚠️ ${socket.username} left the room.`
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
