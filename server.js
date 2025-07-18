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

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    // Send last 50 messages to the new user
    const history = loadHistory(room).slice(-50);
    history.forEach(msg => socket.emit('chat message', msg));

    socket.to(room).emit('chat message', { system: true, message: `🔔 ${username} joined the room.` });
  });

  socket.on('chat message', (msgObj) => {
    if (socket.room) {
      const enrichedMsg = { ...msgObj, username: socket.username, time: new Date().toLocaleTimeString() };
      io.to(socket.room).emit('chat message', enrichedMsg);
      saveHistory(socket.room, enrichedMsg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.room && socket.username) {
      socket.to(socket.room).emit('chat message', { system: true, message: `⚠️ ${socket.username} has left the room.` });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
