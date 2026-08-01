// src/socket.js
import { io } from "socket.io-client";
import {
  addLiveMessage,
  liveDeleteMessage,
  liveUpdateMessage,
  liveUpdateReaction,
  updateContactLastMessage
} from './pages/app/chat/store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://socketjs.vercel.app";
let socket;

/**
 * WebSocket only - do NOT let this fall back to HTTP long-polling.
 *
 * The relay runs on Vercel, which is serverless. Long-polling needs several
 * separate HTTP requests (GET handshake, POST to send, GET to receive) to all
 * reach the SAME server process; Vercel gives no such affinity, so the POST
 * fails with "xhr post error" and the socket never connects. A raw WebSocket is
 * one persistent connection, so it works fine.
 *
 * socket.io-client defaults to ["polling", "websocket"] - polling FIRST - which
 * is exactly the combination that fails here. Hence the explicit list.
 */
export const connectSocket = (dispatch, userId) => {
  if (userId && !socket?.connected) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });

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