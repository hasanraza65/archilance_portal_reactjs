// src/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logOut as logOutRedux } from "@/store/api/auth/authSlice";

// Yeh mapping bilkul theek hai
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

  // Redux ko cookie ke data se sync karna zaroori hai, yeh logic bhi theek hai
  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch]);

  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      
      // User object mein role sahi se set ho raha hai
      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: ROLE_MAP[userData.user_role] || 'unknown', // Yeh line role set karti hai
        profile_pic: userData.profile_pic,
      };

      const cookieOptions = {
        secure: !import.meta.env.DEV,
        sameSite: 'Lax',
        expires: rememberMe ? 7 : undefined,
      };

      // 1. Context State Update
      setUser(userToSave);
      setToken(apiResponse.access_token);
      
      // 2. Cookies Set
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);

      // 3. Redux Store Update
      dispatch(setReduxUser(userToSave));

      return userToSave;
    } else {
      toast.error("Login failed: Invalid data from server.");
      return null;
    }
  };

  const logout = () => {
    // 1. Context State Clear
    setUser(null);
    setToken(null);
    
    // 2. Cookies Remove
    Cookies.remove("user");
    Cookies.remove("token");

    // 3. Redux Store Clear
    dispatch(logOutRedux());

    toast.info("You have been logged out.");
    navigate("/login");
  };

  const value = {
    user, // Sidebar is 'user' object ko istemal karke role hasil karega
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