const socket = io();

let username = '';
while (!username || !username.trim()) {
  username = prompt("Enter your username:") || '';
}

const urlParams = new URLSearchParams(window.location.search);
let room = urlParams.get('room');
if (!room) {
  room = prompt("Create or enter your room name (letters & numbers):") || 'main';
  room = room.replace(/\s+/g, '_');
  window.location.search = '?room=' + encodeURIComponent(room);
}
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
  if (typeof msg === 'string') {
    item.textContent = msg;
    item.classList.add('system-msg');
  } else {
    item.innerHTML = `<strong>${msg.username}</strong>: ${msg.message}`;
  }
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});
