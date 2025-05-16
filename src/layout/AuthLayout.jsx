
import React from 'react';
import { Outlet, Navigate } 
from 'react-router-dom';
import Cookies from 'js-cookie';
import Loading from '@/components/Loading'; 

const AuthLayout = () => {
  const [isLoading, setIsLoading] = React.useState(true); 
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const token = Cookies.get('token');
    
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <Loading />; 
  }

  if (isAuthenticated) {
    
    return <Navigate to="/dashboard" replace />;
  }

  
  return (
   
        <Outlet />
     
  );
};

export default AuthLayout;