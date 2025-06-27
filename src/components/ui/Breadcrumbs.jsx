import React, { useState, useEffect } from "react";
import { useLocation, NavLink } from "react-router-dom";
// --- KEY CHANGE 1: Naya 'menuItems' import karein ---
import { menuItems } from "@/constant/data";
import Icon from "@/components/ui/Icon";
// Note: useAuth ki ab yahan zaroorat nahi hai, lekin agar aap future mein istemal karna chahein to rakh sakte hain.
// import { useAuth } from "@/context/AuthContext";

const Breadcrumbs = () => {
  const location = useLocation();
  const locationName = location.pathname.replace("/", "");

  const [isHide, setIsHide] = useState(null);
  const [groupTitle, setGroupTitle] = useState("");

  // --- KEY CHANGE 2: Is line ki ab zaroorat nahi, isse hata dein ---
  // const menuItems = user?.role === "employee" ? employeeMenuItems : adminMenuItems;
  // Hum ab seedha master 'menuItems' list par kaam karenge.

  useEffect(() => {
    // Top-level item dhoondein (jaise Projects, Chat)
    const currentMenuItem = menuItems.find(
      (item) => item.link === locationName
    );

    // Child-level item dhoondein (jaise Analytics Dashboard)
    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === locationName)
    );

    if (currentMenuItem) {
      // Agar top-level item mil gaya
      setIsHide(currentMenuItem.isHide);
      setGroupTitle(""); // Top-level item ka koi group title nahi hota
    } else if (currentChild) {
      // Agar child item mil gaya
      setIsHide(currentChild?.isHide || false);
      setGroupTitle(currentChild?.title); // Parent ka title group title ban jayega
    } else {
      // Agar kuch nahi mila, to breadcrumb ko hide kar dein
      setIsHide(true);
      setGroupTitle("");
    }
  }, [location, locationName]); // Dependency array se 'menuItems' hata diya kyunki woh ab static hai

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
              {locationName.replace("-", " ")}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;