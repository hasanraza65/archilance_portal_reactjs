import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { canManageEmployees } from "@/pages/utility/apiHelper";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const AddEmployee = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    password_confirmation: "",
    employee_type: "Employee", // Default type
    user_role: "3", // Default role ID for "Employee"
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!canManageEmployees()) {
      toast.error("You are not authorized to perform this action.");
      navigate("/employees");
    }
  }, [navigate]);

  // --- UPDATED CODE ---
  // This function now also sets the correct user_role when employee_type changes.
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Create an object to hold the state updates
    const updates = { [name]: value };

    // If the changed field is 'employee_type', set the corresponding user_role ID
    if (name === "employee_type") {
      switch (value) {
        case "Manager":
          updates.user_role = "5";
          break;
        case "Supervisor":
          updates.user_role = "6";
          break;
        case "Employee":
        case "Outsource":
        default:
          updates.user_role = "3";
          break;
      }
    }

    setFormData((prev) => ({ ...prev, ...updates }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  // --- END OF UPDATE ---

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid.";
    }
    if (!formData.username.trim()) newErrors.username = "Username is required.";
    if (formData.phone.trim() && !/^\+?[0-9\s-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Phone number is invalid (e.g., +923001234567).";
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = "Password confirmation is required.";
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match.";
    }
    if (!formData.employee_type)
      newErrors.employee_type = "Employee type is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the form errors.");
      return;
    }

    setLoading(true);
    setErrors({});
    const token = Cookies.get("token");

    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setLoading(false);
      navigate("/login");
      return;
    }

    const payload = {
      ...formData,
      user_role: parseInt(formData.user_role, 10),
    };

    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      toast.success("Employee added successfully!");
      navigate("/employees");
    } catch (error) {
      if (error.response) {
        if (error.response.data && error.response.data.errors) {
          const backendErrors = error.response.data.errors;
          const formattedErrors = {};
          for (const key in backendErrors) {
            formattedErrors[key] = backendErrors[key][0];
          }
          setErrors(formattedErrors);
          toast.error("Validation failed. Please check the form.");
        } else if (error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Failed to add employee. Server error.");
        }
      } else if (error.request) {
        toast.error("Failed to add employee. No response from server.");
      } else {
        toast.error(`Failed to add employee: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "form-control py-2";
  const errorClass = "text-danger-500 text-xs mt-1";
  const labelClass = "form-label";

  return (
    <Card title="Add New Employee">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            className={`${inputClass} ${
              errors.name ? "border-danger-500" : ""
            }`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            className={`${inputClass} ${
              errors.email ? "border-danger-500" : ""
            }`}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="username" className={labelClass}>
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            className={`${inputClass} ${
              errors.username ? "border-danger-500" : ""
            }`}
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
          />
          {errors.username && <p className={errorClass}>{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            className={`${inputClass} ${
              errors.phone ? "border-danger-500" : ""
            }`}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+923001234567"
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>

        {/* --- UPDATED CODE --- */}
        <div>
          <label htmlFor="employee_type" className={labelClass}>
            Employee Type
          </label>
          <select
            name="employee_type"
            id="employee_type"
            className={`${inputClass} ${
              errors.employee_type ? "border-danger-500" : ""
            }`}
            value={formData.employee_type}
            onChange={handleChange}
          >
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Supervisor">Coordinator</option>
            <option value="Outsource">Outsource</option>
          </select>
          {errors.employee_type && (
            <p className={errorClass}>{errors.employee_type}</p>
          )}
        </div>
        {/* --- END OF UPDATE --- */}

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            className={`${inputClass} ${
              errors.password ? "border-danger-500" : ""
            }`}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
          {errors.password && <p className={errorClass}>{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className={labelClass}>
            Confirm Password
          </label>
          <input
            type="password"
            name="password_confirmation"
            id="password_confirmation"
            className={`${inputClass} ${
              errors.password_confirmation ? "border-danger-500" : ""
            }`}
            value={formData.password_confirmation}
            onChange={handleChange}
            placeholder="Confirm password"
          />
          {errors.password_confirmation && (
            <p className={errorClass}>{errors.password_confirmation}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            className="btn btn-light"
            onClick={() => navigate("/employees")}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-dark flex items-center"
            disabled={loading}
          >
            {loading && (
              <Icon
                icon="eos-icons:loading"
                className="animate-spin w-4 h-4 mr-2"
              />
            )}
            {loading ? "Submitting..." : "Add Employee"}
          </button>
        </div>
      </form>
    </Card>
  );
};

export default AddEmployee;
