import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Cookies from "js-cookie";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { getMediaUrl } from "@/pages/utility/apiHelper";

import FooterAvatar from "@/assets/images/users/user-1.jpg";

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;
const API_DOMAIN_FOR_ASSETS =
  import.meta.env.VITE_ASSETS_DOMAIN || `${BACKEND_BASE_URL}/storage`;
const API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;
const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/me`;

const MobileFooter = () => {
  const [profilePicSrc, setProfilePicSrc] = useState(FooterAvatar);

  const { logout } = useAuth(); 
  const navigate = useNavigate(); 
  const notificationCount = 2; 

 useEffect(() => {
    const fetchUserPic = async () => {
      const token = Cookies.get("token");
      if (!token) {
        console.warn(
          "MobileFooter: No authentication token found, using default avatar."
        );
        return;
      }

      try {
        const response = await axios.get(PROFILE_API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.data && response.data.profile_pic) {
          setProfilePicSrc(getMediaUrl(response.data.profile_pic) || FooterAvatar);
        }
      } catch (error) {
        console.error("MobileFooter: Error fetching profile picture:", error);
      }
    };

    fetchUserPic();
  }, []);


  const handleLogout = () => {
      logout();
  };

  // Common Border Classes
  const borderClass = "border-r border-slate-200 dark:border-slate-600";
  const itemWrapperClass = "flex flex-col items-center justify-center h-full w-full px-2";

  return (
    <div className="bg-white bg-no-repeat custom-dropshadow footer-bg dark:bg-slate-700 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-[9999] bottom-0 py-[12px] px-4">
      
      <div className={`flex-1 ${borderClass}`}>
          <div onClick={handleLogout} className={`cursor-pointer ${itemWrapperClass}`}>
            <span className="relative rounded-full text-[20px] mb-1 dark:text-white text-slate-900">
              <Icon icon="heroicons-outline:logout" />
            </span>
            <span className="block text-[11px] text-slate-600 dark:text-slate-300">
              Logout
            </span>
          </div>
      </div>

      
      <div className={`flex-1 ${borderClass}`}>
          <NavLink to="chat" className={itemWrapperClass}>
            {({ isActive }) => (
              <>
                <span
                  className={` relative cursor-pointer rounded-full text-[20px] mb-1
              ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
              `}
                >
                  <Icon icon="heroicons-outline:mail" />
                </span>
                <span
                  className={` block text-[11px]
              ${
                isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"
              }
              `}
                >
                  Messages
                </span>
              </>
            )}
          </NavLink>
      </div>

      <div className={`flex-1 ${borderClass}`}>
          <NavLink to="notifications" className={itemWrapperClass}>
            {({ isActive }) => (
              <>
                <span
                  className={` relative cursor-pointer rounded-full text-[20px] mb-1
              ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
              `}
                >
                  <Icon icon="heroicons-outline:bell" />
                  
                  {notificationCount > 0 && (
                      <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[8px] font-semibold flex items-center justify-center rounded-full text-white z-99 -mt-1 -mr-1">
                          {notificationCount}
                      </span>
                  )}
                </span>
                <span
                  className={` block text-[11px]
              ${
                isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"
              }
              `}
                >
                  Alerts
                </span>
              </>
            )}
          </NavLink>
      </div>
      
      <div className="flex-1">
          <NavLink to="/profile" className={itemWrapperClass}>
            {({ isActive }) => (
              <div className="text-center">
                <div className="h-[30px] w-[30px] rounded-full relative mx-auto mb-1">
                  <img
                    src={profilePicSrc}
                    alt="User Profile"
                    className={` w-full h-full rounded-full object-cover
                ${
                  isActive
                    ? "border-2 border-primary-500"
                    : "border-2 border-slate-100 dark:border-slate-600"
                }
                    `}
                    onError={(e) => {
                      console.warn(
                        "MobileFooter: Error loading profile image, falling back to default."
                      );
                      e.target.onerror = null;
                      e.target.src = FooterAvatar;
                    }}
                  />
                </div>
                <span
                  className={` block text-[11px]
              ${
                isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"
              }
              `}
                >
                  Profile
                </span>
              </div>
            )}
          </NavLink>
      </div>
    </div>
  );
};

export default MobileFooter;