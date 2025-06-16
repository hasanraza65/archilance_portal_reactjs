// src/store/api/auth/authSlice.js

import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// This helper function now matches the logic in your AuthContext
const getStoredUser = () => {
  try {
    const savedUser = Cookies.get("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (e) {
    console.error("Could not parse user cookie for Redux:", e);
    Cookies.remove("user");
    return null;
  }
};

const user = getStoredUser();

const initialState = {
  user: user,
  isAuth: !!user, // isAuth is true if a user object exists
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // This action will be dispatched from your AuthContext on login
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuth = !!action.payload;
    },
    // This action is already being dispatched from your AuthContext on logout
    logOut: (state) => {
      state.user = null;
      state.isAuth = false;
    },
  },
});

// Export the actions so your AuthContext can use them
export const { setUser, logOut } = authSlice.actions;

export default authSlice.reducer;