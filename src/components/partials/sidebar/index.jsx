// src/components/sidebar/Sidebar.jsx

import React, { useRef, useEffect, useState, useMemo } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
// --- KEY CHANGE: Sirf naya 'menuItems' import hoga ---
import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import { useAuth } from "@/context/AuthContext";

const Sidebar = () => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const { user } = useAuth(); // Auth context se user nikalenge

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

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);
  const [isSemiDark] = useSemiDark();
  const [skin] = useSkin();

  // --- KEY CHANGE: Purana logic hata kar naya filtering logic yahan aayega ---
  // `useMemo` se performance behtar rehti hai, yeh code sirf user change hone par chalega.
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
  }, [user]); // Yeh logic `user` ke change hone par dobara chalega

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800     ${
          collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
        }
      ${menuHover ? "sidebar-hovered" : ""}
      ${
        skin === "bordered"
          ? "border-r border-slate-200 dark:border-slate-700"
          : "shadow-base"
      }
      `}
        onMouseEnter={() => {
          setMenuHover(true);
        }}
        onMouseLeave={() => {
          setMenuHover(false);
        }}
      >
        <SidebarLogo menuHover={menuHover} />
        <div
          className={`h-[60px]  absolute top-[80px] nav-shadow z-1 w-full transition-all duration-200 pointer-events-none ${
            scroll ? " opacity-100" : " opacity-0"
          }`}
        ></div>

        <SimpleBar
          className="sidebar-menu px-4 h-[calc(100%-80px)]"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          {/* --- KEY CHANGE: Yahan filtered menu pass hoga --- */}
          <Navmenu menus={accessibleMenus} />
        </SimpleBar>
      </div>
    </div>
  );
};

export default Sidebar;