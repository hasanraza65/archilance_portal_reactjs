import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { canManageEmployees } from '@/pages/utility/apiHelper';

const ProtectedRoute = ({ children, allowedRoles, requireManagerAccess = false }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireManagerAccess) {
    if (canManageEmployees()) {
      return children;
    } else {
      return <Navigate to="/jobs" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // --- YEH HAI NAYI DEFAULT PATH LOGIC ---
    let defaultPath = '/jobs'; // Default page for roles like 'employee', 'member'
    
    // Roles that should go to the dashboard
    if (['admin', 'customer', 'manager', 'outsource'].includes(user.role)) {
      defaultPath = '/dashboard';
    }
    
    return <Navigate to={defaultPath} replace />;
  }

  return children;
};

export default ProtectedRoute;