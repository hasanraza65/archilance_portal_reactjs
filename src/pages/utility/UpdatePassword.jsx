import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

// Assuming you have these UI components from your project
const Textinput = ({ label, type, placeholder, value, onChange, name }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
      {label}
    </label>
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 text-sm text-slate-900 bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const Button = ({ children, type, className, isLoading }) => (
  <button
    type={type}
    className={`px-4 py-2 text-white bg-primary-500 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${className}`}
    disabled={isLoading}
  >
    {isLoading ? "Saving..." : children}
  </button>
);


const UPDATE_PASSWORD_API_URL = import.meta.env.VITE_BACKEND_BASE_URL + "/api/update-password";


const updatePasswordFn = async (passwordData) => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const response = await axios.post(UPDATE_PASSWORD_API_URL, passwordData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return response.data;
};

const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const mutation = useMutation({
    mutationFn: updatePasswordFn,
    onSuccess: (data) => {
      toast.success(data.message || "Password updated successfully!");
      setFormData({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || "An unexpected error occurred.";
      if (error.response?.data?.errors) {
        const errors = Object.values(error.response.data.errors).flat();
        errors.forEach((err) => toast.error(err));
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Card>
      <h5 className="card-title text-slate-900 dark:text-white mb-4">
        Update Password
      </h5>
      <form onSubmit={handleSubmit}>
        <Textinput
          label="Current Password"
          type="password"
          name="current_password"
          placeholder="Enter your current password"
          value={formData.current_password}
          onChange={handleChange}
        />
        <Textinput
          label="New Password"
          type="password"
          name="password"
          placeholder="Enter your new password"
          value={formData.password}
          onChange={handleChange}
        />
        <Textinput
          label="Confirm New Password"
          type="password"
          name="password_confirmation"
          placeholder="Re-enter your new password"
          value={formData.password_confirmation}
          onChange={handleChange}
        />

        <div className="flex justify-end">
          <Button type="submit" isLoading={mutation.isLoading}>
            <Icon icon="heroicons:arrow-path" className="w-4 h-4 mr-2" />
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default UpdatePassword;
