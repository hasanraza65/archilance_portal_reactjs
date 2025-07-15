// File: src/pages/auth/login.jsx

import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "./common/login-form";
import useDarkMode from "@/hooks/useDarkMode";
import { useAuth } from "@/context/AuthContext";
import Loading from "@/components/Loading";

// image import
import LogoWhite from "@/assets/images/logo-img/logo.png";
import Logo from "@/assets/images/logo-img/logo.png";
import Illustration from "@/assets/images/auth/ils1.svg";

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
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-1">
          <div className="max-w-[520px] pt-20 ltr:pl-20 rtl:pr-20">
            {/* Change: Logo aur Text ko ek saath dikhane ke liye flex container banaya gaya hai */}
            <Link to="/" className="mb-10 block">
              <div className="flex items-center space-x-4">
                <img src={isDark ? LogoWhite : Logo} alt="logo" className="h-16 w-auto" />
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Archilance LLC
                </h2>
              </div>
            </Link>

            <h4>
              Unlock your Project
              <span className="text-slate-800 dark:text-slate-400 font-bold">
                performance
              </span>
            </h4>
          </div>
          <div className="absolute left-0 2xl:bottom-[-160px] bottom-[-130px] h-full w-full z-[-1]">
            <img
              src={Illustration}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box h-full flex flex-col justify-center">
              {/* Change: Mobile view ke liye bhi logo aur text ko ek saath dikhaya gaya hai */}
              <div className="mobile-logo mb-6 lg:hidden block">
                <Link to="/" className="flex items-center justify-center space-x-4">
                  <img
                    src={isDark ? LogoWhite : Logo}
                    alt="logo"
                    className="h-16 w-auto"
                  />
                   <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Archilance LLC
                  </h2>
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign in</h4>
                <div className="text-slate-500 text-base">
                  Sign in to your account to start using Archilance LLC
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