import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Cookies from "js-cookie";
import axios from "axios";

import FooterAvatar from "@/assets/images/users/user-1.jpg";

// API Configuration
const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;
const API_DOMAIN_FOR_ASSETS = import.meta.env.VITE_ASSETS_DOMAIN || `${BACKEND_BASE_URL}/storage`;
const API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;
const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/me`;

const MobileFooter = () => {
  // State for profile picture - default to static image
  const [profilePicSrc, setProfilePicSrc] = useState(FooterAvatar);

  useEffect(() => {
    const fetchUserPic = async () => {
      const token = Cookies.get("token");
      if (!token) {
        console.warn("MobileFooter: No authentication token found, using default avatar.");
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
          const picPath = String(response.data.profile_pic);
          let imageUrl;

          if (picPath.startsWith('http://') || picPath.startsWith('https://')) {
            imageUrl = picPath;
          } else {
            const cleanPicPath = picPath.replace(/^\//, '');
            imageUrl = `${API_DOMAIN_FOR_ASSETS}/${cleanPicPath}`;
          }
          
         
          setProfilePicSrc(imageUrl);
        } else {
          // console.log("MobileFooter: No profile_pic in API response, using default avatar.");
        }
      } catch (error) {
        console.error("MobileFooter: Error fetching profile picture:", error);
      }
    };

    fetchUserPic();
  }, []);

  return (
    <div className="bg-white bg-no-repeat custom-dropshadow footer-bg dark:bg-slate-700 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-[9999] bottom-0 py-[12px] px-4">
      <NavLink to="#">
        {({ isActive }) => (
          <div>
            <span
              className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
         ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
          `}
            >
              <Icon icon="heroicons-outline:mail" />
              <span className="absolute right-[5px] lg:top-0 -top-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-99">
                10
              </span>
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
          </div>
        )}
      </NavLink>
      
      <NavLink
        to="#"
        className="relative bg-white bg-no-repeat backdrop-filter backdrop-blur-[40px] rounded-full footer-bg dark:bg-slate-700 h-[65px] w-[65px] z-[-1] -mt-[40px] flex justify-center items-center"
      >
        {({ isActive }) => (
          <div className="h-[50px] w-[50px] rounded-full relative left-[0px] top-[0px] custom-dropshadow">
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
                console.warn("MobileFooter: Error loading profile image, falling back to default.");
                e.target.onerror = null;
                e.target.src = FooterAvatar;
              }}
            />
          </div>
        )}
      </NavLink>
      
      <NavLink to="#">
        {({ isActive }) => (
          <div>
            <span
              className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
      ${isActive ? "text-primary-500" : "dark:text-white text-slate-900"}
          `}
            >
              <Icon icon="heroicons-outline:bell" />
              <span className="absolute right-[17px] lg:top-0 -top-2 h-4 w-4 bg-red-500 text-[8px] font-semibold flex flex-col items-center justify-center rounded-full text-white z-99">
                2
              </span>
            </span>
            <span
              className={` block text-[11px]
         ${isActive ? "text-primary-500" : "text-slate-600 dark:text-slate-300"}
        `}
            >
              Notifications
            </span>
          </div>
        )}
      </NavLink>
    </div>
  );
};

export default MobileFooter;