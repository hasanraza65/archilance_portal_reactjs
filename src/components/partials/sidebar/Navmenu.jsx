import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Submenu from "./Submenu";
import { getUserRole, getEmployeeType } from "@/pages/utility/apiHelper";

const Navmenu = ({ menus, closeMobileMenu = () => {} }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [activeMultiMenu, setMultiMenu] = useState(null);
  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  
  const currentUserRole = getUserRole();
  const currentUserEmployeeType = getEmployeeType();

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };
  
  const filterMenuItems = (items) => {
    return items
      .filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) {
          return true;
        }

        const hasRoleAccess = item.allowedRoles.includes(currentUserRole);
        const isManager = currentUserEmployeeType?.toLowerCase() === "manager";
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
  }, [location, menus]);

  return (
    <>
      <ul>
        {filteredMenus.map((item, i) => (
          <li
            key={i}
            className={`single-sidebar-menu 
              ${item.child ? "item-has-children" : ""}
              ${activeSubmenu === i ? "open" : ""}
              ${locationName === item.link ? "menu-item-active" : ""}`}
          >
            {!item.child && !item.isHeadr && (
              <NavLink className="menu-link" to={item.link} onClick={closeMobileMenu}>
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
                  activeSubmenu === i ? "parent_active not-collapsed" : "collapsed"
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
              closeMobileMenu={closeMobileMenu}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export default Navmenu;