// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

// --- KEY CHANGE: Import the correct actions from your updated slice ---
import { setUser as setReduxUser, logOut as logOutRedux } from "@/store/api/auth/authSlice";

const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = Cookies.get("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      Cookies.remove("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => Cookies.get("token"));

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- KEY CHANGE: Sync Redux on initial load ---
  // This ensures that if the page is refreshed, Redux gets the user data from the cookie.
  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch]);

  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: ROLE_MAP[userData.user_role] || 'unknown',
        profile_pic: userData.profile_pic, // Include profile_pic for other components
      };

      const cookieOptions = {
        secure: !import.meta.env.DEV,
        sameSite: 'Lax',
        expires: rememberMe ? 7 : undefined,
      };

      // 1. Update React Context State
      setUser(userToSave);
      setToken(apiResponse.access_token);
      
      // 2. Set Cookies
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);

      // --- KEY CHANGE: 3. Dispatch action to update Redux Store ---
      dispatch(setReduxUser(userToSave));

      return userToSave;
    } else {
      toast.error("Login failed: Invalid data from server.");
      return null;
    }
  };

  const logout = () => {
    // 1. Update React Context State
    setUser(null);
    setToken(null);
    
    // 2. Remove Cookies
    Cookies.remove("user");
    Cookies.remove("token");

    // --- KEY CHANGE: Dispatch action to clear Redux Store ---
    // Your code was already doing this, which is great!
    dispatch(logOutRedux());

    toast.info("You have been logged out.");
    navigate("/login");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};