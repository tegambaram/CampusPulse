import { io } from 'socket.io-client';
import { SOCKET_URL } from '../constants/config';

let socket = null;

export const connectSocket = (token) => {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
