import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useForm, Controller } from "react-hook-form";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { canManageEmployees } from "@/pages/utility/apiHelper";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profilePicPreview, setProfilePicPreview] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      employee_type: "Employee",
    },
  });

  const passwordValue = watch("password");
  const watchedProfilePic = watch("profile_pic");

  useEffect(() => {
    if (!canManageEmployees()) {
      toast.error("You are not authorized to perform this action.");
      navigate("/employees");
    }
  }, [navigate]);

  useEffect(() => {
    if (watchedProfilePic && watchedProfilePic[0]) {
      const file = watchedProfilePic[0];
      const url = URL.createObjectURL(file);
      setProfilePicPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePicPreview(null);
    }
  }, [watchedProfilePic]);

  const onSubmit = async (formData) => {
    setLoading(true);
    const token = Cookies.get("token");

    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setLoading(false);
      navigate("/login");
      return;
    }

    // Determine user_role based on employee_type
    let userRoleId;
    switch (formData.employee_type) {
      case "Manager":
        userRoleId = "5";
        break;
      case "Supervisor":
        userRoleId = "6";
        break;
      case "Executive":
        userRoleId = "7";
        break;
      default:
        userRoleId = "3";
        break;
    }

    const dataToSubmit = new FormData();
    dataToSubmit.append("name", formData.name);
    dataToSubmit.append("email", formData.email);
    dataToSubmit.append("username", formData.username);
    dataToSubmit.append("phone", formData.phone || "");
    dataToSubmit.append("employee_type", formData.employee_type);
    dataToSubmit.append("user_role", userRoleId);
    dataToSubmit.append("password", formData.password);
    dataToSubmit.append("password_confirmation", formData.password_confirmation);

    if (formData.joining_date) {
      const date = Array.isArray(formData.joining_date)
        ? formData.joining_date[0]
        : new Date(formData.joining_date);
      if (!isNaN(date.getTime())) {
        const formattedDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        dataToSubmit.append("joining_date", formattedDate);
      }
    }

    if (formData.profile_pic && formData.profile_pic[0]) {
      dataToSubmit.append("profile_pic", formData.profile_pic[0]);
    }

    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        dataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success("Employee added successfully!");
      navigate("/employees");
    } catch (error) {
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          toast.error(`${key}: ${backendErrors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to add employee.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card title="Add New Employee">
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
              <Icon icon="heroicons-outline:user" className="mr-2" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Textinput
                label="Full Name*"
                name="name"
                type="text"
                placeholder="Enter full name"
                register={register}
                validate={{ required: "Full name is required" }}
                error={errors.name}
              />
              <Textinput
                label="Email Address*"
                name="email"
                type="email"
                placeholder="Enter email address"
                register={register}
                validate={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                error={errors.email}
              />
              <Textinput
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+923001234567"
                register={register}
                error={errors.phone}
              />
              <div>
                <label className="form-label block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profile_pic"
                      className="form-control py-2 px-3 w-full"
                      {...register("profile_pic")}
                      accept="image/*"
                    />
                  </div>
                  {profilePicPreview && (
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-none ring-2 ring-primary-500">
                      <img
                        src={profilePicPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Account & Administration Section */}
          <div>
            <h4 className="text-base font-medium text-slate-900 dark:text-white mb-4 flex items-center">
              <Icon icon="heroicons-outline:cog" className="mr-2" />
              Account & Administration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Textinput
                label="Username*"
                name="username"
                type="text"
                placeholder="Enter username"
                register={register}
                validate={{ required: "Username is required" }}
                error={errors.username}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="employee_type" className="form-label mb-1">
                    Employee Type*
                  </label>
                  <select
                    id="employee_type"
                    className={`form-control py-2 ${
                      errors.employee_type ? "border-danger-500" : "border-slate-300 dark:border-slate-600"
                    }`}
                    {...register("employee_type", { required: "Type is required" })}
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Executive">Executive</option>
                    <option value="Supervisor">Coordinator</option>
                    <option value="Outsource">Outsource</option>
                  </select>
                  {errors.employee_type && (
                    <p className="text-danger-500 text-xs mt-1">{errors.employee_type.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="joining_date" className="form-label mb-1">
                    Joining Date
                  </label>
                  <Controller
                    name="joining_date"
                    control={control}
                    render={({ field: { onChange, value } }) => (
                      <Flatpickr
                        value={value || ""}
                        className="form-control py-2"
                        placeholder="Select date"
                        onChange={onChange}
                        options={{ altInput: true, altFormat: "M j, Y", dateFormat: "Y-m-d" }}
                      />
                    )}
                  />
                </div>
              </div>

              <Textinput
                label="Password*"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                hasicon
                register={register}
                validate={{
                  required: "Password is required",
                  minLength: { value: 8, message: "Minimum 8 characters" },
                }}
                error={errors.password}
              />
              <Textinput
                label="Confirm Password*"
                name="password_confirmation"
                type="password"
                placeholder="Re-enter password"
                hasicon
                register={register}
                validate={{
                  required: "Please confirm password",
                  validate: (val) => val === passwordValue || "Passwords do not match",
                }}
                error={errors.password_confirmation}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              text="Cancel"
              className="btn-outline-secondary"
              type="button"
              onClick={() => navigate("/employees")}
              disabled={loading}
            />
            <Button
              text={loading ? "Creating..." : "Add Employee"}
              className="btn-dark"
              type="submit"
              isLoading={loading}
              disabled={loading}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddEmployee;
