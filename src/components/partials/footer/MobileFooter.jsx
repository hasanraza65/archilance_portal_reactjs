import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom"; // <-- Import useNavigate
import Icon from "@/components/ui/Icon";
import Cookies from "js-cookie";
import axios from "axios";
import { useAuth } from "@/context/AuthContext"; // <-- 1. Import useAuth

import FooterAvatar from "@/assets/images/users/user-1.jpg";

// API Configuration
const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;
const API_DOMAIN_FOR_ASSETS =
  import.meta.env.VITE_ASSETS_DOMAIN || `${BACKEND_BASE_URL}/storage`;
const API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;
const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/me`;

const MobileFooter = () => {
  // State for profile picture - default to static image
  const [profilePicSrc, setProfilePicSrc] = useState(FooterAvatar);

  // --- 2. Get the logout function from the Auth context ---
  const { logout } = useAuth();
  const navigate = useNavigate(); // Optional but good practice

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
          const picPath = String(response.data.profile_pic);
          let imageUrl;

          if (picPath.startsWith("http://") || picPath.startsWith("https://")) {
            imageUrl = picPath;
          } else {
            const cleanPicPath = picPath.replace(/^\//, "");
            imageUrl = `${API_DOMAIN_FOR_ASSETS}/${cleanPicPath}`;
          }

          setProfilePicSrc(imageUrl);
        }
      } catch (error) {
        console.error("MobileFooter: Error fetching profile picture:", error);
      }
    };

    fetchUserPic();
  }, []);

  // --- 3. Create a handler function for logout ---
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="bg-white bg-no-repeat custom-dropshadow footer-bg dark:bg-slate-700 flex justify-around items-center backdrop-filter backdrop-blur-[40px] fixed left-0 w-full z-[9999] bottom-0 py-[12px] px-4">
      {/* Messages Link (No Change) */}
      <NavLink to="chat">
        {({ isActive }) => (
          <div>
            <span
              className={` relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1
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
          </div>
        )}
      </NavLink>

      {/* Profile Picture Link (No Change) */}
      <NavLink
        to="/profile" // Changed from "#" to "/profile" for better UX
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
                console.warn(
                  "MobileFooter: Error loading profile image, falling back to default."
                );
                e.target.onerror = null;
                e.target.src = FooterAvatar;
              }}
            />
          </div>
        )}
      </NavLink>

      {/* --- 4. Replaced Notifications NavLink with a Logout button --- */}
      <div
        onClick={handleLogout}
        className="flex flex-col items-center cursor-pointer"
      >
        <span className="relative cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center mb-1 dark:text-white text-slate-900">
          {/* 5. Updated Icon */}
          <Icon icon="heroicons-outline:login" />
        </span>
        <span className="block text-[11px] text-slate-600 dark:text-slate-300">
          {/* 5. Updated Text */}
          Logout
        </span>
      </div>
    </div>
  );
};

export default MobileFooter;
