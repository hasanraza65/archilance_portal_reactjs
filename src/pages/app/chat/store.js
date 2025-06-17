// src/pages/app/chat/appChatSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from 'js-cookie';
import { toast } from "react-toastify";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/chat`;
const IMAGE_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const getTokenFromCookie = () => Cookies.get('token');

export const fetchUsers = createAsyncThunk(
  "appchat/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
        const token = getTokenFromCookie();
        if (!token) return rejectWithValue("Authentication token not found.");
        const response = await axios.get(`${API_BASE_URL}/users-list`, { headers: { 'Authorization': `Bearer ${token}` } });
        const users = response.data.users;
        return users.map(user => ({
            id: user.id,
            fullName: user.name,
            avatar: user.profile_pic ? `${IMAGE_BASE_URL}${user.profile_pic}` : null,
            role: "User",
            status: "active",
            lastmessage: user.last_message || "No recent messages",
            unredmessage: user.unread_count || 0,
            lastmessageTime: user.last_message_at,
        }));
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to load contacts.");
    }
  }
);

export const fetchConversation = createAsyncThunk(
  "appchat/fetchConversation",
  async (contactId, { getState, rejectWithValue }) => {
    try {
        const token = getTokenFromCookie();
        if (!token) return rejectWithValue("Authentication token not found.");
        
        const loggedInUserId = getState().auth.user?.id;
        if (!loggedInUserId) {
          return rejectWithValue("Could not find logged-in user ID.");
        }

        const response = await axios.get(`${API_BASE_URL}/conversations/${contactId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        const messages = response.data.data;
        return messages.map(msg => ({
            id: msg.id,
            content: msg.message,
            sender: msg.sender_id === loggedInUserId ? 'me' : 'them',
            time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            img: msg.sender.profile_pic ? `${IMAGE_BASE_URL}${msg.sender.profile_pic}` : null,
            senderFullName: msg.sender.name,
        }));
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || "Failed to load messages.");
    }
  }
);

export const sendMessageToServer = createAsyncThunk(
  "appchat/sendMessage",
  async (messageData, { getState, rejectWithValue }) => {
    try {
      const token = getTokenFromCookie();
      if (!token) return rejectWithValue("Authentication token not found.");

      const loggedInUserId = getState().auth.user?.id;
      if (!loggedInUserId) return rejectWithValue("Could not find logged-in user ID.");

      const API_URL = `${API_BASE_URL}/send`;
      
      const formData = new FormData();
      formData.append('message', messageData.content);
      formData.append('receiver_id', messageData.receiverId);
      
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      const newMessage = response.data.chat;
      const loggedInUser = getState().auth.user;
      
      return {
        originalMessage: { ...newMessage, sender_avatar: loggedInUser.profile_pic, sender_name: loggedInUser.name },
        formatted: {
            id: newMessage.id,
            content: newMessage.message,
            sender: newMessage.sender_id === loggedInUserId ? 'me' : 'them',
            time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            img: null,
            senderFullName: loggedInUser?.name,
        }
      };

    } catch (error) {
      toast.error("Failed to send message.");
      return rejectWithValue(error.response?.data?.message || "Failed to send message.");
    }
  }
);

export const deleteMessage = createAsyncThunk(
  "appchat/deleteMessage",
  async (messageId, { rejectWithValue }) => {
    try {
      const token = getTokenFromCookie();
      if (!token) return rejectWithValue("Authentication token not found.");
      
      const API_URL = `${API_BASE_URL}/delete/${messageId}`;
      await axios.delete(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      
      toast.success("Message deleted successfully");
      return messageId;
    } catch (error) {
      toast.error("Failed to delete message.");
      return rejectWithValue(error.response?.data?.message || "Failed to delete message.");
    }
  }
);

export const updateMessage = createAsyncThunk(
  "appchat/updateMessage",
  async ({ messageId, newContent }, { rejectWithValue }) => {
    try {
      const token = getTokenFromCookie();
      if (!token) return rejectWithValue("Authentication token not found.");
      
      const API_URL = `${API_BASE_URL}/update/${messageId}`;
      const formData = new FormData();
      formData.append('message', newContent);
      
      const response = await axios.post(API_URL, formData, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });

      const updatedMessage = response.data.chat; 
      
      toast.success("Message updated successfully");
      return {
        id: updatedMessage.id,
        content: updatedMessage.message,
      };
    } catch (error) {
      toast.error("Failed to update message.");
      return rejectWithValue(error.response?.data?.message || "Failed to update message.");
    }
  }
);

