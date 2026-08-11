
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
require('./src/config/db');

const { Server } = require('socket.io');
const { initNotificationSocket } = require('./src/sockets/notification.socket');

const PORT = process.env.PORT;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

initNotificationSocket(io);
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


