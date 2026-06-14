// src/pages/profile/EditProfile.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Card from "@/components/ui/Card";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Loading from "@/components/Loading";
import Icon from "@/components/ui/Icon";
import DefaultProfileImage from "@/assets/images/users/user-1.jpg";
import { getMediaUrl } from "@/pages/utility/apiHelper";

const editProfileSchema = yup.object({
  name: yup.string().required("Name is required"),
  username: yup.string().required("Username is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().nullable().matches(/^[0-9+()-\s]*$/, {
    message: "Invalid phone number format",
    excludeEmptyString: true
  }),
  profile_pic: yup
    .mixed()
    .nullable()
    .test("fileSize", "The file is too large (max 2MB)", (value) => {
      if (!value || !value.length) return true;
      return value[0].size <= 2000000;
    })
    .test("fileType", "Unsupported file format (PNG, JPG, GIF only)", (value) => {
      if (!value || !value.length) return true;
      return ["image/jpeg", "image/png", "image/gif"].includes(value[0].type);
    }),
}).required();

const VITE_BACKEND_BASE_URL_FROM_ENV = import.meta.env.VITE_BACKEND_BASE_URL;

let BACKEND_BASE_URL = "";
let API_BASE_URL_FOR_API_CALLS = "";
let PROFILE_API_URL = "";
let UPDATE_PROFILE_DATA_API_URL = "";
let UPDATE_PROFILE_PIC_API_URL = "";
let IS_CONFIG_VALID = true;

