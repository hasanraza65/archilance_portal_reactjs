// src/socket.js
import { io } from "socket.io-client";
import {
  addLiveMessage,
  liveDeleteMessage,
  liveUpdateMessage,
  liveUpdateReaction,
  updateContactLastMessage
} from './pages/app/chat/store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://chat.aentora.com";
let socket;

export const connectSocket = (dispatch, userId) => {
  if (userId && !socket?.connected) {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log(`%c[GLOBAL_SOCKET] CONNECTED! User ID: ${userId}. Socket ID: ${socket.id}`, 'color: green; font-weight: bold;');
      socket.emit('join', `user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.warn('[GLOBAL_SOCKET] DISCONNECTED from server.');
    });

    socket.on('chat-message', (data) => {
      dispatch(addLiveMessage(data));
      dispatch(updateContactLastMessage(data));
      console.log('%c[SOCKET] Received "chat-message":', 'color: blue;', data);
    });

    socket.on('message-deleted', (data) => {
      dispatch(liveDeleteMessage(data));
    });

    socket.on('message-updated', (data) => {
      dispatch(liveUpdateMessage(data));
    });
    
    socket.on('message-reacted', (data) => {
      // console.log('%c[SOCKET] Received "message-reacted":', 'color: hotpink;', data);
      console.log('socket testing', data);
      dispatch(liveUpdateReaction(data));
    });

  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};