// src/components/sidebar/Navmenu.jsx

import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";

// Helper functions ko import karein
import { getUserRole, getEmployeeType } from "@/pages/utility/apiHelper";

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const dispatch = useDispatch();

  const currentUserRole = getUserRole();
  const currentUserEmployeeType = getEmployeeType();

  // DEBUGGING: Console mein check karein ke cookie se kya value aa rahi hai
  useEffect(() => {
    console.log("Current User Role:", currentUserRole);
    console.log("Current Employee Type:", currentUserEmployeeType);
  }, [currentUserRole, currentUserEmployeeType]);


  const filterMenuItems = (items) => {
    return items
      .filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
          return true;
        }

        const hasRoleAccess = item.allowedRoles.includes(currentUserRole);
        
        // --- YEH LINE UPDATE HUI HAI ---
        // Pehle check karein ke currentUserEmployeeType null ya undefined to nahi
        const isManager = currentUserEmployeeType?.toLowerCase() === "manager";
        
        // --- AUR YEH LINE UPDATE HUI HAI ---
        // 'Manager' ko bhi lowercase mein check karein
        const managerHasAccess = isManager && item.allowedRoles.map(role => role.toLowerCase()).includes("manager");

        return hasRoleAccess || managerHasAccess;
      })
      .map((item) => {
        if (item.child) {
          const filteredChildren = filterMenuItems(item.child);
          if (filteredChildren.length > 0) {
            return { ...item, child: filteredChildren };
          }
          return null;
        }
        return item;
      })
      .filter(Boolean);
  };

  const filteredMenus = filterMenuItems(menus);

  const toggleMultiMenu = (j) => {
    if (activeMultiMenu === j) {
      setMultiMenu(null);
    } else {
      setMultiMenu(j);
    }
  };

  const isLocationMatch = (targetLocation) => {
    return (
      targetLocation &&
      (locationName === targetLocation ||
        locationName.startsWith(`${targetLocation}/`))
    );
  };

  useEffect(() => {
    let submenuIndex = null;
    let multiMenuIndex = null;
    filteredMenus.forEach((item, i) => {
      if (isLocationMatch(item.link)) {
        submenuIndex = i;
      }

      if (item.child) {
        item.child.forEach((childItem, j) => {
          if (isLocationMatch(childItem.childlink)) {
            submenuIndex = i;
          }

          if (childItem.multi_menu) {
            childItem.multi_menu.forEach((nestedItem) => {
              if (isLocationMatch(nestedItem.multiLink)) {
                submenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });

    setActiveSubmenu(submenuIndex);
    setMultiMenu(multiMenuIndex);
    if (mobileMenu) {
      setMobileMenu(false);
    }
  }, [location, filteredMenus]);

  return (
    <>
      <ul>
        {filteredMenus.map((item, i) => (
          <li
            key={i}
            className={` single-sidebar-menu 
              ${item.child ? "item-has-children" : ""}
              ${activeSubmenu === i ? "open" : ""}
              ${locationName === item.link ? "menu-item-active" : ""}`}
          >
            {!item.child && !item.isHeadr && (
              <NavLink className="menu-link" to={item.link}>
                <span className="menu-icon grow-0">
                  <Icon icon={item.icon} />
                </span>
                <div className="text-box grow">{item.title}</div>
                {item.badge && <span className="menu-badge">{item.badge}</span>}
              </NavLink>
            )}
            {item.isHeadr && !item.child && (
              <div className="menulabel">{item.title}</div>
            )}
            {item.child && (
              <div
                className={`menu-link ${
                  activeSubmenu === i
                    ? "parent_active not-collapsed"
                    : "collapsed"
                }`}
                onClick={() => toggleSubmenu(i)}
              >
                <div className="flex-1 flex items-start">
                  <span className="menu-icon">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box">{item.title}</div>
                </div>
                <div className="flex-0">
                  <div
                    className={`menu-arrow transform transition-all duration-300 ${
                      activeSubmenu === i ? " rotate-90" : ""
                    }`}
                  >
                    <Icon icon="heroicons-outline:chevron-right" />
                  </div>
                </div>
              </div>
            )}

            <Submenu
              activeSubmenu={activeSubmenu}
              item={item}
              i={i}
              toggleMultiMenu={toggleMultiMenu}
              activeMultiMenu={activeMultiMenu}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Navmenu;