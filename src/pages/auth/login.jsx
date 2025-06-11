// File: src/pages/auth/login.jsx

import React, { useEffect } from "react"; // useEffect import karein
import { Link, useNavigate } from "react-router-dom"; // useNavigate import karein
import LoginForm from "./common/login-form";
// import Social from "./common/social"; // Isko comment kiya gaya hai aapke code mein
import useDarkMode from "@/hooks/useDarkMode";
import { useAuth } from "@/context/AuthContext"; // AuthContext import karein
import Loading from "@/components/Loading"; // Loading spinner import karein

// image import
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import Illustration from "@/assets/images/auth/ils1.svg";

// Component ka naam Capital 'L' se shuru hona chahiye
const Login = () => {
  const [isDark] = useDarkMode();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // <<<--- YAHAN NAYA LOGIC ADD HUA HAI ---<<<
  useEffect(() => {
    // Agar user login hai, to usay login page mat dikhao, balkay redirect karo
    if (isAuthenticated && user) {
      switch (user.role) {
        case 'admin':
          navigate('/dashboard', { replace: true });
          break;
        case 'employee':
          // Employee ko ab projects page par bhej rahe hain
          navigate('/dashboard', { replace: true });
          break;
        case 'customer':
          navigate('/dashboard', { replace: true });
          break;
        default:
          // Fallback ke liye
          navigate('/profile', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Agar user login hai, to redirection ke dauran loading dikhao
  // Taake user ko ek second ke liye bhi login form na dikhe
  if (isAuthenticated) {
    return <Loading />;
  }
  
  // Agar user login nahi hai, to poora login page dikhao
  return (
    <div className="loginwrapper">
      <div className="lg-inner-column">
        <div className="left-column relative z-1">
          <div className="max-w-[520px] pt-20 ltr:pl-20 rtl:pr-20">
            <Link to="/">
              <img src={isDark ? LogoWhite : Logo} alt="" className="mb-10" />
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
              <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/">
                  <img
                    src={isDark ? LogoWhite : Logo}
                    alt=""
                    className="mx-auto"
                  />
                </Link>
              </div>
              <div className="text-center 2xl:mb-10 mb-4">
                <h4 className="font-medium">Sign in</h4>
                <div className="text-slate-500 text-base">
                  Sign in to your account to start using Dashcode
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