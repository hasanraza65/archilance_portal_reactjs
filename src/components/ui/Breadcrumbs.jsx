// src/components/ui/Breadcrumbs.js (Updated & Corrected Code)

import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const location = useLocation();
  // Hum pehle hisse ko nikalenge (e.g., 'projects' from '/projects/15')
  const locationName = location.pathname.split("/")[1];
  const fullLocationName = location.pathname.replace("/", "");


  const [isHide, setIsHide] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");
  const [pageTitle, setPageTitle] = useState(locationName);

  useEffect(() => {
    // Ab hum 'locationName' ('projects') se match karenge
    const currentMenuItem = menuItems.find(
      (item) => item.link === locationName
    );

    // Child items ke liye bhi hum pehle hisse se match karenge
    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === locationName)
    );
    
    let pageTitleFound = false;

    if (currentMenuItem) {
      setIsHide(currentMenuItem.isHide);
      setGroupTitle("");
      setPageTitle(currentMenuItem.title);
      pageTitleFound = true;
    } else if (currentChild) {
      const childItem = currentChild.child.find(c => c.childlink === locationName);
      setIsHide(currentChild?.isHide || false);
      setGroupTitle(currentChild?.title);
      setPageTitle(childItem?.childtitle);
      pageTitleFound = true;
    } 
    
    // Agar koi direct match na mile (jaise /projects/15)
    // to hum "best match" dhoondenge (e.g., "projects")
    if (!pageTitleFound) {
      let bestMatch = null;
      menuItems.forEach((item) => {
        if (fullLocationName.startsWith(item.link)) {
          if (!bestMatch || item.link.length > bestMatch.link.length) {
            bestMatch = item;
          }
        }
      });
      
      if(bestMatch) {
          setIsHide(bestMatch.isHide);
          setGroupTitle("");
          // Title ke liye hum 'Projects' jaisa base title istemal karenge
          setPageTitle(bestMatch.title);
      } else {
          // Agar kuch bhi na mile, to hide kar dein
          setIsHide(true);
          setGroupTitle("");
      }
    }

  }, [location, locationName, fullLocationName]);

  return (
    <>
      {!isHide ? (
        <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
          <ul className="breadcrumbs">
            <li className="text-primary-500">
              <NavLink to="/dashboard" className="text-lg">
                <Icon icon="heroicons-outline:home" />
              </NavLink>
              <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                <Icon icon="heroicons:chevron-right" />
              </span>
            </li>
            {groupTitle && (
              <li className="text-primary-500">
                <button type="button" className="capitalize">
                  {groupTitle}
                </button>
                <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              </li>
            )}
            <li className="capitalize text-slate-500 dark:text-slate-400">
              {/* Ab pageTitle state istemal karenge */}
              {pageTitle.replace("-", " ")}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;