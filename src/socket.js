// src/socket.js
import { io } from "socket.io-client";
import { 
  addLiveMessage, 
  liveDeleteMessage, 
  liveUpdateMessage,
  updateContactLastMessage 
} from './pages/app/chat/store';

const SOCKET_URL = "http://13.60.76.68:3000";
let socket;

export const connectSocket = (dispatch, userId) => {
  // Pehle check karein ki user logged in hai aur socket pehle se connected nahi hai
  if (userId && !socket?.connected) {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log(`%c[GLOBAL_SOCKET] CONNECTED! User ID: ${userId}. Socket ID: ${socket.id}`, 'color: green; font-weight: bold;');
      // Join a room for this user to receive private events if backend supports it
      socket.emit('join', `user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.warn('[GLOBAL_SOCKET] DISCONNECTED from server.');
    });

    // --- Yahan Saare Events Ko Suna Jayega ---

    // Naye message ke liye
    socket.on('chat-message', (data) => {
      console.log('%c[GLOBAL_SOCKET] Received "chat-message":', 'color: blue;', data);
      // Active chat mein message add karein
      dispatch(addLiveMessage(data));
      // Contacts list ka last message update karein
      dispatch(updateContactLastMessage(data));
    });

    // Message delete ke liye
    socket.on('message-deleted', (data) => {
      console.log('%c[GLOBAL_SOCKET] Received "message-deleted":', 'color: red;', data);
      dispatch(liveDeleteMessage(data));
    });

    // Message update ke liye
    socket.on('message-updated', (data) => {
      console.log('%c[GLOBAL_SOCKET] Received "message-updated":', 'color: orange;', data);
      dispatch(liveUpdateMessage(data));
    });
  }
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('[GLOBAL_SOCKET] Disconnecting...');
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};