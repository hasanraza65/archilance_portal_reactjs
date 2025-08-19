import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { useForm } from "react-hook-form";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Textinput from "@/components/ui/Textinput";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const UpdateCustomer = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
    reset,
  } = useForm({
    mode: "onChange",
  });

  const [currentProfilePicUrl, setCurrentProfilePicUrl] = useState("");
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const watchedProfilePicFile = watch("profile_pic");
  const passwordValue = watch("password");

  useEffect(() => {
    let objectUrl = null;
    if (watchedProfilePicFile && watchedProfilePicFile[0]) {
      const file = watchedProfilePicFile[0];
      objectUrl = URL.createObjectURL(file);
      setProfilePicPreview(objectUrl);
    } else if (currentProfilePicUrl) {
      setProfilePicPreview(currentProfilePicUrl);
    } else {
      setProfilePicPreview(null);
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [watchedProfilePicFile, currentProfilePicUrl]);

  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = Cookies.get("token");

    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const apiPath = getApiBasePathForRole("/customer-user");

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${customerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.id
      ) {
        const customer = response.data;
        reset({
          name: customer.name || "",
          email: customer.email || "",
          username: customer.username || "",
          phone: customer.phone
            ? String(customer.phone).replace(/[\r\n]+/g, "")
            : "",
          user_role: customer.user_role || "",
          password: "",
          password_confirmation: "",
        });

        if (customer.profile_pic) {
          const picUrl = `${PFP_BASE_URL}${customer.profile_pic}`;
          setCurrentProfilePicUrl(picUrl);
          setProfilePicPreview(picUrl);
        } else {
          setCurrentProfilePicUrl("");
          setProfilePicPreview(null);
        }
      } else {
        setFetchError(
          "Failed to load customer data or data is in unexpected format."
        );
      }
    } catch (err) {
      console.error("Error fetching customer data:", err);
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load customer data. An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, reset]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    const token = Cookies.get("token");

    if (!token) {
      setSubmitError("Authentication token not found. Please log in.");
      setSubmitting(false);
      return;
    }

    const dataToSubmit = new FormData();
    dataToSubmit.append("name", formData.name);
    dataToSubmit.append("email", formData.email);
    dataToSubmit.append("username", formData.username);
    dataToSubmit.append("phone", formData.phone || "");
    dataToSubmit.append("user_role", formData.user_role);
    dataToSubmit.append("_method", "PUT");

    if (formData.profile_pic && formData.profile_pic[0]) {
      dataToSubmit.append("profile_pic", formData.profile_pic[0]);
    }

    if (formData.password) {
      dataToSubmit.append("password", formData.password);
      dataToSubmit.append(
        "password_confirmation",
        formData.password_confirmation
      );
    }

    try {
      const apiPath = getApiBasePathForRole("/customer-user");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${customerId}`,
        dataToSubmit,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setSuccessMessage("Customer updated successfully!");
      setTimeout(() => navigate(`/customers/edit/${row.original.id}`), 2000);
    } catch (err) {
      console.error("Error updating customer:", err.response);
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        Object.keys(errors).forEach((field) => {
          if (formErrors[field]) {
            formErrors[field].message = errors[field][0];
          }
        });
        const firstErrorKey = Object.keys(errors)[0];
        setSubmitError(`${firstErrorKey}: ${errors[firstErrorKey][0]}`);
      } else {
        setSubmitError(
          err.response?.data?.message ||
            err.message ||
            "Failed to update customer. An unknown error occurred."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card title="Loading Customer Data...">
        <div className="p-6 text-center text-slate-600 dark:text-slate-300">
          Please wait...
        </div>
      </Card>
    );
  }
  if (fetchError) {
    return (
      <Card title="Error">
        <div className="p-6">
          <Alert
            icon="heroicons-outline:exclamation-triangle"
            className="alert-danger light-mode"
          >
            {fetchError}
          </Alert>
          <Button
            text="Go Back"
            className="btn-dark mt-4"
            onClick={() => navigate(-1)}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Edit Customer: ${watch("name") || "Details"}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
        {submitError && (
          <Alert
            toggle={() => setSubmitError(null)}
            className="alert-danger light-mode"
          >
            {submitError}
          </Alert>
        )}
        {successMessage && (
          <Alert
            toggle={() => setSuccessMessage(null)}
            className="alert-success light-mode"
          >
            {successMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textinput
            label="Full Name*"
            name="name"
            type="text"
            placeholder="Enter full name"
            register={register}
            validate={{ required: "Full Name is required" }}
            error={formErrors.name}
          />
          <Textinput
            label="Email*"
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
            error={formErrors.email}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Textinput
            label="Username*"
            name="username"
            type="text"
            placeholder="Enter username"
            register={register}
            validate={{ required: "Username is required" }}
            error={formErrors.username}
          />
          <Textinput
            label="Phone"
            name="phone"
            type="tel"
            placeholder="Enter phone number"
            register={register}
            error={formErrors.phone}
          />
        </div>

        {/* <Textinput
          label="Role ID / Name*"
          name="user_role"
          type="text"
          placeholder="Enter customer role"
          register={register}
          validate={{ required: "Role is required" }}
          error={formErrors.user_role}
        /> */}

        <div>
          <label className="form-label" htmlFor="profile_pic_input_update">
            Profile Picture
          </label>
          <input
            type="file"
            id="profile_pic_input_update"
            className="form-control py-2 px-3"
            {...register("profile_pic")}
            accept="image/png, image/jpeg, image/gif"
          />
          {profilePicPreview && (
            <div className="mt-2 w-24 h-24 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
              <img
                src={profilePicPreview}
                alt="Profile Preview"
                className="object-cover w-full h-full"
              />
            </div>
          )}
          {formErrors.profile_pic && (
            <div className="text-danger-500 text-xs mt-1">
              {formErrors.profile_pic.message}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 mt-6">
          <h6 className="text-slate-600 dark:text-slate-300 text-base font-medium mb-4">
            Update Password (optional)
          </h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Textinput
              label="New Password"
              name="password"
              type="password"
              placeholder="Leave blank to keep current"
              register={register}
              validate={{
                minLength: passwordValue
                  ? {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    }
                  : undefined,
              }}
              error={formErrors.password}
            />
            <Textinput
              label="Confirm New Password"
              name="password_confirmation"
              type="password"
              placeholder="Confirm new password"
              register={register}
              validate={{
                validate: (value) => {
                  if (passwordValue) {
                    return (
                      value === passwordValue || "The passwords do not match"
                    );
                  }
                  return true;
                },
              }}
              error={formErrors.password_confirmation}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            text="Cancel"
            className="btn-outline-secondary"
            onClick={() => navigate("/customers")}
            disabled={submitting}
            type="button"
          />
          <Button
            text={submitting ? "Updating..." : "Update Customer"}
            className="btn-dark"
            type="submit"
            isLoading={submitting}
            disabled={submitting || Object.keys(formErrors).length > 0}
          />
        </div>
      </form>
    </Card>
  );
};

export default UpdateCustomer;
