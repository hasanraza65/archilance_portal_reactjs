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
    return <Navigate to="/404" replace />;
  }

  return children;
};

export default ProtectedRoute;