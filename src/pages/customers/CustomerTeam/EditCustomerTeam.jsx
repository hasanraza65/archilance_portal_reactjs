import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import Card from '@/components/ui/Card';
import Textinput from "@/components/ui/Textinput";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Alert from "@/components/ui/Alert";

// Validation schema
const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().required("Phone number is required"),
});

const EditCustomerTeam = () => {
  const { id } = useParams(); // Get the ID from the URL
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset, // Use reset to populate the form
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
  });

  // Fetch existing member data when the component loads
  useEffect(() => {
    const token = Cookies.get("token");
    const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer/customer-team/${id}`;

    axios.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => {
        console.log("API Response for Edit:", response.data);

        // **THE FIX IS HERE**
        // The API returns the data object directly, not nested within another 'data' property.
        const memberData = response.data; // We now use response.data directly.
        
        if (memberData && memberData.id) { // We can check if the object is valid by looking for an 'id'.
          // The reset function will correctly map the fields (name, email, phone) from the API response to the form.
          reset(memberData);
        } else {
           setError("Received invalid data from the server.");
        }
        setFetchLoading(false);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setError("Failed to fetch team member data. Please check the console for details.");
        setFetchLoading(false);
      });
  }, [id, reset]);

  // Handle form submission to update the member
  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    const token = Cookies.get("token");
    const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer/customer-team/${id}`;

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('_method', 'PUT'); 

    try {
      const response = await axios.post(apiUrl, formData, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      setSuccessMessage(response.data.message || 'Team member updated successfully!');
      
      setTimeout(() => {
        navigate('/team');
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during the update.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return <Card><div className="p-4 text-center">Loading member details...</div></Card>;
  }

  return (
    <Card title="Edit Team Member">
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
          placeholder="Enter full name"
          register={register}
          error={errors.name}
        />
        <Textinput
          name="email"
          label="Email Address"
          type="email"
          placeholder="Enter email address"
          register={register}
          error={errors.email}
        />
        <Textinput
          name="phone"
          label="Phone Number"
          type="text"
          placeholder="Enter phone number"
          register={register}
          error={errors.phone}
        />

        <div className="ltr:text-right rtl:text-left space-x-3">
            <button
                type="button"
                className="btn btn-light"
                onClick={() => navigate(-1)}
            >
                Cancel
            </button>
            <button type="submit" className="btn btn-dark" disabled={loading}>
                {loading ? 'Updating...' : 'Update Member'}
            </button>
        </div>
      </form>
    </Card>
  );
};

export default EditCustomerTeam;