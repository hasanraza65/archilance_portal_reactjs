import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import Card from '@/components/ui/Card'; 
import Icon from '@/components/ui/Icon';   
import { getApiPrefix } from "@/pages/utility/apiHelper";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    password_confirmation: '',
    user_role: '4',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
        setErrors(prev => ({...prev, [name]: null}));
    }
  };

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
    if (!formData.user_role) newErrors.user_role = "User role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
        toast.error("Please correct the form errors.");
        return;
    }

    setLoading(true);
    setErrors({});
    const token = Cookies.get('token');
    console.log("Retrieved token for adding customer:", token);


    if (!token) {
      toast.error('Authentication token not found. Please log in again.');
      setLoading(false);
      navigate('/login'); 
      return;
    }

    const payload = {
      ...formData,
      user_role: parseInt(formData.user_role, 10),
    };
    console.log("Sending payload to Add Customer API:", payload);

    try {
            const apiPath = getApiBasePathForRole("/customer-user");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      console.log('Add Customer API Response:', response.data);
      toast.success('Customer added successfully!');
      
      navigate('/customers'); 
     
    } catch (error) {
      console.error('Error adding customer:', error);
      if (error.response) {
        console.error('Error response data (Add Customer):', error.response.data);
        console.error('Error response status (Add Customer):', error.response.status);
        if (error.response.data && error.response.data.errors) {
            const backendErrors = error.response.data.errors;
            const formattedErrors = {};
            for (const key in backendErrors) {
                formattedErrors[key] = backendErrors[key][0];
            }
            setErrors(formattedErrors);
            toast.error('Validation failed. Please check the form.');
        } else if (error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
        }
         else {
            toast.error('Failed to add customer. Server error.');
        }
      } else if (error.request) {
        console.error('Error request (Add Customer):', error.request);
        toast.error('Failed to add customer. No response from server.');
      } else {
        toast.error(`Failed to add customer: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "form-control py-2"; 
  const errorClass = "text-danger-500 text-xs mt-1"; 
  const labelClass = "form-label"; 

  return (
    <Card title="Add New Customer">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className={labelClass}>Full Name</label>
          <input
            type="text"
            name="name"
            id="name"
            className={`${inputClass} ${errors.name ? 'border-danger-500' : ''}`}
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>Email Address</label>
          <input
            type="email"
            name="email"
            id="email"
            className={`${inputClass} ${errors.email ? 'border-danger-500' : ''}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="username" className={labelClass}>Username</label>
          <input
            type="text"
            name="username"
            id="username"
            className={`${inputClass} ${errors.username ? 'border-danger-500' : ''}`}
            value={formData.username}
            onChange={handleChange}
            placeholder="Enter username"
          />
          {errors.username && <p className={errorClass}>{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>Phone Number</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            className={`${inputClass} ${errors.phone ? 'border-danger-500' : ''}`}
            value={formData.phone}
            onChange={handleChange}
            placeholder="+923001234567"
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className={`${inputClass} ${errors.password ? 'border-danger-500' : ''}`}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password (min. 8 characters)"
          />
          {errors.password && <p className={errorClass}>{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className={labelClass}>Confirm Password</label>
          <input
            type="password"
            name="password_confirmation"
            id="password_confirmation"
            className={`${inputClass} ${errors.password_confirmation ? 'border-danger-500' : ''}`}
            value={formData.password_confirmation}
            onChange={handleChange}
            placeholder="Confirm password"
          />
          {errors.password_confirmation && <p className={errorClass}>{errors.password_confirmation}</p>}
        </div>
        
        <div>
          <label htmlFor="user_role" className={labelClass}>User Role</label>
          <select
            name="user_role"
            id="user_role"
            className={`${inputClass} ${errors.user_role ? 'border-danger-500' : ''}`}
            value={formData.user_role}
            onChange={handleChange}
          >
            <option value="4">Customer</option> 
          </select>
          {errors.user_role && <p className={errorClass}>{errors.user_role}</p>}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
            <button
                type="button"
                className="btn btn-light" 
                onClick={() => navigate('/customers')} // Corrected cancel navigation
                disabled={loading}
            >
                Cancel
            </button>
            <button
                type="submit"
                className="btn btn-dark flex items-center" 
                disabled={loading}
            >
                {loading && <Icon icon="eos-icons:loading" className="animate-spin w-4 h-4 mr-2" />}
                {loading ? 'Submitting...' : 'Add Customer'}
            </button>
        </div>
      </form>
      
    </Card>
  );
};

export default AddCustomer;