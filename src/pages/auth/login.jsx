// src/pages/auth/login.jsx

import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "./common/login-form";
import useDarkMode from "@/hooks/useDarkMode";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";

// image import
import LogoWhite from "@/assets/images/logo-img/logo.png";
import Logo from "@/assets/images/logo-img/logo.png";

const Login = () => {
  const [isDark] = useDarkMode();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/dashboard', { replace: true });
          break;
        case 'employee':
          navigate('/dashboard', { replace: true });
          break;
        case 'customer':
          navigate('/dashboard', { replace: true });
          break;
        default:
          navigate('/profile', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  if (isAuthenticated) {
    return <Loading />;
  }

  return (
    <div className="loginwrapper min-h-screen flex items-center justify-center p-4 bg-white dark:bg-slate-900">
      <div className="lg-inner-column flex bg-white dark:bg-slate-800 shadow-lg rounded-md overflow-hidden">
        <div className="left-column relative z-1 flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-800">
           
           {/* ========== YAHAN CHANGE KIYA GAYA HAI ========== */}
           <Link to="/" className="mt-24 mb-8 block">
              <div className="flex items-center space-x-4">
                <img src={isDark ? LogoWhite : Logo} alt="logo" className="h-16 w-auto" />
                <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                  Archilance LLC
                </h2>
              </div>
            </Link>

          <video
            controls 
            className="w-full max-w-2xl rounded-lg shadow-xl aspect-video object-cover" 
            src="https://res.cloudinary.com/dlffiwsjj/video/upload/v1755871449/for_send_t52hux.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              <div className="mobile-logo mb-6 lg:hidden block">
                <Link to="/" className="flex items-center justify-center space-x-4">
                  <img
                    src={isDark ? LogoWhite : Logo}
                    alt="logo"
                    className="h-16 w-auto"
                  />
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Archilance LLC
                  </h2>
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign in</h4>
                <div className="text-slate-500 text-base">
                  Sign in to your account to start using Archilance LLC
                </div>
              </div>
              <LoginForm />
            </div>
            <div className="auth-footer text-center">
              © {new Date().getFullYear()}, Developed by{" "}
              <a
                href="https://5techsol.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                5techsol
              </a>
              . All Rights Reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;