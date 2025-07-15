import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";

import MainLogo from "@/assets/images/logo-img/logo.png";
import LogoWhite from "@/assets/images/logo-img/logo.png";
import MobileLogo from "@/assets/images/logo-img/logo.png";
import MobileLogoWhite from "@/assets/images/logo-img/logo.png";

const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();

  return (
    <div>
      <Link to="/dashboard">
        {/* Change: Wrapped logo and text in a flex container for alignment */}
        <div className="flex items-center space-x-3">
          {width >= breakpoints.xl ? (
            // Change: Added size class to the logo
            <img src={isDark ? LogoWhite : MainLogo} alt="logo" className="h-10 w-auto" />
          ) : (
            // Change: Added size class to the mobile logo
            <img src={isDark ? MobileLogoWhite : MobileLogo} alt="logo" className="h-10 w-auto" />
          )}

          {/* Change: Added the text next to the logo */}
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Archilance LLC
          </h1>
        </div>
      </Link>
    </div>
  );
};

export default Logo;