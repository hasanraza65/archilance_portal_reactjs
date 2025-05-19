import React, { useState, useEffect } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { MenuItem } from "@headlessui/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logOut } from "@/store/api/auth/authSlice";
import Cookies from "js-cookie";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";

// Import default profile image
import UserAvatar from "@/assets/images/all-img/user.png";

// Constants for API URLs
const API_DOMAIN_FOR_ASSETS = import.meta.env?.VITE_API_DOMAIN || "https://demo.aentora.com/backend/public/storage";
const API_BASE_URL_FOR_API_CALLS = import.meta.env?.VITE_API_URL || window.env?.API_URL || "https://demo.aentora.com/backend/public";
const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/api/me`;

// Function to fetch profile data
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
  
  console.log("Fetched Profile Data:", response.data);
  return response.data;
};

const Profile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [profilePicSrc, setProfilePicSrc] = useState(UserAvatar);

  // Fetch profile data using React Query
  const {
    data: userProfile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profileData"],
    queryFn: fetchProfileData,
    // Don't refetch on window focus to avoid unnecessary API calls
    refetchOnWindowFocus: false,
    // Handle errors gracefully
    onError: (error) => {
      console.error("Error fetching profile data:", error);
    }
  });

  // Process and set profile image when user data is loaded
  useEffect(() => {
    if (userProfile && userProfile.profile_pic) {
      const picPath = String(userProfile.profile_pic);
      let imageUrl;
      
      if (picPath.startsWith('http://') || picPath.startsWith('https://')) {
        imageUrl = picPath; // Use full URL if provided
      } else {
        // Construct full URL from domain and relative path
        const cleanPicPath = picPath.replace(/^\//, '');
        imageUrl = `${API_DOMAIN_FOR_ASSETS}/${cleanPicPath}`;
      }
      
      console.log("Using profile image:", imageUrl);
      setProfilePicSrc(imageUrl);
    }
  }, [userProfile]);

  const handleLogout = () => {
    // Clear user data from cookies
    try {
      Cookies.remove("user");
      Cookies.remove("token");
      
      // Dispatch logout action to Redux
      dispatch(logOut());
      
      // Redirect to login page after logout
      navigate("/login");
      
      console.log("Logout successful");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const profileLabel = () => {
    return (
      <div className="flex items-center">
        <div className="flex-1 ltr:mr-[10px] rtl:ml-[10px]">
          <div className="lg:h-8 lg:w-8 h-7 w-7 rounded-full">
            <img
              src={profilePicSrc}
              alt="User Profile"
              className="block w-full h-full object-cover rounded-full"
              onError={(e) => {
                // Fallback to default if image loading fails
                console.error("Error loading image:", e.target.src);
                e.target.onerror = null; // Prevent infinite loops
                e.target.src = UserAvatar;
              }}
            />
          </div>
        </div>
        <div className="flex-none text-slate-600 dark:text-white text-sm font-normal items-center lg:flex hidden overflow-hidden text-ellipsis whitespace-nowrap">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap w-[85px] block text-lg font-semibold text-black dark:text-white">
            {isLoading ? "Loading..." : 
              userProfile?.name || 
              userProfile?.username || 
              userProfile?.login || 
              "User"}
          </span>

          <span className="text-base inline-block ltr:ml-[10px] rtl:mr-[10px]">
            <Icon icon="heroicons-outline:chevron-down"></Icon>
          </span>
        </div>
      </div>
    );
  };

  const ProfileMenu = [
    {
      label: "Profile",
      icon: "heroicons-outline:user",
      action: () => {
        navigate("/profile");
      },
    },
    {
      label: "Chat",
      icon: "heroicons-outline:chat",
      action: () => {
        navigate("/chat");
      },
    },
    {
      label: "Email",
      icon: "heroicons-outline:mail",
      action: () => {
        navigate("/email");
      },
    },
    {
      label: "Todo",
      icon: "heroicons-outline:clipboard-check",
      action: () => {
        navigate("/todo");
      },
    },
    {
      label: "Settings",
      icon: "heroicons-outline:cog",
      action: () => {
        navigate("/settings");
      },
    },
    {
      label: "Price",
      icon: "heroicons-outline:credit-card",
      action: () => {
        navigate("/pricing");
      },
    },
    {
      label: "Faq",
      icon: "heroicons-outline:information-circle",
      action: () => {
        navigate("/faq");
      },
    },
    {
      label: "Logout",
      icon: "heroicons-outline:login",
      action: () => {
        handleLogout();
      },
    },
  ];

  return (
    <Dropdown label={profileLabel()} classMenuItems="w-[180px] top-[58px]">
      {ProfileMenu.map((item, index) => (
        <MenuItem key={index}>
          {({ isActive }) => (
            <div
              onClick={() => item.action()}
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
              <div className={`block cursor-pointer px-4 py-2`}>
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