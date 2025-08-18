import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logOut as logOutRedux } from "@/store/api/auth/authSlice";
import UpdatePasswordModal from "@/pages/member/UpdatePasswordModal";
import axios from "axios"; 

const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
  5: "member",
};

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || "https://portal.archilance.net/backend/public";
const LOGOUT_API_URL = `${BACKEND_BASE_URL}/api/logout`;


const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = Cookies.get("user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      return null;
    } catch (e) {
      console.error("Failed to parse user cookie", e);
      Cookies.remove("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => Cookies.get("token"));

  const [isPasswordUpdateRequired, setIsPasswordUpdateRequired] = useState(() => {
    try {
      const savedUser = Cookies.get("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        return parsedUser.role === 'member' && parsedUser.is_default_pass === 1;
      }
      return false;
    } catch {
      return false;
    }
  });

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

      if (userRoleString === 'unknown') {
        toast.error(`Login failed: Unknown user role received from server (ID: ${userData.user_role}).`);
        return null;
      }

      const userToSave = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userRoleString,
        profile_pic: userData.profile_pic,
        is_default_pass: userData.is_default_pass,
        employee_type: userData.employee_type,
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
      const fcmTokenFromFlutter = localStorage.getItem("fcm_token");
      console.log("fcmtoken",fcmTokenFromFlutter);
      Cookies.set("userRole", userRoleString, cookieOptions);

      dispatch(setReduxUser(userToSave));
      if (Number(userData.user_role) === 5 && Number(userData.is_default_pass) === 1) {
        setIsPasswordUpdateRequired(true);
      } else {
        setIsPasswordUpdateRequired(false);
      }

      if (userRoleString === 'employee' || userRoleString === 'member') {
        navigate("/jobs", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
   
      return userToSave;
    } else {
      toast.error("Login failed: Invalid data received from server.");
      return null;
    }
  };

  const logout = async () => {
    const currentToken = Cookies.get("token");

    if (currentToken) {
      try {
       
        await axios.post(
          LOGOUT_API_URL,
          {}, 
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
              Accept: "application/json",
            },
          }
        );
        
      } catch (error) {
        console.error("Backend logout failed, proceeding with frontend logout:", error);
        toast.error("Could not log out from the server, but you have been logged out locally.");
      }
    }
    setUser(null);
    setToken(null);
    setIsPasswordUpdateRequired(false);

    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userRole");

    dispatch(logOutRedux());

    toast.info("You have been logged out.");
    navigate("/login");
  };


  const handlePasswordUpdateSuccess = () => {
    setIsPasswordUpdateRequired(false);

    if (user) {
      const updatedUser = { ...user, is_default_pass: 0 };
      setUser(updatedUser);
      const rememberMe = !!Cookies.get('token');
      const cookieOptions = {
        secure: !import.meta.env.DEV,
        sameSite: 'Lax',
        expires: rememberMe ? 7 : undefined,
      };
      Cookies.set("user", JSON.stringify(updatedUser), cookieOptions);
    }

    toast.info("You can now continue using the application.");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isPasswordUpdateRequired && (
        <UpdatePasswordModal onUpdateSuccess={handlePasswordUpdateSuccess} />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};