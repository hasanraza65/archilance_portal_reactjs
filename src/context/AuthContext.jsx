// src/context/AuthContext.jsx

import React, { createContext, useState, useContext } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";

const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = Cookies.get("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Could not parse user cookie:", e);
      Cookies.remove("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return Cookies.get("token");
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: ROLE_MAP[userData.user_role] || 'unknown',
      };
      const isDevelopment = import.meta.env.DEV;
      const cookieOptions = {
        secure: !isDevelopment,
        sameSite: 'Lax',
      };
      if (rememberMe) {
        cookieOptions.expires = 7;
      }
      setUser(userToSave);
      setToken(apiResponse.access_token);
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);
      return userToSave;
    } else {
      toast.error("Login failed: Invalid data from server.");
      return null;
    }
  };

  const logout = () => {
    dispatch(logOut());
    setUser(null);
    setToken(null);
    Cookies.remove("user");
    Cookies.remove("token");
    toast.info("You have been logged out."); // Yeh notification call karega
    navigate("/login");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};