import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logOut as logOutRedux } from "@/store/api/auth/authSlice";

// 1. Naya 'member' role yahan add kiya gaya hai
const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
  5: "member", // YAHAN CHANGE KIYA GAYA HAI
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Ye function component ke load hone par sirf ek baar chalta hai
    try {
      const savedUser = Cookies.get("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error("Failed to parse user cookie", e);
      Cookies.remove("user"); // Kharab cookie ko remove kar dein
      return null;
    }
  });

  const [token, setToken] = useState(() => Cookies.get("token"));

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Jab bhi user state change ho, Redux store ko update karein
  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch, user]);

  const login = (apiResponse, rememberMe = false) => {
    if (apiResponse && apiResponse.user && apiResponse.access_token) {
      const userData = apiResponse.user;
      const userRoleString = ROLE_MAP[userData.user_role] || 'unknown';

      // 2. Behtar Error Handling: Agar API se koi na-maloom role aye
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
      };

      // Cookie options set karein
      const cookieOptions = {
        secure: !import.meta.env.DEV, // Production mein secure (HTTPS)
        sameSite: 'Lax',
        // Agar 'rememberMe' true hai, to 7 din, warna session cookie
        expires: rememberMe ? 7 : undefined, 
      };

      // State aur cookies ko update karein
      setUser(userToSave);
      setToken(apiResponse.access_token);
      
      Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
      Cookies.set("token", apiResponse.access_token, cookieOptions);
      Cookies.set("userRole", userRoleString, cookieOptions);

      // Redux store ko update karein
      dispatch(setReduxUser(userToSave));

      // 3. User ko role ke hisab se redirect karein
      if (userRoleString === 'employee') {
        navigate("/jobs", { replace: true });
      } else {
        // admin, customer, aur naya 'member' role, sab dashboard par jayenge
        navigate("/dashboard", { replace: true });
      }

      // Kamyab login par user object return karein
      return userToSave;

    } else {
      toast.error("Login failed: Invalid data received from server.");
      return null;
    }
  };

  const logout = () => {
    // Sab state aur cookies ko saaf kar dein
    setUser(null);
    setToken(null);
    
    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userRole");

    // Redux store se user logout karein
    dispatch(logOutRedux());

    toast.info("You have been logged out.");
    navigate("/login");
  };

  // Context ki value jo poori app mein use hogi
  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook taake context ko asani se use kiya ja sake
export const useAuth = () => {
  return useContext(AuthContext);
};