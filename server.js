const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// Serve static files (your front-end) from the "public" folder
app.use(express.static(__dirname + '/public'));

// Handle websocket connections
io.on('connection', (socket) => {
  // Join a room from client request
  socket.on('joinRoom', (room) => {
    socket.join(room); // Join specified room
    socket.room = room; // Save room name to this socket
    socket.to(room).emit('chat message', `🔔 Someone joined the room: ${room}`);
  });

  // Listen for and send back chat messages
  socket.on('chat message', (msg) => {
    if (socket.room) {
      io.to(socket.room).emit('chat message', msg);
    }
  });

  // Notify when a user disconnects
  socket.on('disconnect', () => {
    if (socket.room) {
      socket.to(socket.room).emit('chat message', '⚠️ A user has left the room.');
    }
  });
});

// ✅ IMPORTANT: Use dynamic port for Vercel
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
