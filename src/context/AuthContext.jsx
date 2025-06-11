import React, { createContext, useState, useContext } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

// Role mapping (Backend se aane wale numbers ko asaan naamon mein badalne ke liye)
const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
};

// 1. Context create karein
const AuthContext = createContext(null);

// 2. Provider Component banayein
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Page refresh par Cookies se user data load karein
    const savedUser = Cookies.get("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => {
    // Token ko bhi Cookies se load karein
    return Cookies.get("token");
  });

  // Login function ab API se mila data lega
  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      
      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: ROLE_MAP[userData.user_role] || 'unknown',
      };

      // Cookie options set karein
      const isDevelopment = import.meta.env.DEV;
      const cookieOptions = {
        secure: !isDevelopment, 
        sameSite: 'Lax',
      };
      if (rememberMe) {
        cookieOptions.expires = 7; // 7 din ke liye cookie save karein
      }
      
      // State aur Cookies ko update karein
      setUser(userToSave);
      setToken(apiResponse.access_token);
      
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);
      
      // Ab toast yahan se bhi de sakte hain ya component se, component se behtar hai
      // toast.success(`Welcome back, ${userToSave.name}!`);
      return userToSave; // User object return karein taake component redirection kar sake
    } else {
      toast.error("Login failed: Invalid data from server.");
      return null;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove("user");
    Cookies.remove("token");
    toast.info("You have been logged out.");
    // Logout ke baad login page par redirect karna zaroori hai
    // Yeh routing level par handle karna behtar hai
    window.location.pathname = '/';
  };

  // Context ki value
  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};