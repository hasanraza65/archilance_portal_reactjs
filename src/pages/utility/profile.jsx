import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import Card from "@/components/ui/Card";
import Loading from "@/components/Loading";

// Naye axios instance ko import karein
import Cookies from "js-cookie";
import { useQuery } from "@tanstack/react-query";

import DefaultProfileImage from "@/assets/images/users/user-1.jpg";
import UpdatePassword from "./UpdatePassword";
import axiosInstance from "@/store/api/app/axiosInstance";
import { getMediaUrl } from "@/pages/utility/apiHelper";

const PROFILE_API_URL = "/me";

const fetchProfileData = async () => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("No authentication token found.");
  }
  // Yahan 'axios' ke bajaye 'axiosInstance' ka istemal karein
  const response = await axiosInstance.get(PROFILE_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
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
    queryKey: ["profileData"],
    queryFn: fetchProfileData,
  });

  let profilePicSrc = null;

  if (userProfile && userProfile.profile_pic) {
    profilePicSrc = getMediaUrl(userProfile.profile_pic, userProfile.created_at);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loading />
      </div>
    );
  }

  if (isError) {
    // Ab 401 error yahan tak nahi pohnchega, interceptor usay pehle hi handle kar lega.
    // Lekin dusre errors ke liye yeh code zaroori hai.
    console.error("Error fetching profile data (React Query):", error);
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500 p-4 text-center">
        <p className="text-xl font-semibold mb-2">Error Fetching Profile</p>
        <p>{error?.message || "An unknown error occurred."}</p>
        {error?.response?.data?.message && (
          <p>Server: {error.response.data.message}</p>
        )}
      </div>
    );
  }

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  return (
    <div>
      <div className="space-y-5 profile-page">
        {/* ... baaki ka component waisa hi rahega ... */}
        <div className="profiel-wrap px-[35px] pb-10 md:pt-[84px] pt-10 rounded-lg bg-white dark:bg-slate-800 lg:flex lg:space-y-0 space-y-6 justify-between items-end relative z-1">
          <div className="bg-slate-900 dark:bg-slate-700 absolute left-0 top-0 md:h-1/2 h-[150px] w-full z-[-1] rounded-t-lg"></div>
          <div className="profile-box flex-none md:text-start text-center">
            <div className="md:flex items-end md:space-x-6 rtl:space-x-reverse">
              <div className="flex-none">
                <div className="md:h-[186px] md:w-[186px] h-[140px] w-[140px] md:ml-0 md:mr-0 ml-auto mr-auto md:mb-0 mb-4 rounded-full ring-4 ring-slate-100 relative flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                  {profilePicSrc ? (
                    <img
                      src={profilePicSrc}
                      alt={userProfile?.name || "Profile"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DefaultProfileImage;
                      }}
                    />
                  ) : (
                    <Icon
                      icon="heroicons-outline:user"
                      className="h-24 w-24 text-slate-500"
                    />
                  )}
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
                  {userProfile?.name || "User Name"}
                </div>
                <div className="text-sm font-light text-slate-600 dark:text-slate-400">
                  {userProfile?.username || "Username"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-4 col-span-12">
            <Card className="h-full">
              <div className="flex justify-between items-center mb-4">
                <h5 className="card-title text-slate-900 dark:text-white">
                  Info
                </h5>
                <button
                  onClick={handleEditProfile}
                  className="flex items-center text-sm text-slate-600 dark:text-slate-300 hover:text-primary-500 dark:hover:text-primary-500 transition-colors duration-150"
                  aria-label="Edit Profile Information"
                >
                  <Icon
                    icon="heroicons:pencil-square"
                    className="w-4 h-4 mr-1"
                  />
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
                      href={`mailto:${userProfile?.email || ""}`}
                      className="text-base text-slate-600 dark:text-slate-50 break-all"
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
                      href={`tel:${userProfile?.phone || ""}`}
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
                      {userProfile?.address || "N/A"}
                    </div>
                  </div>
                </li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-8 col-span-12">
            <UpdatePassword />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;