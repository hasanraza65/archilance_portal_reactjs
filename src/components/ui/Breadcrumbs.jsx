// src/components/ui/Breadcrumbs.js (Final Version)

import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const locationParts = locationName.split("/");

  const [isHide, setIsHide] = useState(true);
  const [groupTitle, setGroupTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [parentPage, setParentPage] = useState(null);

  useEffect(() => {
    let breadcrumbFound = false;
    let baseRoute = locationParts[0]; // e.g., 'projects' or 'task'

    // --- PARENT MAPPING: Dynamic pages ko unke parent se jorein ---
    const parentMap = {
      task: "projects",
      "project-brief": "projects",
      // Aap yahan aur bhi rules add kar sakte hain
      // e.g., 'edit-employee': 'employees'
    };

    if (parentMap[baseRoute]) {
      baseRoute = parentMap[baseRoute];
    }
    // ----------------------------------------------------------------

    // 1. Child items mein dhoondhein (e.g., 'dashboard')
    const parentWithChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === baseRoute)
    );
    if (parentWithChild) {
      const childItem = parentWithChild.child.find(c => c.childlink === baseRoute);
      setIsHide(parentWithChild.isHide || false);
      setGroupTitle(parentWithChild.title);
      setPageTitle(childItem.childtitle);
      setParentPage(null); // No parent page for top-level children
      breadcrumbFound = true;
    }

    // 2. Agar child mein na mile, to main menu items mein dhoondhein
    if (!breadcrumbFound) {
      const mainMenuItem = menuItems.find(item => item.link === baseRoute);
      if (mainMenuItem) {
        setIsHide(mainMenuItem.isHide || false);
        setGroupTitle("");
        
        // Agar yeh ek dynamic page hai (e.g., /task/16), to title alag hoga
        if (locationParts.length > 1) {
            setPageTitle(`${locationParts[0].replace('-', ' ')} Details`); // e.g., "Task Details"
            setParentPage({ title: mainMenuItem.title, link: `/${mainMenuItem.link}` });
        } else {
            setPageTitle(mainMenuItem.title);
            setParentPage(null);
        }
        breadcrumbFound = true;
      }
    }

    // Agar kuch bhi na mile, to hide kar dein
    if (!breadcrumbFound) {
      setIsHide(true);
    }

  }, [location, locationParts]);

  return (
    <>
      {!isHide ? (
        <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
          <ul className="breadcrumbs">
            {/* Home Icon */}
            <li className="text-primary-500">
              <NavLink to="/dashboard" className="text-lg">
                <Icon icon="heroicons-outline:home" />
              </NavLink>
              <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                <Icon icon="heroicons:chevron-right" />
              </span>
            </li>
            
            {/* Group Title (e.g., Menu) */}
            {groupTitle && groupTitle.toLowerCase() !== 'menu' && (
              <li className="text-primary-500">
                <button type="button" className="capitalize">{groupTitle}</button>
                <span className="breadcrumbs-icon rtl:transform rtl:rotate-180"><Icon icon="heroicons:chevron-right" /></span>
              </li>
            )}

            {/* Parent Page (e.g., Projects) for dynamic routes */}
            {parentPage && (
                 <li className="text-primary-500">
                    <NavLink to={parentPage.link} className="capitalize">
                        {parentPage.title}
                    </NavLink>
                    <span className="breadcrumbs-icon rtl:transform rtl:rotate-180"><Icon icon="heroicons:chevron-right" /></span>
                </li>
            )}
            
            {/* Current Page */}
            <li className="capitalize text-slate-500 dark:text-slate-400">
              {pageTitle.replace("-", " ")}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;