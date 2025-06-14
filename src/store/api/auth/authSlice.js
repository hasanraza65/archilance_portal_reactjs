import { createSlice } from "@reduxjs/toolkit";

// A safer way to get the stored user to prevent crashes
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
};

const user = getStoredUser();

export const authSlice = createSlice({
  name: "auth", // This name creates the 'state.auth' key.
  initialState: {
    user: user,
    isAuth: !!user,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuth = true;
    },
    logOut: (state) => {
      state.user = null;
      state.isAuth = false;
    },
  },
});

export const { setUser, logOut } = authSlice.actions;
export default authSlice.reducer;