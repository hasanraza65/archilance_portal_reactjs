import React, { useRef, useEffect, useState, useMemo } from "react";
import Navmenu from "./Navmenu";
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

import MobileLogo from "@/assets/images/logo-img/logo.png";
import MobileLogoWhite from "@/assets/images/logo-img/logo.png";

const MobileMenu = ({ className, mobileMenu, setMobileMenu }) => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const { user } = useAuth();
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();
  const [isDark] = useDarkMode();

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
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

  const accessibleMenus = useMemo(() => {
    if (!user?.role) {
      return [];
    }
    return menuItems
      .filter((item) => item.allowedRoles.includes(user.role))
      .map((item) => {
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
      className={`${className} fixed top-0 bg-white dark:bg-slate-800 shadow-lg h-full w-[248px]`}
    >
      <div className="logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-10 h-[85px] px-4">
        <Link to="/dashboard">
          <div className="flex items-center space-x-4">
            <div className="logo-icon">
              {!isDark && !isSemiDark ? (
                <img src={MobileLogo} alt="Logo" />
              ) : (
                <img src={MobileLogoWhite} alt="Logo" />
              )}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Archilance LLC
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
        className={`h-[60px] absolute top-[80px] nav-shadow z-10 w-full transition-all duration-200 pointer-events-none ${
          scroll ? "opacity-100" : "opacity-0"
        }`}
      ></div>
      <SimpleBar
        className="sidebar-menu px-4 h-[calc(100%-80px)]"
        scrollableNodeProps={{ ref: scrollableNodeRef }}
      >
        <Navmenu menus={accessibleMenus} />
      </SimpleBar>
    </div>
  );
};

export default MobileMenu;