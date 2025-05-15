
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

const ProtectedRoute = () => {
  const token = Cookies.get('token'); // Check for the authentication token in cookies
  const location = useLocation();

  if (!token) {
    // If no token, redirect the user to the login page (which is '/' in your App.jsx)
    // Pass the current location in state so after login, user can be redirected back
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If token exists, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;