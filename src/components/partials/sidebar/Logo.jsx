import React from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import useDarkMode from "@/hooks/useDarkMode";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";

// import images
import MobileLogo from "@/assets/images/logo-img/logo.png";
import MobileLogoWhite from "@/assets/images/logo-img/logo.png";

const SidebarLogo = ({ menuHover }) => {
  const [isDark] = useDarkMode();
  const [collapsed, setMenuCollapsed] = useSidebar();
  // semi dark
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();
  return (
    <div
      className={` logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-9 py-6  px-4 
      ${menuHover ? "logo-hovered" : ""}
      ${
        skin === "bordered"
          ? " border-b border-r-0 border-slate-200 dark:border-slate-700"
          : " border-none"
      }
      
      `}
    >
      <Link to="/dashboard">
        {/* Change: Adjusted spacing from space-x-4 to space-x-3 */}
        <div className="flex items-center space-x-3">
          <div className="logo-icon">
            {!isDark && !isSemiDark ? (
              // Change: Added size classes to the logo
              <img src={MobileLogo} alt="" className="w-10 h-10" />
            ) : (
              // Change: Added size classes to the logo
              <img src={MobileLogoWhite} alt="" className="w-10 h-10" />
            )}
          </div>

          {(!collapsed || menuHover) && (
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Archilance LLC
              </h1>
            </div>
          )}
        </div>
      </Link>

      {(!collapsed || menuHover) && (
        <div
          onClick={() => setMenuCollapsed(!collapsed)}
          className={`h-4 w-4 border-[1.5px] border-slate-900 dark:border-slate-700 rounded-full transition-all duration-150
          ${
            collapsed
              ? ""
              : "ring-2 ring-inset ring-offset-4 ring-black-900 dark:ring-slate-400 bg-slate-900 dark:bg-slate-400 dark:ring-offset-slate-700"
          }
          `}
        ></div>
      )}
    </div>
  );
};

export default SidebarLogo;