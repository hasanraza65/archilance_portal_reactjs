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
import DefaultProfileImage from "@/assets/images/users/user-1.jpg";

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
      if (!value || !value.length) return true; // Allow no file
      return value[0].size <= 2000000; // 2MB
    })
    .test("fileType", "Unsupported file format (PNG, JPG, GIF only)", (value) => {
      if (!value || !value.length) return true; // Allow no file
      return ["image/jpeg", "image/png", "image/gif"].includes(value[0].type);
    }),
}).required();

const API_DOMAIN_FOR_ASSETS = import.meta.env?.VITE_API_DOMAIN || "https://demo.aentora.com/backend";
const API_BASE_URL_FOR_API_CALLS = import.meta.env?.VITE_API_URL || window.env?.API_URL || "https://demo.aentora.com/backend/public";

const PROFILE_API_URL = `${API_BASE_URL_FOR_API_CALLS}/api/me`;
const UPDATE_PROFILE_DATA_API_URL = `${API_BASE_URL_FOR_API_CALLS}/api/update-profile`;
const UPDATE_PROFILE_PIC_API_URL = `${API_BASE_URL_FOR_API_CALLS}/api/update-profile-pic`;


const fetchCurrentProfileData = async () => {
  const token = Cookies.get("token");
  if (!token) throw new Error("Authentication token not found.");
  const response = await axios.get(PROFILE_API_URL, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  console.log("Fetched current profile for edit:", response.data);
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
        const picPath = String(currentProfile.profile_pic);
        if (picPath.startsWith('http://') || picPath.startsWith('https://')) {
          setImagePreview(picPath);
        } else {
          const cleanPicPath = picPath.replace(/^\//, '');
          setImagePreview(`${API_DOMAIN_FOR_ASSETS}/${cleanPicPath}`);
        }
      } else {
        setImagePreview(DefaultProfileImage);
      }
    }
  }, [currentProfile, reset]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFileObject(file);
      setImagePreview(URL.createObjectURL(file));
      setValue("profile_pic", event.target.files, { shouldValidate: true });
    } else {
      setSelectedFileObject(null);
      if (currentProfile && currentProfile.profile_pic) {
          const picPath = String(currentProfile.profile_pic);
          setImagePreview(picPath.startsWith('http') ? picPath : `${API_DOMAIN_FOR_ASSETS}/${picPath.replace(/^\//, '')}`);
      } else {
          setImagePreview(DefaultProfileImage);
      }
      setValue("profile_pic", null, { shouldValidate: true });
    }
  };

  const updateProfileDataMutation = useMutation({
    mutationFn: async (profileData) => {
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const payload = {
        name: profileData.name,
        username: profileData.username,
        email: profileData.email,
       
        phone: profileData.phone || null,
      };
      
      console.log("--- Sending text data to:", UPDATE_PROFILE_DATA_API_URL, "---");
      console.log("Payload for text data:", payload);
      console.log("-----------------");

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
      const token = Cookies.get("token");
      if (!token) throw new Error("Authentication token not found.");

      const formData = new FormData();
      formData.append("profile_pic", file);

      console.log("--- Sending profile picture to:", UPDATE_PROFILE_PIC_API_URL, "---");
      console.log("File object being sent:", file); 
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? `{File: ${value.name}, Size: ${value.size}, Type: ${value.type}}` : value);
      }
      console.log("-----------------");

      const response = await axios.post(UPDATE_PROFILE_PIC_API_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Remove 'Content-Type' header - let the browser set it automatically
          // The browser will set it to 'multipart/form-data' with the correct boundary
          Accept: "application/json",
        },
      });
      return response.data;
    },
});



  const onSubmitHandler = async (dataFromRHF) => {
    let latestUserData = null;

    try {
      console.log("Submitting form with RHF data:", dataFromRHF);
      const textUpdateResponse = await updateProfileDataMutation.mutateAsync({
        name: dataFromRHF.name,
        username: dataFromRHF.username,
        email: dataFromRHF.email,
        phone: dataFromRHF.phone, 
      });
      toast.success(textUpdateResponse.message || "Profile details updated successfully!");
      if (textUpdateResponse.user) {
        latestUserData = textUpdateResponse.user;
      }

      if (selectedFileObject) {
        console.log("Submitting profile picture:", selectedFileObject);
        const picUpdateResponse = await updateProfilePicMutation.mutateAsync(selectedFileObject);
        toast.success(picUpdateResponse.message || "Profile picture updated successfully!");
        if (picUpdateResponse.user) {
            latestUserData = picUpdateResponse.user;
        } else if (picUpdateResponse.profile_pic_url && latestUserData) {
            latestUserData.profile_pic = picUpdateResponse.profile_pic_url;
        } else if (picUpdateResponse.profile_pic_url && !latestUserData) {
            latestUserData = { profile_pic: picUpdateResponse.profile_pic_url };
        }
      }

      queryClient.invalidateQueries({ queryKey: ["profileData"] });
      setSelectedFileObject(null);
      setValue("profile_pic", null);


      if (latestUserData && latestUserData.profile_pic) {
        const picPath = String(latestUserData.profile_pic);
        setImagePreview(picPath.startsWith('http') ? picPath : `${API_DOMAIN_FOR_ASSETS}/${picPath.replace(/^\//, '')}`);
      } else if (latestUserData && !latestUserData.profile_pic && !selectedFileObject) {
        setImagePreview(DefaultProfileImage);
      }

      setTimeout(() => {
        navigate("/profile");
      }, 1500);

    } catch (error) {
      console.error("Profile update error object:", error); 
      let errorMsg = "Failed to update profile. Please try again.";
      const apiEndpoint = error.config?.url;

      if (error.response) {
        
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        
        let specificErrorShown = false;

        if (error.response.data && error.response.data.errors && typeof error.response.data.errors === 'object') {
          const validationErrors = error.response.data.errors;
          Object.keys(validationErrors).forEach((key) => {
            const fieldName = key.replace('profile_pic', 'profile picture').replace(/_/g, ' ');
            const messages = Array.isArray(validationErrors[key]) ? validationErrors[key].join(", ") : String(validationErrors[key]);
            toast.error(`${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}: ${messages}`, { autoClose: 7000 });
            specificErrorShown = true;
          });
        }

        
        if (!specificErrorShown && error.response.data && error.response.data.message && typeof error.response.data.message === 'string') {
            errorMsg = error.response.data.message;
        } else if (error.response.status === 404) {
            errorMsg = `Update endpoint not found: ${apiEndpoint}. Please check the API route.`;
        } else if (error.response.statusText && !specificErrorShown && !error.response.data?.message) { 
            errorMsg = `Server error: ${error.response.status} ${error.response.statusText}`;
        }
       
        if (specificErrorShown) return; 

      } else if (error.request) {
        console.error("Error request (no response):", error.request);
        errorMsg = "No response from server. Please check your network connection.";
      } else {
        console.error("Error message (request setup):", error.message);
        errorMsg = error.message;
      }
      toast.error(errorMsg);
    }
  };

  if (isLoadingProfile) return <div className="flex justify-center items-center h-screen"><Loading /></div>;
  if (isProfileError) return <div className="text-red-500 p-4">Error loading profile data: {profileError?.message || "Unknown error"}</div>;

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
                {...register("profile_pic")}
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
          />
          <Textinput
            name="username"
            label="Username"
            type="text"
            register={register}
            error={errors.username}
            placeholder="Enter your username"
            className="h-[48px]"
          />
          <Textinput
            name="email"
            label="Email Address"
            type="email"
            register={register}
            error={errors.email}
            placeholder="Enter your email"
            className="h-[48px]"
          />
          <Textinput
            name="phone"
            label="Phone Number (Optional)"
            type="tel"
            register={register}
            error={errors.phone}
            placeholder="Enter your phone number"
            className="h-[48px]"
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