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

const PFP_BASE_URL = "https://demo.aentora.com/backend/public/storage/";

const EditEmployee = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
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

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        `https://demo.aentora.com/backend/public/api/admin/employee-user/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (response.data && typeof response.data === 'object' && response.data.id) {
        const employee = response.data;
        reset({
          name: employee.name || "",
          email: employee.email || "",
          username: employee.username || "",
          phone: employee.phone ? String(employee.phone).replace(/[\r\n]+/g, '') : "",
          user_role: employee.user_role || "",
          password: "",
          password_confirmation: "",
        });
        if (employee.profile_pic) {
          const picUrl = `${PFP_BASE_URL}${employee.profile_pic}`;
          setCurrentProfilePicUrl(picUrl);
          setProfilePicPreview(picUrl);
        } else {
          setCurrentProfilePicUrl("");
          setProfilePicPreview(null);
        }
      } else {
        setFetchError("Failed to load employee data or data is in unexpected format.");
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to load employee data.");
    } finally {
      setLoading(false);
    }
  }, [employeeId, reset]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const onSubmit = async (formData) => {
    console.log("Form Data from RHF:", formData); // Log all form data

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    const token = Cookies.get("token");
    if (!token) {
      setSubmitError("Authentication token not found.");
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
      const fileToUpload = formData.profile_pic[0];
      console.log("Attempting to append file to FormData:", fileToUpload); // DETAILED LOG
      console.log("File name:", fileToUpload.name);
      console.log("File type:", fileToUpload.type);
      console.log("File size:", fileToUpload.size);
      if (fileToUpload instanceof File) {
        console.log("It IS a File object.");
      } else {
        console.error("profile_pic[0] is NOT a File object!", fileToUpload);
      }
      dataToSubmit.append("profile_pic", fileToUpload);
    } else {
      console.log("No new profile picture selected or file list is empty.");
    }

    if (formData.password) {
      dataToSubmit.append("password", formData.password);
      dataToSubmit.append("password_confirmation", formData.password_confirmation);
    }

    console.log("FormData entries before sending:");
    for (let [key, value] of dataToSubmit.entries()) {
      console.log(`FD Key: ${key}, Value:`, value);
    }

    try {
      const response = await axios.post(
        `https://demo.aentora.com/backend/public/api/admin/employee-user/${employeeId}`,
        dataToSubmit,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      console.log("Update Response from backend:", response.data); // Log backend response
      setSuccessMessage("Employee updated successfully!");

      // If backend returns the updated employee with new profile_pic path:
      // if (response.data && response.data.profile_pic) {
      //   const newPicUrl = `${PFP_BASE_URL}${response.data.profile_pic}`;
      //   setCurrentProfilePicUrl(newPicUrl);
      //   setProfilePicPreview(newPicUrl);
      // } else {
      //   // If not, you might need to refetch or rely on navigation to show update
      //   fetchEmployeeData(); // Or just let the navigation handle it
      // }

      setTimeout(() => navigate("/employees"), 2000);
    } catch (err) {
      console.error("Error updating employee (axios catch):", err);
      if (err.response) {
        console.error("Axios error response data:", err.response.data);
        console.error("Axios error response status:", err.response.status);
        console.error("Axios error response headers:", err.response.headers);
      } else if (err.request) {
        console.error("Axios error request (no response):", err.request);
      } else {
        console.error('Axios error message:', err.message);
      }

      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        setSubmitError(`${firstErrorKey}: ${errors[firstErrorKey][0]}`);
      } else {
        setSubmitError(err.response?.data?.message || err.message || "Failed to update employee.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ... (rest of the component: loading/error JSX, form JSX)
  if (loading) {
    return <Card title="Loading Employee Data..."><div className="p-6 text-center">Please wait...</div></Card>;
  }
  if (fetchError) {
    return (
      <Card title="Error">
        <div className="p-6">
          <Alert className="alert-danger light-mode mb-4" icon="heroicons-outline:exclamation-triangle">{fetchError}</Alert>
          <Button text="Go Back" className="btn-dark mt-4" onClick={() => navigate("/employees")} />
        </div>
      </Card>
    );
  }

  return (
    <Card title={`Edit Employee: ${watch("name") || 'Details'}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-6">
        {submitError && <Alert toggle={() => setSubmitError(null)} className="alert-danger light-mode">{submitError}</Alert>}
        {successMessage && <Alert toggle={() => setSuccessMessage(null)} className="alert-success light-mode">{successMessage}</Alert>}

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
              pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Invalid email address" }
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

        <Textinput
          label="Role ID / Name*"
          name="user_role"
          type="text"
          placeholder="Enter employee role"
          register={register}
          validate={{ required: "Role is required" }}
          error={formErrors.user_role}
        />

        <div>
          <label className="form-label" htmlFor="profile_pic_input_edit_employee">
            Profile Picture
          </label>
          <input
            type="file"
            id="profile_pic_input_edit_employee"
            className="form-control py-2 px-3"
            {...register("profile_pic")}
            accept="image/png, image/jpeg, image/gif"
          />
          {profilePicPreview && (
            <div className="mt-2 w-24 h-24 rounded-full overflow-hidden ring-2 ring-slate-200 dark:ring-slate-700">
              <img src={profilePicPreview} alt="Profile Preview" className="object-cover w-full h-full" />
            </div>
          )}
          {formErrors.profile_pic && <div className="text-danger-500 text-xs mt-1">{formErrors.profile_pic.message}</div>}
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
              hasicon
              placeholder="Leave blank to keep current"
              register={register}
              validate={{
                minLength: passwordValue ? { value: 6, message: "Password must be at least 6 characters" } : undefined,
              }}
              error={formErrors.password}
            />
            <Textinput
              label="Confirm New Password"
              name="password_confirmation"
              type="password"
              hasicon
              placeholder="Confirm new password"
              register={register}
              validate={{
                validate: value => passwordValue ? (value === passwordValue || "The passwords do not match") : true,
              }}
              error={formErrors.password_confirmation}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            text="Cancel"
            className="btn-outline-secondary"
            type="button"
            onClick={() => navigate("/employees")}
            disabled={submitting}
          />
          <Button
            text={submitting ? "Updating..." : "Update Employee"}
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

export default EditEmployee;