if (!VITE_BACKEND_BASE_URL_FROM_ENV) {
  console.error(
    "CRITICAL CONFIGURATION ERROR (EditProfile): VITE_BACKEND_BASE_URL is not defined in your .env file. "
  );
  IS_CONFIG_VALID = false;
} else {
  BACKEND_BASE_URL = VITE_BACKEND_BASE_URL_FROM_ENV;
  API_BASE_URL_FOR_API_CALLS = `${BACKEND_BASE_URL}/api`;

  PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/me`;
  UPDATE_PROFILE_DATA_API_URL = `${API_BASE_URL_FOR_API_CALLS}/update-profile`;
  UPDATE_PROFILE_PIC_API_URL = `${API_BASE_URL_FOR_API_CALLS}/update-profile-pic`;
}

const fetchCurrentProfileData = async () => {
  if (!IS_CONFIG_VALID || !PROFILE_API_URL) {
    throw new Error("Backend API URL is not configured. Cannot fetch current profile.");
  }
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  const response = await axios.get(PROFILE_API_URL, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  return response.data;
};

const EditProfile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState(DefaultProfileImage);
  const [selectedFileObject, setSelectedFileObject] = useState(null);

  const { data: currentProfile, isLoading: isLoadingProfile, isError: isProfileError, error: profileError } = useQuery({
    queryKey: ["profileData"],
    queryFn: fetchCurrentProfileData,
    enabled: IS_CONFIG_VALID,
    retry: 1,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting: isFormSubmitting },
  } = useForm({
    resolver: yupResolver(editProfileSchema),
    defaultValues: {
        name: "",
        username: "",
        email: "",
        phone: "",
        profile_pic: null,
    }
  });

  useEffect(() => {
    if (currentProfile) {
      reset({
        name: currentProfile.name || "",
        username: currentProfile.username || "",
        email: currentProfile.email || "",
        phone: currentProfile.phone || "",
        profile_pic: null,
      });

      if (currentProfile.profile_pic) {
        const fullPicUrl = getMediaUrl(currentProfile.profile_pic, currentProfile.updated_at) || DefaultProfileImage;
        setImagePreview(fullPicUrl);
      } else {
        setImagePreview(DefaultProfileImage);
      }
    }
  }, [currentProfile, reset, BACKEND_BASE_URL]); 

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFileObject(file);
      setImagePreview(URL.createObjectURL(file));
      setValue("profile_pic", event.target.files, { shouldValidate: true });
    } else {
      setSelectedFileObject(null);
      if (currentProfile && currentProfile.profile_pic) {
          const fullPicUrl = getMediaUrl(currentProfile.profile_pic, currentProfile.updated_at) || DefaultProfileImage;
          setImagePreview(fullPicUrl);
      } else {
          setImagePreview(DefaultProfileImage);
      }
      setValue("profile_pic", null, { shouldValidate: true });
    }
  };

  const updateProfileDataMutation = useMutation({
    mutationFn: async (profileData) => {

      if (!IS_CONFIG_VALID || !UPDATE_PROFILE_DATA_API_URL) {
        throw new Error("Backend API URL for updating data is not configured.");
      }
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const payload = {
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
        phone: profileData.phone || null,
      };

      const response = await axios.post(UPDATE_PROFILE_DATA_API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
  });

  const updateProfilePicMutation = useMutation({
    mutationFn: async (file) => {

      if (!IS_CONFIG_VALID || !UPDATE_PROFILE_PIC_API_URL) {
        throw new Error("Backend API URL for updating profile picture is not configured.");
      }
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const formData = new FormData();
      formData.append("profile_pic", file);

      const response = await axios.post(UPDATE_PROFILE_PIC_API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      return response.data;
    },
  });

  const onSubmitHandler = async (dataFromRHF) => {
    if (!IS_CONFIG_VALID) {
        toast.error("Application is not configured correctly. Cannot submit form.");
        return;
    }
    let latestUserData = currentProfile ? { ...currentProfile } : {};

    try {
      const textUpdatePayload = {
        name: dataFromRHF.name,
        username: dataFromRHF.username,
        email: dataFromRHF.email,
        phone: dataFromRHF.phone,
      };
      const textUpdateResponse = await updateProfileDataMutation.mutateAsync(textUpdatePayload);
      toast.success(textUpdateResponse.message || "Profile details updated successfully!");
      if (textUpdateResponse.user) {
        latestUserData = { ...latestUserData, ...textUpdateResponse.user };
      }

      if (selectedFileObject) {
        const picUpdateResponse = await updateProfilePicMutation.mutateAsync(selectedFileObject);
        toast.success(picUpdateResponse.message || "Profile picture updated successfully!");
        if (picUpdateResponse.user) {
            latestUserData = { ...latestUserData, ...picUpdateResponse.user };
        } else if (picUpdateResponse.profile_pic_url) {
            latestUserData.profile_pic = picUpdateResponse.profile_pic_url;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["profileData"] });

      if (latestUserData.profile_pic) {
          // Newly uploaded pic — use today's date so it resolves to the new storage URL
          const newFullPicUrl = getMediaUrl(latestUserData.profile_pic, new Date().toISOString()) || DefaultProfileImage;
          setImagePreview(newFullPicUrl);
      } else if (!selectedFileObject) {
          setImagePreview(DefaultProfileImage);
      }

      setSelectedFileObject(null);
      setValue("profile_pic", null);

      toast.info("Redirecting to profile...", { autoClose: 1500 });
      setTimeout(() => {
        navigate("/profile");
      }, 1500);

    } catch (error) {
      console.error("Profile update error object:", error);
      let errorMsg = "Failed to update profile. Please try again.";
      const apiEndpoint = error.config?.url;

      if (axios.isAxiosError(error) && error.response) {
        console.error("Error response data:", error.response.data);
        let specificErrorShown = false;
        if (error.response.data?.errors && typeof error.response.data.errors === 'object') {
          Object.entries(error.response.data.errors).forEach(([key, value]) => {
            const fieldName = key.replace('profile_pic', 'profile picture').replace(/_/g, ' ');
            const messages = Array.isArray(value) ? value.join(", ") : String(value);
            toast.error(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${messages}`, { autoClose: 7000 });
            specificErrorShown = true;
          });
        }
        if (!specificErrorShown && error.response.data?.message) {
            errorMsg = String(error.response.data.message);
        } else if (!specificErrorShown && error.response.status === 404) {
            errorMsg = `Update endpoint not found: ${apiEndpoint || 'Unknown URL'}. Please check API routes.`;
        } else if (!specificErrorShown && error.response.statusText) {
            errorMsg = `Server error: ${error.response.status} ${error.response.statusText}`;
        }
        if (specificErrorShown) return;
      } else if (error.request) {
        errorMsg = "No response from server. Check your network connection.";
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }
      toast.error(errorMsg, { autoClose: 7000 });
    }
  };

  if (!IS_CONFIG_VALID) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col justify-center items-center h-screen-minus-header text-red-600 dark:text-red-400 p-4 text-center bg-red-50 dark:bg-red-900 rounded-md shadow-lg">
          <Icon icon="heroicons-outline:exclamation-triangle" className="w-16 h-16 mb-4 text-red-500 dark:text-red-300" />
          <p className="text-xl font-semibold mb-2">Application Configuration Error</p>
          <p className="mb-1">The backend URL (<code>VITE_BACKEND_BASE_URL</code>) is not set in your <code>.env</code> file.</p>
          <p>Please ensure it is correctly defined in the <code>.env</code> file at the project root and then restart the Vite development server.</p>
        </div>
      </div>
    );
  }

  if (isLoadingProfile) return <div className="flex justify-center items-center h-screen"><Loading /></div>;
  if (isProfileError && !currentProfile) return <div className="text-red-500 p-4 text-center">Error loading profile data: {profileError?.message || "Unknown error"}. Please try refreshing.</div>;

  const isLoadingOverall = isFormSubmitting || updateProfileDataMutation.isPending || updateProfilePicMutation.isPending;

  return (
    <div className="container mx-auto p-4">
      <Card title="Edit Profile Information">
        <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
          <div className="flex flex-col items-center space-y-4 my-6">
            <img
              src={imagePreview}
              alt="Profile Preview"
              className="w-32 h-32 object-cover rounded-full border-2 border-slate-300 dark:border-slate-600"
              onError={(e) => { e.target.onerror = null; e.target.src = DefaultProfileImage; }}
            />
            <div>
              <label
                htmlFor="profile_pic_input"
                className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600"
              >
                Change Picture
              </label>
              <input
                id="profile_pic_input"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleFileChange}
              />
            </div>
            {errors.profile_pic && (
              <p className="text-sm text-red-500 mt-1">{errors.profile_pic.message}</p>
            )}
          </div>

          <Textinput
            name="name"
            label="Full Name"
            type="text"
            register={register}
            error={errors.name}
            placeholder="Enter your full name"
            className="h-[48px]"
            // defaultValue={currentProfile?.name || ""} // defaultValue is handled by RHF reset
          />
          <Textinput
            name="username"
            label="Username"
            type="text"
            register={register}
            error={errors.username}
            placeholder="Enter your username"
            className="h-[48px]"
            // defaultValue={currentProfile?.username || ""}
          />
          <Textinput
            name="email"
            label="Email Address"
            type="email"
            register={register}
            error={errors.email}
            placeholder="Enter your email"
            className="h-[48px]"
            // defaultValue={currentProfile?.email || ""}
            disabled
          />
          <Textinput
            name="phone"
            label="Phone Number (Optional)"
            type="tel"
            register={register}
            error={errors.phone}
            placeholder="Enter your phone number"
            className="h-[48px]"
            // defaultValue={currentProfile?.phone || ""}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              text="Cancel"
              className="btn-outline dark:border-slate-700 dark:text-slate-300"
              onClick={() => navigate("/profile")}
              disabled={isLoadingOverall}
            />
            <Button
              type="submit"
              text="Save Changes"
              className="btn-dark"
              isLoading={isLoadingOverall}
              disabled={isLoadingOverall}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditProfile;