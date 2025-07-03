import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
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

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch, user]);

  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      
      const userRoleString = ROLE_MAP[userData.user_role] || 'unknown';

      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userRoleString,
        profile_pic: userData.profile_pic,
      };

      const cookieOptions = {
        secure: !import.meta.env.DEV,
        sameSite: 'Lax',
        expires: rememberMe ? 7 : undefined,
      };

      setUser(userToSave);
      setToken(apiResponse.access_token);
      
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);
      Cookies.set("userRole", userRoleString, cookieOptions);

      dispatch(setReduxUser(userToSave));

      return userToSave;
    } else {
      toast.error("Login failed: Invalid data from server.");
      return null;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userRole");

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