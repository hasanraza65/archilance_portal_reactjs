import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import BasicArea from "../chart/appex-chart/BasicArea";
import Loading from "@/components/Loading";

import axios from "axios";
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";

import DefaultProfileImage from "@/assets/images/users/user-1.jpg";

const API_DOMAIN_FOR_ASSETS = import.meta.env?.VITE_API_DOMAIN || "https://demo.aentora.com/backend";
const API_BASE_URL_FOR_API_CALLS = import.meta.env?.VITE_API_URL || window.env?.API_URL || "https://demo.aentora.com/backend/public";

const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/api/me`;

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

  const {
    data: userProfile,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["profileData"], // This query is refetched when invalidated
    queryFn: fetchProfileData,
  });

  let profilePicSrc = DefaultProfileImage;

  if (userProfile) { // Check if profile data is available
    if (userProfile.profile_pic) { // Check if a profile picture path exists
      const picPath = String(userProfile.profile_pic);
      if (picPath.startsWith('http://') || picPath.startsWith('https://')) {
        profilePicSrc = picPath; // Use full URL if provided
      } else {
        // Construct full URL from domain and relative path
        const cleanPicPath = picPath.replace(/^\//, '');
        profilePicSrc = `${API_DOMAIN_FOR_ASSETS}/${cleanPicPath}`;
      }
      console.log("Constructed profilePicSrc:", profilePicSrc);
    } else {
      // No profile_pic in API response, DefaultProfileImage (already set) will be used.
      console.log("profile_pic is null or empty in API response.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500">
        <p>Error fetching profile data.</p>
        <p>{error?.message || "An unknown error occurred."}</p>
        {error?.response?.data?.message && <p>Server: {error.response.data.message}</p>}
      </div>
    );
  }

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  return (
    <div>
      <div className="space-y-5 profile-page">
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-1">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative">
                  <img
                    src={profilePicSrc} // Dynamically uses default or user's image
                    alt={userProfile?.name || "Profile"}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Fallback to default if the loaded src (even custom one) fails
                      console.error("Error loading image:", e.target.src, "Falling back to default.");
                      e.target.onerror = null; // prevent infinite loop
                      e.target.src = DefaultProfileImage;
                    }}
                  />
                  <Link
                    to="/profile/edit"
                    className="absolute right-2 h-8 w-8 bg-slate-50 text-slate-600 rounded-full shadow-xs flex flex-col items-center justify-center md:top-[140px] top-[100px]"
                    aria-label="Edit profile picture"
                  >
                    <Icon icon="heroicons:pencil-square" />
                  </Link>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-medium text-slate-900 dark:text-slate-200 mb-[3px]">
                  {userProfile?.name || "N/A"}
                </div>
                <div className="text-sm font-light text-slate-600 dark:text-slate-400">
                  {userProfile?.username || "User"}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-info-500 md:flex md:text-start text-center flex-1 max-w-[516px] md:space-y-0 space-y-4">
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                $32,400
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Total Balance
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                200
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Board Card
              </div>
            </div>
            <div className="flex-1">
              <div className="text-base text-slate-900 dark:text-slate-300 font-medium mb-1">
                3200
              </div>
              <div className="text-sm text-slate-600 font-light dark:text-slate-300">
                Calender Events
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-4 col-span-12">
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h5 className="card-title text-slate-900 dark:text-white">Info</h5>
                <button
                  onClick={handleEditProfile}
                  className="flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-500 transition-colors duration-150"
                  aria-label="Edit Profile Information"
                >
                  <Icon icon="heroicons:pencil-square" className="w-4 h-4 mr-1" />
                  Edit
                </button>
              </div>
              <ul className="list space-y-8">
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:envelope" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      EMAIL
                    </div>
                    <a
                      href={`mailto:${userProfile?.email || ''}`}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {userProfile?.email || "N/A"}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:phone-arrow-up-right" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      PHONE
                    </div>
                    <a
                      href={`tel:${userProfile?.phone || ''}`}
                      className="text-base text-slate-600 dark:text-slate-50"
                    >
                      {userProfile?.phone || "N/A"}
                    </a>
                  </div>
                </li>
                <li className="flex space-x-3 rtl:space-x-reverse">
                  <div className="flex-none text-2xl text-slate-600 dark:text-slate-300">
                    <Icon icon="heroicons:map" />
                  </div>
                  <div className="flex-1">
                    <div className="uppercase text-xs text-slate-500 dark:text-slate-300 mb-1 leading-[12px]">
                      LOCATION
                    </div>
                    <div className="text-base text-slate-600 dark:text-slate-50">
                      {userProfile?.address || "Home# 320/N, Road# 71/B, Mohakhali, Dhaka-1207, Bangladesh"}
                    </div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-8 col-span-12">
            <Card title="User Overview">
              <BasicArea height={190} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;