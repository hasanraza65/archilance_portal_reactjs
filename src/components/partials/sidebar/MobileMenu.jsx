import React, { useRef, useEffect, useState, useMemo } from "react";
import Navmenu from "./Navmenu";
// --- KEY CHANGE 1: Naya 'menuItems' array import karein ---
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useMobileMenu from "@/hooks/useMobileMenu";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

// import images
import MobileLogo from "@/assets/images/logo/logo-c.svg";
import MobileLogoWhite from "@/assets/images/logo/logo-c-white.svg";

const MobileMenu = ({ className = "custom-class" }) => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    // Check if ref is attached before adding listener
    const node = scrollableNodeRef.current;
    if (node) {
      node.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (node) {
        node.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const [isSemiDark] = useSemiDark();
  // eslint-disable-next-line no-unused-vars
  const [skin, setSkin] = useSkin();
  const [isDark] = useDarkMode();
  const [mobileMenu, setMobileMenu] = useMobileMenu();

  // --- KEY CHANGE 2: Purana logic hata kar naya filtering logic istemal karein ---
  const accessibleMenus = useMemo(() => {
    if (!user?.role) {
      return []; // Agar user login nahi hai to khali menu
    }
    // Master list ko user ke role ke hisaab se filter karein
    return menuItems
      .filter((item) => item.allowedRoles.includes(user.role))
      .map((item) => {
        // Agar item ke child hain, to unhe bhi filter karein
        if (item.child) {
          return {
            ...item,
            child: item.child.filter((childItem) =>
              childItem.allowedRoles.includes(user.role)
            ),
          };
        }
        return item;
      });
  }, [user]);

  return (
    <div
      className={`${className} fixed  top-0 bg-white dark:bg-slate-800 shadow-lg  h-full   w-[248px]`}
    >
      <div className="logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-9 h-[85px]  px-4 ">
        <Link to="/dashboard">
          <div className="flex items-center space-x-4">
            <div className="logo-icon">
              {!isDark && !isSemiDark ? (
                <img src={MobileLogo} alt="" />
              ) : (
                <img src={MobileLogoWhite} alt="" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Aentora
              </h1>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="cursor-pointer text-slate-900 dark:text-white text-2xl"
        >
          <Icon icon="heroicons:x-mark" />
        </button>
      </div>

      <div
        className={`h-[60px]  absolute top-[80px] nav-shadow z-1 w-full transition-all duration-200 pointer-events-none ${
          scroll ? " opacity-100" : " opacity-0"
        }`}
      ></div>
      <SimpleBar
        className="sidebar-menu px-4 h-[calc(100%-80px)]"
        scrollableNodeProps={{ ref: scrollableNodeRef }}
      >
        {/* --- KEY CHANGE 3: Yahan filtered menu pass karein --- */}
        <Navmenu menus={accessibleMenus} />
      </SimpleBar>
    </div>
  );
};

export default MobileMenu;