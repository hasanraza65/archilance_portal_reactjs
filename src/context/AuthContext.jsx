import React, { createContext, useState, useContext, useEffect } from "react";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logOut as logOutRedux } from "@/store/api/auth/authSlice";
import UpdatePasswordModal from "@/pages/member/UpdatePasswordModal";
import axios from "axios"; 

// ====================================================================
// SECTION 1: HELPER FUNCTIONS & CONSTANTS
// ====================================================================

const isMobile = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
};

const ROLE_MAP = {
  2: "admin",
  3: "employee",
  4: "customer",
  5: "member",
};

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const LOGOUT_API_URL = `${BACKEND_BASE_URL}/api/logout`;

// ====================================================================
// SECTION 2: AUTH CONTEXT SETUP
// ====================================================================

const AuthContext = createContext({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// ====================================================================
// SECTION 3: AUTH PROVIDER COMPONENT
// ====================================================================

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const initializeAuthState = () => {
    try {
      const userFromCookie = Cookies.get("user");
      const tokenFromCookie = Cookies.get("token");

      if (userFromCookie && tokenFromCookie) {
        return { user: JSON.parse(userFromCookie), token: tokenFromCookie };
      }

      if (isMobile()) {
        const userFromBackup = localStorage.getItem("user");
        const tokenFromBackup = localStorage.getItem("token");

        if (userFromBackup && tokenFromBackup) {
          console.log("Session cookie not found. Restoring session from localStorage backup.");
          const parsedUser = JSON.parse(userFromBackup);
          
          Cookies.set("user", userFromBackup);
          Cookies.set("token", tokenFromBackup);
          Cookies.set("userRole", parsedUser.role);

          return { user: parsedUser, token: tokenFromBackup };
        }
      }

      return { user: null, token: null };

    } catch (error) {
      console.error("Failed to initialize auth state. Clearing storage.", error);
      Cookies.remove("user");
      Cookies.remove("token");
      Cookies.remove("userRole");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return { user: null, token: null };
    }
  };

  const [initialState] = useState(initializeAuthState);
  const [user, setUser] = useState(initialState.user);
  const [token, setToken] = useState(initialState.token);

  const [isPasswordUpdateRequired, setIsPasswordUpdateRequired] = useState(() => {
    if (initialState.user) {
      return initialState.user.role === 'member' && initialState.user.is_default_pass === 1;
    }
    return false;
  });

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch, user]);

  const login = (apiResponse, rememberMe = false) => {
    if (!apiResponse?.user || !apiResponse?.access_token) {
      toast.error("Login failed: Invalid data received from server.");
      return null;
    }
    
    const { user: userData, access_token: accessToken } = apiResponse;
    let userRole = ROLE_MAP[userData.user_role] || 'unknown';

    if (userRole === 'unknown') {
      toast.error(`Login failed: Unknown user role ID: ${userData.user_role}.`);
      return null;
    }
    
    if (userRole === 'employee' && userData.employee_type) {
      const type = userData.employee_type.toLowerCase();
      if (type === 'manager' || type === 'outsource') {
        userRole = type;
      }
    }

    const userToSave = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userRole,
      profile_pic: userData.profile_pic,
      is_default_pass: userData.is_default_pass,
      employee_type: userData.employee_type,
    };

    const cookieOptions = {
      secure: !import.meta.env.DEV,
      sameSite: 'Lax',
      expires: rememberMe ? 7 : undefined,
    };

    Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
    Cookies.set("token", accessToken, cookieOptions);
    Cookies.set("userRole", userRole, cookieOptions);

    if (isMobile()) {
      localStorage.setItem("user", JSON.stringify(userToSave));
      localStorage.setItem("token", accessToken);
    }

    setUser(userToSave);
    setToken(accessToken);
    dispatch(setReduxUser(userToSave));
    
    if (Number(userData.user_role) === 5 && Number(userData.is_default_pass) === 1) {
      setIsPasswordUpdateRequired(true);
    } else {
      setIsPasswordUpdateRequired(false);
    }

    // Updated role-based redirection logic
    const jobsRoles = ['employee', 'manager', 'outsource', 'member'];
    if (jobsRoles.includes(userRole)) {
      navigate("/jobs", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
 
    return userToSave;
  };

  const logout = async () => {
    const currentToken = Cookies.get("token");

    if (currentToken) {
      try {
        await axios.post(
          LOGOUT_API_URL, {}, 
          { headers: { Authorization: `Bearer ${currentToken}`, Accept: "application/json" } }
        );
      } catch (error) {
        console.error("Backend logout failed, but proceeding with frontend logout:", error);
      }
    }
    
    setUser(null);
    setToken(null);
    setIsPasswordUpdateRequired(false);
    dispatch(logOutRedux());

    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userRole");
    
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    navigate("/login", { replace: true });
    toast.info("You have been successfully logged out.");
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
      
      const userString = JSON.stringify(updatedUser);
      Cookies.set("user", userString, cookieOptions);
      if (isMobile()) {
          localStorage.setItem("user", userString);
      }
    }
    toast.info("You can now continue using the application.");
  };

  const value = { user, token, login, logout, isAuthenticated: !!user && !!token };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isPasswordUpdateRequired && (
        <UpdatePasswordModal onUpdateSuccess={handlePasswordUpdateSuccess} />
      )}
    </AuthContext.Provider>
  );
};

// ====================================================================
// SECTION 4: CUSTOM HOOK
// ====================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};