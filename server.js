const express = require('express');
const http = require('http');
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const HISTORY_FILE = 'chat-history.json';

function loadHistory(room) {
  let all = {};
  try { all = JSON.parse(fs.readFileSync(HISTORY_FILE)); } catch {}
  return all[room] || [];
}

function saveHistory(room, msg) {
  let all = {};
  try { all = JSON.parse(fs.readFileSync(HISTORY_FILE)); } catch {}
  if (!all[room]) all[room] = [];
  all[room].push(msg);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(all, null, 2));
}

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    const history = loadHistory(room).slice(-50);
    history.forEach(m => socket.emit('chat message', m));

    // send system message to others in room
    socket.to(room).emit('chat message', {
      system: true,
      message: `🔔 ${username} joined the room.`
    });
  });

  socket.on('chat message', (msg) => {
    if (!socket.room || !socket.username) return;

    const fullMsg = {
      username: socket.username,
      message: msg.message,
      time: new Date().toLocaleTimeString()
    };

    io.to(socket.room).emit('chat message', fullMsg);
    saveHistory(socket.room, fullMsg);
  });

  socket.on('disconnect', () => {
    if (socket.room && socket.username) {
      socket.to(socket.room).emit('chat message', {
        system: true,
        message: `⚠️ ${socket.username} left the chat.`
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
