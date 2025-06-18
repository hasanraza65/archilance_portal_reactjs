// src/pages/app/chat/appChatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/chat`;
const IMAGE_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const getTokenFromCookie = () => Cookies.get("token");

export const fetchUsers = createAsyncThunk(
  "appchat/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const token = getTokenFromCookie();
      if (!token) return rejectWithValue("Authentication token not found.");
      const response = await axios.get(`${API_BASE_URL}/users-list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const users = response.data.users;
      return users.map((user) => ({
        id: user.id,
        fullName: user.name,
        avatar: user.profile_pic
          ? `${IMAGE_BASE_URL}${user.profile_pic}`
          : null,
        role: "User",
        status: "active",
        lastmessage: user.last_message || "No recent messages",
        unredmessage: user.unread_count || 0,
        lastmessageTime: user.last_message_at,
      }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load contacts."
      );
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
      if (!loggedInUserId)
        return rejectWithValue("Could not find logged-in user ID.");
      const response = await axios.get(
        `${API_BASE_URL}/conversations/${contactId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const messages = response.data.data;
      return messages.map((msg) => ({
        id: msg.id,
        content: msg.message,
        sender: msg.sender_id === loggedInUserId ? "me" : "them",
        time: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        img: msg.sender.profile_pic
          ? `${IMAGE_BASE_URL}${msg.sender.profile_pic}`
          : null,
        senderFullName: msg.sender.name,
        reactions: msg.reactions || [],
        attachments: (msg.attachments || []).map(att => ({
            ...att, // API must send `mime_type`
            url: `${IMAGE_BASE_URL}${att.file_path}` 
        })),
      }));
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load messages."
      );
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
      if (!loggedInUserId)
        return rejectWithValue("Could not find logged-in user ID.");

      const API_URL = `${API_BASE_URL}/send`;
      const formData = new FormData();
      formData.append("message", messageData.content || messageData.caption || ""); 
      formData.append("receiver_id", messageData.receiverId);

      if (messageData.attachments && messageData.attachments.length > 0) {
        messageData.attachments.forEach(file => {
          formData.append('attachments[]', file);
        });
      }

      const response = await axios.post(API_URL, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const newMessage = response.data.chat;
      const loggedInUser = getState().auth.user;

      const formattedAttachments = (newMessage.attachments || []).map(att => ({
        ...att, // API must send `mime_type`
        url: `${IMAGE_BASE_URL}${att.file_path}`
      }));
      
      return {
        originalMessage: {
          ...newMessage,
          sender_avatar: loggedInUser.profile_pic,
          sender_name: loggedInUser.name,
          attachments: formattedAttachments,
        },
        formatted: {
          id: newMessage.id,
          content: newMessage.message,
          sender: "me",
          time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          img: null,
          senderFullName: loggedInUser?.name,
          reactions: [],
          attachments: formattedAttachments,
        },
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message.");
      return rejectWithValue(
        error.response?.data?.message || "Failed to send message."
      );
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
      await axios.delete(API_URL, { headers: { Authorization: `Bearer ${token}` } });
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
      formData.append("message", newContent);
      const response = await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
      const updatedMessage = response.data.chat;
      toast.success("Message updated successfully");
      return { id: updatedMessage.id, content: updatedMessage.message };
    } catch (error) {
      toast.error("Failed to update message.");
      return rejectWithValue(error.response?.data?.message || "Failed to update message.");
    }
  }
);

export const addReaction = createAsyncThunk(
  "appchat/addReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      const token = getTokenFromCookie();
      if (!token) return rejectWithValue("Authentication token not found.");
      const API_URL = `${API_BASE_URL}/reaction`;
      const formData = new FormData();
      formData.append("chat_id", messageId);
      formData.append("reaction", emoji);
      const response = await axios.post(API_URL, formData, { headers: { Authorization: `Bearer ${token}` } });
      return response.data;
    } catch (error) {
      toast.error("Failed to add reaction.");
      return rejectWithValue(error.response?.data?.message || "Failed to add reaction.");
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
      const contactIndex = state.contacts.findIndex((c) => c.id === action.payload.contact.id);
      if (contactIndex !== -1) { state.contacts[contactIndex].unredmessage = 0; }
    },
    toggleMobileChatSidebar: (state, action) => { state.mobileChatSidebar = action.payload; },
    infoToggle: (state, action) => { state.openinfo = action.payload; },
    toggleProfile: (state, action) => { state.openProfile = action.payload; },
    setContactSearch: (state, action) => { state.searchContact = action.payload; },
    toggleActiveChat: (state, action) => { state.activechat = action.payload; },
    addLiveMessage: (state, action) => {
      const newMessage = action.payload;
      if (newMessage && state.activechat && state.user && newMessage.sender_id == state.user.id) {
        const formattedAttachments = (newMessage.attachments || []).map(att => ({ ...att, url: `${IMAGE_BASE_URL}${att.file_path}` }));
        const formattedMessage = {
          id: newMessage.id || `socket-${Date.now()}`,
          content: newMessage.message,
          sender: "them",
          time: new Date(newMessage.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          img: newMessage.sender_avatar ? `${IMAGE_BASE_URL}${newMessage.sender_avatar}` : null,
          senderFullName: newMessage.sender_name,
          reactions: newMessage.reactions || [],
          attachments: formattedAttachments,
        };
        state.messFeed.push(formattedMessage);
      }
    },
    liveDeleteMessage: (state, action) => {
      const { messageId } = action.payload;
      if (state.activechat) { state.messFeed = state.messFeed.filter((message) => message.id !== messageId); }
    },
    liveUpdateMessage: (state, action) => {
      const { messageId, content } = action.payload;
      if (state.activechat) {
        const messageIndex = state.messFeed.findIndex((msg) => msg.id === messageId);
        if (messageIndex !== -1) { state.messFeed[messageIndex].content = content; }
      }
    },
    liveUpdateReaction: (state, action) => {
      const { messageId, reaction } = action.payload;
      if (!state.activechat) return;
      const message = state.messFeed.find((m) => m.id === messageId);
      if (message) {
        const existingReactionIndex = message.reactions.findIndex((r) => r.user_id === reaction.user_id);
        if (existingReactionIndex > -1) {
          if (message.reactions[existingReactionIndex].reaction === reaction.reaction) {
            message.reactions.splice(existingReactionIndex, 1);
          } else {
            message.reactions[existingReactionIndex] = reaction;
          }
        } else {
          message.reactions.push(reaction);
        }
      }
    },
    updateContactLastMessage: (state, action) => {
      const { sender_id, message, created_at, receiver_id } = action.payload;
      const loggedInUserId = state.auth?.user?.id;
      if (!loggedInUserId) return;
      const isMySentMessage = sender_id === loggedInUserId;
      const contactId = isMySentMessage ? receiver_id : sender_id;
      const contactIndex = state.contacts.findIndex((contact) => contact.id == contactId);
      if (contactIndex !== -1) {
        state.contacts[contactIndex].lastmessage = message || 'Attachment';
        state.contacts[contactIndex].lastmessageTime = created_at;
        if (!isMySentMessage && (!state.activechat || state.user.id != sender_id)) {
          state.contacts[contactIndex].unredmessage = (state.contacts[contactIndex].unredmessage || 0) + 1;
        }
        const updatedContact = state.contacts.splice(contactIndex, 1)[0];
        state.contacts.unshift(updatedContact);
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
        const { content, caption, attachments } = action.meta.arg;
        let tempAttachments = [];
        if (attachments && attachments.length > 0) {
          tempAttachments = attachments.map(file => ({
            url: URL.createObjectURL(file),
            mime_type: file.type,
            file_name: file.name,
            is_local: true,
          }));
        }
        state.messFeed.push({
          id: `temp-${Date.now()}`,
          content: content || caption,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          reactions: [],
          attachments: tempAttachments,
        });
      })
      .addCase(sendMessageToServer.fulfilled, (state, action) => {
        const tempMessageIndex = state.messFeed.findIndex((msg) => msg.id.toString().startsWith("temp-"));
        if (tempMessageIndex !== -1) {
          const tempMsg = state.messFeed[tempMessageIndex];
          if (tempMsg.attachments) {
            tempMsg.attachments.forEach(att => {
              if (att.is_local) { URL.revokeObjectURL(att.url); }
            });
          }
          state.messFeed[tempMessageIndex] = action.payload.formatted;
        }
        const { receiverId } = action.meta.arg;
        const sentMessage = action.payload.formatted;
        const contactIndex = state.contacts.findIndex((contact) => contact.id == receiverId);
        if (contactIndex !== -1) {
          state.contacts[contactIndex].lastmessage = sentMessage.content || 'Attachment';
          state.contacts[contactIndex].lastmessageTime = new Date().toISOString();
          const updatedContact = state.contacts.splice(contactIndex, 1)[0];
          state.contacts.unshift(updatedContact);
        }
      })
      .addCase(sendMessageToServer.rejected, (state, action) => {
        const tempMessageIndex = state.messFeed.findIndex((msg) => msg.id.toString().startsWith("temp-"));
        if (tempMessageIndex !== -1) {
          const tempMsg = state.messFeed[tempMessageIndex];
          if (tempMsg.attachments) {
            tempMsg.attachments.forEach(att => {
              if (att.is_local) { URL.revokeObjectURL(att.url); }
            });
          }
          state.messFeed.splice(tempMessageIndex, 1);
        }
        console.error("Send message failed:", action.payload);
      })
      .addCase(deleteMessage.fulfilled, (state, action) => { state.messFeed = state.messFeed.filter((message) => message.id !== action.payload); })
      .addCase(deleteMessage.rejected, (state, action) => { console.error("Delete message failed:", action.payload); })
      .addCase(updateMessage.fulfilled, (state, action) => { const { id, content } = action.payload; const messageIndex = state.messFeed.findIndex((msg) => msg.id === id); if (messageIndex !== -1) { state.messFeed[messageIndex].content = content; } })
      .addCase(updateMessage.rejected, (state, action) => { console.error("Update message failed:", action.payload); })
      .addCase(addReaction.fulfilled, (state, action) => {
        const reactionData = action.payload.reaction || action.payload.data || action.payload;
        if (!reactionData || !reactionData.chat_id) { console.error("Invalid reaction response from API:", action.payload); return; }
        const message = state.messFeed.find((m) => m.id === reactionData.chat_id);
        if (message) {
          const existingReactionIndex = message.reactions.findIndex((r) => r.user_id === reactionData.user_id);
          if (existingReactionIndex > -1) {
            if (action.payload.deleted) { message.reactions.splice(existingReactionIndex, 1); } else { message.reactions[existingReactionIndex] = reactionData; }
          } else { message.reactions.push(reactionData); }
        }
      })
      .addCase(addReaction.rejected, (state, action) => { console.error("Add reaction failed:", action.payload); });
  },
});

export const {
  openChat, toggleMobileChatSidebar, infoToggle, toggleProfile, setContactSearch,
  toggleActiveChat, addLiveMessage, liveDeleteMessage, liveUpdateMessage,
  liveUpdateReaction, updateContactLastMessage,
} = appChatSlice.actions;
export default appChatSlice.reducer;