const jwt = require('jsonwebtoken');

// Map: userId (Number) -> Set(socketId)
const userSocketsMap = new Map();

// Helper to extract authenticated userId from socket handshake
const getUserIdFromSocket = (socket) => {
  let token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token && socket.handshake.headers.cookie) {
    const cookieHeader = socket.handshake.headers.cookie;
    const match = cookieHeader.match(/accessToken=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return Number(decoded.id);
    } catch (err) {
      return null;
    }
  }

  return null;
};

// Add socket for user
const addUserSocket = (userId, socketId) => {
  const numericUserId = Number(userId);
  if (!userSocketsMap.has(numericUserId)) {
    userSocketsMap.set(numericUserId, new Set());
  }
  userSocketsMap.get(numericUserId).add(socketId);
};

// Remove socket for user
const removeUserSocket = (userId, socketId) => {
  const numericUserId = Number(userId);
  if (userSocketsMap.has(numericUserId)) {
    const socketsSet = userSocketsMap.get(numericUserId);
    socketsSet.delete(socketId);
    if (socketsSet.size === 0) {
      userSocketsMap.delete(numericUserId);
    }
  }
};

// Remove socket ID across all users (cleanup on disconnect)
const removeSocketFromAll = (socketId) => {
  userSocketsMap.forEach((socketsSet, uId) => {
    if (socketsSet.has(socketId)) {
      socketsSet.delete(socketId);
      if (socketsSet.size === 0) {
        userSocketsMap.delete(uId);
      }
    }
  });
};

// Emit real-time message to all sockets of a specific user
const emitToUser = (io, userId, event, payload) => {
  if (!io) return;
  const numericUserId = Number(userId);
  const socketsSet = userSocketsMap.get(numericUserId);

  if (socketsSet && socketsSet.size > 0) {
    socketsSet.forEach((socketId) => {
      io.to(socketId).emit(event, payload);
    });
  }
};

// Initialize Notification Socket Handler
const initNotificationSocket = (io) => {
  io.on('connection', (socket) => {
    const authenticatedUserId = getUserIdFromSocket(socket);

    if (authenticatedUserId) {
      socket.userId = authenticatedUserId;
      addUserSocket(authenticatedUserId, socket.id);
    }

    socket.on('register', (data) => {
      let targetUserId = null;

      if (typeof data === 'string' || (data && data.token)) {
        const tokenToVerify = typeof data === 'string' ? data : data.token;
        try {
          const decoded = jwt.verify(tokenToVerify, process.env.JWT_SECRET);
          targetUserId = Number(decoded.id);
        } catch (err) {
        }
      } else if (data && data.userId) {
        if (socket.userId && Number(socket.userId) === Number(data.userId)) {
          targetUserId = Number(socket.userId);
        }
      }

      if (targetUserId) {
        socket.userId = targetUserId;
        addUserSocket(targetUserId, socket.id);
      }
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        removeUserSocket(socket.userId, socket.id);
      }
      removeSocketFromAll(socket.id);
    });
  });
};

module.exports = {
  initNotificationSocket,
  emitToUser,
  userSocketsMap,
};
