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
// Is section mein hum woh chotay functions aur variables rakhenge jo poori file mein istemaal honge.
// ====================================================================

/**
 * Yeh function check karta hai ke user mobile device par hai ya nahi.
 * @returns {boolean} - true agar mobile hai, warna false.
 */
const isMobile = () => {
  // typeof navigator === 'undefined' server-side rendering ke waqt error se bachata hai.
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
// Yahan hum React Context banayenge.
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
// Yeh component poori application ko wrap karega aur authentication state manage karega.
// ====================================================================

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // --- YEH SAB SE AHEM LOGIC HAI ---
  // Yeh function app ke start hone par authentication state ko set karta hai.
  const initializeAuthState = () => {
    try {
      // Step 1: Hamesha pehle Cookies ko check karein. Yeh desktop aur active mobile sessions ke liye hai.
      const userFromCookie = Cookies.get("user");
      const tokenFromCookie = Cookies.get("token");

      if (userFromCookie && tokenFromCookie) {
        // Agar cookie mein data hai, to session active hai.
        return { user: JSON.parse(userFromCookie), token: tokenFromCookie };
      }

      // Step 2: Agar cookie nahi mili AUR hum mobile device par hain, to localStorage (backup) check karein.
      if (isMobile()) {
        const userFromBackup = localStorage.getItem("user");
        const tokenFromBackup = localStorage.getItem("token");

        if (userFromBackup && tokenFromBackup) {
          console.log("Session cookie not found. Restoring session from localStorage backup.");
          const parsedUser = JSON.parse(userFromBackup);
          
          // Step 3: Backup se data utha kar Cookies ko dobara bana dein.
          // Is se aapka baaki ka project (apiHelper, axios) sahi se kaam karega.
          Cookies.set("user", userFromBackup);
          Cookies.set("token", tokenFromBackup);
          Cookies.set("userRole", parsedUser.role);

          // Ab state ko is restored data se set karein.
          return { user: parsedUser, token: tokenFromBackup };
        }
      }

      // Agar kahin bhi kuch nahi mila, to iska matlab hai user logged out hai.
      return { user: null, token: null };

    } catch (error) {
      console.error("Failed to initialize auth state. Clearing storage.", error);
      // Ghalat data hone ki soorat mein har jagah se safai kar dein.
      Cookies.remove("user");
      Cookies.remove("token");
      Cookies.remove("userRole");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return { user: null, token: null };
    }
  };

  // initializeAuthState ko sirf ek baar call karne ke liye useState ka istemaal karein.
  const [initialState] = useState(initializeAuthState);

  const [user, setUser] = useState(initialState.user);
  const [token, setToken] = useState(initialState.token);

  // Yeh state check karegi ke member ko password update karna hai ya nahi.
  const [isPasswordUpdateRequired, setIsPasswordUpdateRequired] = useState(() => {
    if (initialState.user) {
      return initialState.user.role === 'member' && initialState.user.is_default_pass === 1;
    }
    return false;
  });

  // Redux state ko React context ke sath sync rakhein.
  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
  }, [dispatch, user]);

  /**
   * User ko login karwata hai aur session data save karta hai.
   */
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

    // Step 1: Data ko hamesha Cookies mein save karein (taake poora project kaam kare).
    Cookies.set("user", JSON.stringify(userToSave), cookieOptions);
    Cookies.set("token", accessToken, cookieOptions);
    Cookies.set("userRole", userRole, cookieOptions);

    // Step 2: Agar mobile hai, to localStorage mein ek "backup" bhi save kar dein.
    if (isMobile()) {
      localStorage.setItem("user", JSON.stringify(userToSave));
      localStorage.setItem("token", accessToken);
    }

    // State update karna
    setUser(userToSave);
    setToken(accessToken);
    dispatch(setReduxUser(userToSave));
    
    // Password update check
    if (Number(userData.user_role) === 5 && Number(userData.is_default_pass) === 1) {
      setIsPasswordUpdateRequired(true);
    } else {
      setIsPasswordUpdateRequired(false);
    }

    // Role ke hisab se redirect karna
    const jobsRoles = ['employee', 'member', 'manager', 'outsource'];
    if (jobsRoles.includes(userRole)) {
      navigate("/jobs", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
 
    return userToSave;
  };

  /**
   * User ko logout karwata hai, session clear karta hai, aur redirect karta hai.
   */
  const logout = async () => {
    const currentToken = Cookies.get("token"); // Token hamesha cookie se hi lein.

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
    
    // Step 1: State, Redux, Cookies, aur localStorage (backup) sab ko clear karein.
    setUser(null);
    setToken(null);
    setIsPasswordUpdateRequired(false);
    dispatch(logOutRedux());

    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("userRole");
    
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Step 2: Foran login page par redirect karein.
    navigate("/login", { replace: true });

    // Step 3: Aakhir mein user ko message dikhayein.
    toast.info("You have been successfully logged out.");
  };

  /**
   * Password update hone ke baad user data ko update karta hai.
   */
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
      // Updated user ko Cookies aur localStorage backup dono mein save karein.
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
// Is hook se hum aasani se context ko kisi bhi component mein istemaal kar sakte hain.
// ====================================================================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};