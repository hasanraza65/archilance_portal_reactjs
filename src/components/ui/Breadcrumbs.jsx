import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { adminMenuItems, employeeMenuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";
import { useAuth } from "@/context/AuthContext";

const Breadcrumbs = () => {
  const location = useLocation();
  const { user } = useAuth();
  const locationName = location.pathname.replace("/", "");

  const [isHide, setIsHide] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");

  const menuItems =
    user?.role === "employee" ? employeeMenuItems : adminMenuItems;

  useEffect(() => {
    const currentMenuItem = menuItems.find(
      (item) => item.link === locationName
    );

    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === locationName)
    );

    if (currentMenuItem) {
      setIsHide(currentMenuItem.isHide);
      setGroupTitle(""); // Reset group title for top-level items
    } else if (currentChild) {
      setIsHide(currentChild?.isHide || false);
      setGroupTitle(currentChild?.title);
    } else {
      // Reset if no match is found (e.g., on a page not in the menu)
      setIsHide(true);
      setGroupTitle("");
    }
  }, [location, locationName, menuItems]);

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
              {locationName}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;