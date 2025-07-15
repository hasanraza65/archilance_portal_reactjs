import React from "react";
import { Link } from "react-router-dom";
import useDarkMode from "@/hooks/useDarkMode";

import MainLogo from "@/assets/images/logo-img/logo.png";
import LogoWhite from "@/assets/images/logo-img/logo.png";

const MobileLogo = () => {
  const [isDark] = useDarkMode();
  return (
    <Link to="/">
      {/* Change: Wrapped the logo and text in a flex container */}
      <div className="flex items-center space-x-3">
        {/* Change: Added size classes to the logo */}
        <img src={isDark ? LogoWhite : MainLogo} alt="logo" className="h-10 w-auto" />
        
        {/* Change: Added the "Archilance LLC" text */}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Archilance LLC
        </h1>
      </div>
    </Link>
  );
};

export default MobileLogo;