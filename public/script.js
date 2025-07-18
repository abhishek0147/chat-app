const socket = io();

// Prompt for username
let username = '';
while (!username || !username.trim()) {
  username = prompt("Enter your username:");
}

// Generate or get room name from URL (?room=xyz), or let user create one
const urlParams = new URLSearchParams(window.location.search);
let room = urlParams.get('room');

if (!room) {
  room = prompt("Create your room name (unique, no spaces):").replace(/\s+/g, '_');
  window.location.search = '?room=' + encodeURIComponent(room);
}

// Now join the selected/created room
socket.emit('joinRoom', room);

const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat message', { username, message: input.value });
    input.value = '';
  }
});

socket.on('chat message', function(msg) {
  const item = document.createElement('li');
  // If msg is a string (like the join notification), display as is.
  if (typeof msg === 'string') {
    item.textContent = msg;
  } else {
    item.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
  }
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
