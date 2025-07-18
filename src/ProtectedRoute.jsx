import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const defaultPath = user.role === 'employee' ? '/projects' : '/dashboard';
    return <Navigate to={defaultPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;