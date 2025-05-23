import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button"; // Assuming you have a Button component
import Alert from "@/components/ui/Alert";   // Assuming you have an Alert component

const PFP_BASE_URL = "https://demo.aentora.com/backend/public/storage/";

// DetailItem component (can be shared or defined here if specific styling is needed)
// This is the same as the one in CustomerView, ensures consistent styling
const DetailItem = ({ label, value }) => {
  let displayValue = value;
  if (value === null || value === undefined || String(value).trim() === "") {
    displayValue = "N/A";
  }
  return (
    <div className="flex flex-col sm:flex-row border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
      <div className="w-full sm:w-1/3 px-6 py-4 font-medium text-sm text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-700 sm:border-r sm:border-slate-200 sm:dark:border-slate-600">
        {label}
      </div>
      <div className="w-full sm:w-2/3 px-6 py-4 text-sm text-slate-700 dark:text-slate-200 break-words">
        {String(displayValue).replace(/[\r\n]+/g, " ")}
      </div>
    </div>
  );
};


const ShowEmployee = () => {
  const { employeeId } = useParams(); // Get employeeId from URL
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployeeDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get("token");

    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `https://demo.aentora.com/backend/public/api/admin/employee-user/${employeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Full API Response (Get Single Employee):", response);

      // Assuming the employee object is directly in response.data (like single customer)
      if (response.data && typeof response.data === 'object' && response.data !== null && response.data.id) {
        setEmployee(response.data);
      } else {
        console.error("API response.data (Single Employee) is not a valid object or is empty:", response.data);
        setError("Received unexpected or empty data format from server for employee details.");
        setEmployee(null);
      }
    } catch (err) {
      console.error("Error fetching employee details:", err);
      if (err.response) {
        console.error("Error response data (Get Single Employee):", err.response.data);
        console.error("Error response status (Get Single Employee):", err.response.status);
        setError(
          `Failed to fetch employee details: ${err.response.data.message || err.response.statusText || 'Server error'}`
        );
      } else if (err.request) {
        setError("Failed to fetch employee details: No response from server.");
      } else {
        setError(`Failed to fetch employee details: ${err.message}`);
      }
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId]); // Added employeeId to dependency array

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeDetails();
    }
  }, [employeeId, fetchEmployeeDetails]); // Added fetchEmployeeDetails

  const renderProfilePic = (currentEmployee) => {
    const { name, profile_pic } = currentEmployee;
    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

    if (profile_pic) {
      return (
        <img
          src={`${PFP_BASE_URL}${profile_pic}`}
          alt={name || 'Profile'}
          className="object-cover w-full h-full rounded-full"
          onError={(e) => {
            e.target.onerror = null;
            e.target.outerHTML = `<span class="flex items-center justify-center w-full h-full text-2xl text-white bg-slate-500 rounded-full">${initials}</span>`;
          }}
        />
      );
    } else {
      return (
        <span className="flex items-center justify-center w-full h-full text-2xl text-white bg-slate-500 rounded-full">
          {initials}
        </span>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center text-slate-600 dark:text-slate-300">Loading employee details...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Error Displaying Employee">
        <div className="p-6">
          <Alert className="alert-danger light-mode mb-4" icon="heroicons-outline:exclamation-triangle">
            {error}
          </Alert>
          <Button
            text={employeeId ? "Try Again" : "Go Back"}
            className="btn-primary mt-4"
            icon="heroicons-outline:refresh"
            onClick={() => employeeId ? fetchEmployeeDetails() : navigate(-1)}
          />
        </div>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card title="Employee Not Found">
        <div className="p-6 text-center text-slate-600 dark:text-slate-300">
          The requested employee could not be found or data is unavailable.
          <br />
          <Button
            text="Back to Employee List"
            className="btn-primary mt-4"
            icon="heroicons-outline:arrow-left"
            onClick={() => navigate("/employees")} // Navigate to employee list
          />
        </div>
      </Card>
    );
  }

  // Define fields to display based on your employee object structure
  // These are based on the columns in Allemployees.jsx
  const employeeDetailsFields = [
    { label: "Full Name", value: employee.name },
    { label: "Email Address", value: employee.email },
    { label: "Username", value: employee.username },
    { label: "Phone Number", value: employee.phone },
    { label: "Role ID", value: employee.user_role },
    // Add any other employee-specific fields here
    // { label: "Department", value: employee.department },
    // { label: "Job Title", value: employee.job_title },
    // { label: "Joined Date", value: employee.created_at ? new Date(employee.created_at).toLocaleDateString() : "N/A" },
  ];

  return (
    <div>
      <Card title="Employee Details">
        <div className="p-4 md:p-6 space-y-6">
          {/* Profile Header Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex-none ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-600 dark:ring-offset-slate-800">
              {renderProfilePic(employee)}
            </div>
            <div className="text-center sm:text-left">
              <h5 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                {employee.name || "N/A"}
              </h5>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                @{employee.username || "N/A"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Employee ID: {employee.id}
              </p>
            </div>
          </div>

          {/* Details Section - Styled to mimic table rows */}
          <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
            {employeeDetailsFields.map((field, index) => (
              <DetailItem key={index} label={field.label} value={field.value} />
            ))}
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <Button
              text="Back to List"
              className="btn-outline-secondary w-full sm:w-auto"
              icon="heroicons-outline:arrow-left"
              onClick={() => navigate("/employees")} // Navigate to employee list
            />
            <Button
              text="Edit Employee"
              className="btn-primary w-full sm:w-auto"
              icon="heroicons:pencil-square"
              onClick={() => navigate(`/employees/edit/${employee.id}`)} // Navigate to edit employee page
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ShowEmployee;