export const appChatSlice = createSlice({
  name: "appchat",
  initialState: {
    openProfile: false,
    openinfo: true,
    activechat: false,
    searchContact: "",
    mobileChatSidebar: false,
    user: {},
    contacts: [],
    messFeed: [],
    isLoading: false,
    error: null,
    isMessagesLoading: false,
    messagesError: null,
  },
  reducers: {
    openChat: (state, action) => {
      state.activechat = true;
      state.mobileChatSidebar = false;
      state.user = action.payload.contact;
      state.messFeed = [];
      state.messagesError = null;
    },
    toggleMobileChatSidebar: (state, action) => { state.mobileChatSidebar = action.payload; },
    infoToggle: (state, action) => { state.openinfo = action.payload; },
    sendMessage: (state, action) => { state.messFeed.push(action.payload); },
    toggleProfile: (state, action) => { state.openProfile = action.payload; },
    setContactSearch: (state, action) => { state.searchContact = action.payload; },
    toggleActiveChat: (state, action) => { state.activechat = action.payload; },
    addLiveMessage: (state, action) => {
      const newMessage = action.payload;
      if (newMessage && state.activechat && state.user && 
          (newMessage.sender_id === state.user.id || newMessage.receiver_id === state.user.id)) {
        state.messFeed.push(newMessage.formatted);
      }
    },
    liveDeleteMessage: (state, action) => {
      const { messageId } = action.payload;
      state.messFeed = state.messFeed.filter((message) => message.id !== messageId);
    },
    liveUpdateMessage: (state, action) => {
      const { messageId, newContent } = action.payload;
      const messageIndex = state.messFeed.findIndex((msg) => msg.id === messageId);
      if (messageIndex !== -1) {
        state.messFeed[messageIndex].content = newContent;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.isLoading = false; state.contacts = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchConversation.pending, (state) => { state.isMessagesLoading = true; state.messagesError = null; })
      .addCase(fetchConversation.fulfilled, (state, action) => { state.isMessagesLoading = false; state.messFeed = action.payload; })
      .addCase(fetchConversation.rejected, (state, action) => { state.isMessagesLoading = false; state.messagesError = action.payload; })
      .addCase(sendMessageToServer.pending, (state, action) => {
        const { content } = action.meta.arg;
        state.messFeed.push({
          id: `temp-${Date.now()}`,
          content,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      })
      .addCase(sendMessageToServer.fulfilled, (state, action) => {
        const tempMessageIndex = state.messFeed.findIndex(msg => msg.id.toString().startsWith('temp-'));
        if (tempMessageIndex !== -1) {
            state.messFeed[tempMessageIndex] = action.payload.formatted;
        }
      })
      .addCase(sendMessageToServer.rejected, (state, action) => {
        state.messFeed = state.messFeed.filter(msg => !msg.id.toString().startsWith('temp-'));
        console.error("Send message failed:", action.payload);
      })
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messFeed = state.messFeed.filter((message) => message.id !== action.payload);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        console.error("Delete message failed:", action.payload);
      })
      .addCase(updateMessage.fulfilled, (state, action) => {
        const { id, content } = action.payload;
        const messageIndex = state.messFeed.findIndex((msg) => msg.id === id);
        if (messageIndex !== -1) {
          state.messFeed[messageIndex].content = content;
        }
      })
      .addCase(updateMessage.rejected, (state, action) => {
        console.error("Update message failed:", action.payload);
      });
  },
});

export const { openChat, toggleMobileChatSidebar, infoToggle, sendMessage, toggleProfile, setContactSearch, toggleActiveChat, addLiveMessage, liveDeleteMessage, liveUpdateMessage } = appChatSlice.actions;
export default appChatSlice.reducer;