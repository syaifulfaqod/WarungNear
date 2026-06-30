import { io } from 'socket.io-client';

let socket = null;

export const initiateSocketConnection = (token) => {
  if (socket) return socket;

  const socketUrl = import.meta.env.VITE_SOCKET_URL || 
                    (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000');

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
