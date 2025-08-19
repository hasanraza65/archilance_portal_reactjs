import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
// Step 1: Apna naya helper function import karein
import { canManageEmployees } from '@/pages/utility/apiHelper';

const ProtectedRoute = ({ children, allowedRoles, requireManagerAccess = false }) => {
  // Redux store se user ka data get karein
  const user = useSelector((state) => state.auth.user);

  // --- Check 1: Kya user logged in hai? ---
  // Agar user object nahi hai, to wapas login page par bhejein (aapka code "/" par bhej raha hai, jo theek hai).
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // --- Check 2: Kya is route ke liye "Manager" access zaroori hai? ---
  // Yeh naya logic block hai jo humne add kiya hai.
  if (requireManagerAccess) {
    // Humara central function check karega ke user admin hai YA manager.
    // canManageEmployees() cookie se data parhega jo Redux store ke saath sync mein hai.
    if (canManageEmployees()) {
      // Agar access hai, to page ko render hone dein.
      return children;
    } else {
      // Agar access nahi hai (e.g., normal employee hai), to usay default page par redirect kar dein.
      return <Navigate to="/jobs" replace />;
    }
  }

  // --- Check 3: Purana role-based check (baaki sab routes ke liye) ---
  // Agar `allowedRoles` ka prop pass hua hai, to usay check karein.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Agar user ka role allowed nahi hai, to usay uske default page par bhejein.
    const defaultPath =
      user.role === 'employee' || user.role === 'member'
        ? '/jobs'
        : '/dashboard';
    
    return <Navigate to={defaultPath} replace />;
  }

  // --- Success: Agar upar koi bhi check fail nahi hua, to page dikhayein ---
  return children;
};

export default ProtectedRoute;