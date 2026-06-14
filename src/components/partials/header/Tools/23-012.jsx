import React, { useState, useEffect, useMemo } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getMediaUrl } from "@/pages/utility/apiHelper";

const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_BASE_URL || DEFAULT_BACKEND_URL;
const API_DOMAIN_FOR_ASSETS =
  import.meta.env.VITE_ASSETS_DOMAIN || `${BACKEND_BASE_URL}/storage`;
const API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;
const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/me`;

// ====================================================================
// SECTION 1: API INTEGRATION FOR NOTIFICATIONS
// ====================================================================

// 1. Define the URL for your new notifications API
const NOTIFICATIONS_API_URL = `${API_BASE_URL_FOR_API_CALLS}/my-notifications`;

// 2. Create a new async function to fetch notifications
const fetchNotificationsData = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No authentication token found for notifications.");
  }
  const response = await axios.get(NOTIFICATIONS_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

// ====================================================================

const fetchProfileData = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No authentication token found.");
  }
  const response = await axios.get(PROFILE_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  return response.data;
};

const Profile = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [profilePicSrc, setProfilePicSrc] = useState(null);

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ["profileData"],
    queryFn: fetchProfileData,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error("Error fetching profile data:", error);
    },
  });

  // ====================================================================
  // SECTION 2: FETCHING NOTIFICATIONS WITH REACT QUERY
  // ====================================================================

  // 3. Use react-query to call your new notifications fetcher function.
  // We use `enabled: !!userProfile` to ensure this API is only called *after*
  // the profile API call has succeeded, confirming the user is authenticated.
  const { data: notifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notificationsData"],
    queryFn: fetchNotificationsData,
    enabled: !!userProfile, // This is important! Only fetch notifications if profile fetch was successful.
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error("Error fetching notifications data:", error);
    },
  });

  // 4. (Optional) Log the fetched notifications to the console to verify they are being received.
  useEffect(() => {
    if (notifications) {
      // You can now use this 'notifications' data.
      // For example, you could store it in a global state (Redux, Zustand)
      // or pass it down to other components to display a notification count.
    }
  }, [notifications]);

  // ====================================================================

  useEffect(() => {
    if (userProfile && userProfile.profile_pic) {
      setProfilePicSrc(getMediaUrl(userProfile.profile_pic, userProfile.created_at));
    } else {
      setProfilePicSrc(null);
    }
  }, [userProfile]);

  const handleLogout = () => {
    logout();
  };

  const profileLabel = () => (
    <div className="flex items-center">
      <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
        <div className="flex justify-center items-center lg:h-8 lg:w-8 h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700">
          {profilePicSrc ? (
            <img
              src={profilePicSrc}
              alt="User Profile"
              className="block w-full h-full object-cover rounded-full"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = "none";
              }}
            />
          ) : (
            <Icon icon="heroicons-outline:user" className="text-slate-500" />
          )}
        </div>
      </div>
      <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block text-lg font-semibold text-black dark:text-white">
          {isLoading ? "Loading..." : userProfile?.name || "User"}
        </span>
        <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
          <Icon icon="heroicons-outline:chevron-down" />
        </span>
      </div>
    </div>
  );

  const ProfileMenu = useMemo(() => {
    const baseMenu = [
      {
        label: "Profile",
        icon: "heroicons-outline:user",
        action: () => navigate("/profile"),
      },
    ];

    const forbiddenRoles = ["customer", "member"];
    if (user && !forbiddenRoles.includes(user.role)) {
      baseMenu.push({
        label: "Chat",
        icon: "heroicons-outline:chat",
        action: () => navigate("/chat"),
      });
    }

    baseMenu.push({
      label: "Logout",
      icon: "heroicons-outline:login",
      action: handleLogout,
    });

    return baseMenu;
  }, [user, navigate]);

  return (
    <Dropdown label={profileLabel()} classMenuItems="w-[180px] top-[58px]">
      {ProfileMenu.map((item, index) => (
        <MenuItem key={index}>
          {({ isActive }) => (
            <div
              onClick={item.action}
              className={`${
                isActive
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300 dark:bg-opacity-50"
                  : "text-slate-600 dark:text-slate-300"
              } block ${
                item.hasDivider
                  ? "border-t border-slate-100 dark:border-slate-700"
                  : ""
              }`}
            >
              <div className="block cursor-pointer px-4 py-2">
                <div className="flex items-center">
                  <span className="block text-xl ltr:mr-3 rtl:ml-3">
                    <Icon icon={item.icon} />
                  </span>
                  <span className="block text-sm">{item.label}</span>
                </div>
              </div>
            </div>
          )}
        </MenuItem>
      ))}
    </Dropdown>
  );
};

export default Profile;
