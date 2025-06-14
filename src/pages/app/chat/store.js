// src/pages/app/chat/appChatSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from 'js-cookie';
import { toast } from "react-toastify";

// --- API Configuration ---
const API_URL = "https://demo.aentora.com/backend/public/api/chat/users-list";
const IMAGE_BASE_URL = "https://demo.aentora.com/backend/public/storage/";

const getTokenFromCookie = () => Cookies.get('token');

/**
 * AsyncThunk to fetch the list of contacts from the API.
 * It's exported directly so components can dispatch it.
 */
export const fetchUsers = createAsyncThunk(
  "appchat/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
        const token = getTokenFromCookie();
        if (!token) return rejectWithValue("Authentication token not found.");

        const response = await axios.get(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log("API Response (Users):", response.data);
        const users = response.data.users;

        // Map API data. If profile_pic is missing, set avatar to null.
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
        const errorMessage = error.response?.data?.message || error.message;
        console.error("Failed to fetch users:", errorMessage);
        return rejectWithValue(errorMessage);
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
    profileinfo: {},
    messFeed: [],
    contacts: [], // Will be populated by the API
    chats: [], // Should also be populated by an API for message history
    isLoading: false,
    error: null,
  },
  reducers: {
    openChat: (state, action) => {
      state.activechat = true;
      state.mobileChatSidebar = false;
      state.user = action.payload.contact;
      const chatHistory = state.chats.find((chat) => chat.userId === action.payload.contact.id);
      state.messFeed = chatHistory ? chatHistory.messages : [];
    },
    toggleMobileChatSidebar: (state, action) => {
      state.mobileChatSidebar = action.payload;
    },
    infoToggle: (state, action) => {
      state.openinfo = action.payload;
    },
    sendMessage: (state, action) => {
      state.messFeed.push(action.payload);
    },
    toggleProfile: (state, action) => {
      state.openProfile = action.payload;
    },
    setContactSearch: (state, action) => {
      state.searchContact = action.payload;
    },
    toggleActiveChat: (state, action) => {
      state.activechat = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        toast.error(action.payload || "Failed to load contacts");
      });
  },
});

export const {
  openChat,
  toggleMobileChatSidebar,
  infoToggle,
  sendMessage,
  toggleProfile,
  setContactSearch,
  toggleActiveChat,
} = appChatSlice.actions;

export default appChatSlice.reducer;