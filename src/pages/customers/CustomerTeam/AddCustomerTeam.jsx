import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import Card from '@/components/ui/Card';
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Alert from "@/components/ui/Alert";

// Validation schema to ensure data is correct before sending
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
});

const AddCustomerTeam = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    const token = Cookies.get("token");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setLoading(false);
      return;
    }

    // This is the correct API endpoint from your Postman screenshot
    const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer/customer-team`;
    
    // We use FormData because your Postman request uses 'form-data'
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Axios sets the correct 'Content-Type' for FormData automatically
        },
      });

      setSuccessMessage(response.data.message || 'Team member added successfully!');
      reset(); // Clear the form fields
      
      // Redirect back to the team list after 2 seconds
      setTimeout(() => {
        navigate('/team'); 
      }, 2000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred.";
      setError(errorMessage);
      console.error("Error adding team member:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Add New Team Member">
      {successMessage && (
        <Alert className="alert-success light-mode mb-5" toggle={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert className="alert-danger light-mode mb-5" toggle={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Textinput
          name="name"
          label="Full Name"
          type="text"
          placeholder="Enter team member's full name"
          register={register}
          error={errors.name}
        />
        <Textinput
          name="email"
          label="Email Address"
          type="email"
          placeholder="Enter email address (e.g., test@mail.com)"
          register={register}
          error={errors.email}
        />
        <Textinput
          name="phone"
          label="Phone Number"
          type="text"
          placeholder="Enter phone number (e.g., +9231562963371)"
          register={register}
          error={errors.phone}
        />

        <div className="ltr:text-right rtl:text-left space-x-3">
            <button
                type="button"
                className="btn btn-light"
                onClick={() => navigate(-1)} // Go back to the previous page
            >
                Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={loading}>
                {loading ? 'Submitting...' : 'Add Member'}
            </button>
        </div>
      </form>
    </Card>
  );
};

export default AddCustomerTeam;