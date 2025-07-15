import React from "react";
import { Link } from "react-router-dom";
import ForgotPassForm from "./common/forgot-pass"; // Component name updated for clarity
import useDarkMode from "@/hooks/useDarkMode";

import LogoWhite from "@/assets/images/logo-img/logo.png";
import Logo from "@/assets/images/logo-img/logo.png";
import Illustration from "@/assets/images/auth/ils1.svg";

// Component name should start with a capital letter
const ForgotPass = () => {
  const [isDark] = useDarkMode();
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
          <div className="absolute left-0 bottom-[-130px] h-full w-full z-[-1]">
            <img
              src={Illustration}
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </div>
        <div className="right-column relative">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800">
            <div className="auth-box2 flex flex-col justify-center h-full">
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

              <div className="text-center 2xl:mb-10 mb-5">
                <h4 className="font-medium mb-4">Forgot Your Password?</h4>
                <div className="text-slate-500 dark:text-slate-400 text-base">
                  Reset Password with Archilance LLC.
                </div>
              </div>
              <div className="font-normal text-base text-slate-500 dark:text-slate-400 text-center px-2 bg-slate-100 dark:bg-slate-600 rounded-sm py-3 mb-4 mt-10">
                Enter your Email and instructions will be sent to you!
              </div>

              {/* Assuming the form component is imported as ForgotPassForm */}
              <ForgotPassForm />
              <div className="md:max-w-[345px] mx-auto font-normal text-slate-500 dark:text-slate-400 2xl:mt-12 mt-8 uppercase text-sm">
                Forget It,
                <Link
                  to="/"
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                >
                  Send me Back
                </Link>
                to The Sign In
              </div>
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

// Component name updated here as well
export default ForgotPass;