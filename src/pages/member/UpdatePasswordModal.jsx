import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";

// Backend API URL
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const UPDATE_PASSWORD_URL = `${BACKEND_BASE_URL}/api/update-password`;

// 1. Validation Schema ko API ke mutabiq update karein
const schema = yup.object({
  current_password: yup.string().required("Current Password is required"),
  // 'new_password' ki jagah 'password'
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("New Password is required"),
  // 'new_password_confirmation' ki jagah 'password_confirmation'
  password_confirmation: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match") // yup.ref() ko bhi update karein
    .required("Confirm Password is required"),
}).required();

const UpdatePasswordModal = ({ onUpdateSuccess }) => {
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onChange",
  });

  const { mutate: performPasswordUpdate, isPending: isLoading } = useMutation({
    mutationFn: async (formData) => {
      // formData ab bilkul sahi format mein hoga
      const response = await axios.post(UPDATE_PASSWORD_URL, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully!");
      reset();
      onUpdateSuccess();
    },
    onError: (error) => {
      let errorMsg = "Failed to update password. Please try again.";
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.data.errors) {
            const serverErrors = Object.values(error.response.data.errors).flat();
            errorMsg = serverErrors.join(' ');
        } else {
            errorMsg = error.response.data.message || `Server error: ${error.response.status}`;
        }
      }
      toast.error(errorMsg);
    },
  });

  const onSubmit = (formData) => {
    performPasswordUpdate(formData);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900 bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-xl font-bold text-slate-800 dark:text-slate-200">
          Update Your Password
        </h2>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          For your security, you must update your temporary password before proceeding.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Textinput
            name="current_password"
            label="Current Password"
            type="password"
            register={register}
            error={errors.current_password}
            placeholder="Enter your current password"
          />
          {/* 2. Textinput ke 'name' prop ko update karein */}
          <Textinput
            name="password"
            label="New Password"
            type="password"
            register={register}
            error={errors.password} // Yeh bhi update ho jayega
            placeholder="Enter your new password"
          />
          {/* 3. Textinput ke 'name' prop ko update karein */}
          <Textinput
            name="password_confirmation"
            label="Confirm New Password"
            type="password"
            register={register}
            error={errors.password_confirmation} // Yeh bhi update ho jayega
            placeholder="Confirm your new password"
          />
          <Button
            type="submit"
            text="Update Password"
            className="btn btn-dark block w-full text-center"
            isLoading={isLoading}
            disabled={isLoading}
          />
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordModal;