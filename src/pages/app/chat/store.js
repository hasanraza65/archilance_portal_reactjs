// src/pages/app/chat/appChatSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from 'js-cookie';
import { toast } from "react-toastify";

const API_BASE_URL = "https://demo.aentora.com/backend/public/api/chat";
const IMAGE_BASE_URL = "https://demo.aentora.com/backend/public/storage/";

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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.isLoading = false; state.contacts = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(fetchConversation.pending, (state) => { state.isMessagesLoading = true; state.messagesError = null; })
      .addCase(fetchConversation.fulfilled, (state, action) => { state.isMessagesLoading = false; state.messFeed = action.payload; })
      .addCase(fetchConversation.rejected, (state, action) => { state.isMessagesLoading = false; state.messagesError = action.payload; });
  },
});

export const { openChat, toggleMobileChatSidebar, infoToggle, sendMessage, toggleProfile, setContactSearch, toggleActiveChat } = appChatSlice.actions;
export default appChatSlice.reducer;