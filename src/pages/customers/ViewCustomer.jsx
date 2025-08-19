import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { getApiPrefix } from "@/pages/utility/apiHelper";


const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

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
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const CustomerView = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get("token");

    if (!token) {
      setError("Authentication token not found. Please log in.");
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

      if (response.data && typeof response.data === 'object' && response.data !== null && response.data.id) {
        setCustomer(response.data);
      } else {
        console.error("API response.data (Single Customer) is not a valid customer object or is empty:", response.data);
        setError("Received unexpected or empty data format from server for customer details.");
        setCustomer(null);
      }
    } catch (err) {
      console.error("Error fetching customer details:", err);
      if (err.response) {
        setError(
          `Failed to fetch customer details: ${err.response.data.message || err.response.statusText || 'Server error'}`
        );
      } else if (err.request) {
        setError("Failed to fetch customer details: No response from server.");
      } else {
        setError(`Failed to fetch customer details: ${err.message}`);
      }
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const renderProfilePic = (currentCustomer) => {
    const { name, profile_pic } = currentCustomer;
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
        <div className="p-6 text-center text-slate-600 dark:text-slate-300">Loading customer details...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Error Displaying Customer">
        <div className="p-6 text-center text-danger-500">
          {error}
          <br />
          <button
            onClick={() => customerId ? fetchCustomerDetails() : navigate(-1)}
            className="mt-4 btn btn-primary inline-flex items-center"
          >
            <Icon icon="heroicons-outline:refresh" className="w-4 h-4 mr-2" />
            {customerId ? "Try Again" : "Go Back"}
          </button>
        </div>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card title="Customer Not Found">
        <div className="p-6 text-center text-slate-600 dark:text-slate-300">
          The requested customer could not be found or data is unavailable.
          <br />
          <button
            onClick={() => navigate("/customers")}
            className="mt-4 btn btn-primary inline-flex items-center"
          >
             <Icon icon="heroicons-outline:arrow-left" className="w-4 h-4 mr-2" />
            Back to Customer List
          </button>
        </div>
      </Card>
    );
  }

  const customerDetailsFields = [
    { label: "Full Name", value: customer.name },
    { label: "Email Address", value: customer.email },
    { label: "Username", value: customer.username },
    { label: "Phone Number", value: customer.phone },
    { label: "Role ID", value: customer.user_role },
  ];

  return (
    <div>
      <Card title="Customer Details">
        <div className="p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex-none ring-2 ring-offset-2 ring-slate-300 dark:ring-slate-600 dark:ring-offset-slate-800">
              {renderProfilePic(customer)}
            </div>
            <div className="text-center sm:text-left">
              <h5 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                {customer.name || "N/A"}
              </h5>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                @{customer.username || "N/A"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Customer ID: {customer.id}
              </p>
            </div>
          </div>

          <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
            {customerDetailsFields.map((field, index) => (
              <DetailItem key={index} label={field.label} value={field.value} />
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="btn btn-outline-secondary w-full sm:w-auto"
            >
              <Icon icon="heroicons-outline:arrow-left" className="w-5 h-5 mr-2" />
              Back to List
            </button>
            <button
              type="button"
              onClick={() => navigate(`/customers/edit/${customer.id}`)}
              className="btn btn-primary w-full sm:w-auto"
            >
              <Icon icon="heroicons:pencil-square" className="w-5 h-5 mr-2" />
              Edit Customer
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerView;