import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const socketUrl = apiUrl.replace('/api', '');

  socket = io(socketUrl, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling']
  });

  console.log('🔌 Initiated Socket.IO connection to:', socketUrl);

  socket.on('connect', () => {
    console.log('🔌 Connected to WebSocket Server');
  });

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket Connection Error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Disconnected Socket.IO');
  }
};

export const getSocket = () => {
  return socket;
};
