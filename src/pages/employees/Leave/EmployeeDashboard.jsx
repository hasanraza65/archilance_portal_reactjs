import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import LeaveHistoryTable from './LeaveHistoryTable';
import Cookies from 'js-cookie';
// Step 1: Import react-hot-toast
import { Toaster, toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const getAuthToken = () => {
  return Cookies.get('token');
};

const EmployeeDashboard = () => {
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const LEAVE_API_ENDPOINT = `${API_BASE_URL}/api/employee/leave-request`;

  const fetchLeaveData = useCallback(async () => {
    // ... (This function remains the same)
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please log in.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const response = await axios.get(LEAVE_API_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      setLeaves(response.data.data || []);
      setCounts(response.data.counts || { total: 0, approved: 0, rejected: 0, pending: 0 });
      setError(null);
    } catch (err) {
      console.error("Error fetching leave data:", err);
      setError('Failed to fetch leave data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [LEAVE_API_ENDPOINT]);

  useEffect(() => {
    fetchLeaveData();
  }, [fetchLeaveData]);

  // MAJOR CHANGE: Updated to send form-data and use toasts
  const handleApplyLeave = async (leaveData) => {
    const token = getAuthToken();
    if (!token) {
      toast.error('Authentication error. Please log in again.');
      throw new Error('No auth token');
    }

    // Create a FormData object to send as 'form-data'
    const formData = new FormData();
    formData.append('start_date', leaveData.startDate);
    formData.append('end_date', leaveData.endDate);
    formData.append('reason', leaveData.reason);
    // Capitalize leave_type to match API expectations (e.g., 'Sick', 'Vacation')
    const formattedLeaveType = leaveData.leaveType.charAt(0).toUpperCase() + leaveData.leaveType.slice(1);
    formData.append('leave_type', formattedLeaveType);
    
    // Note: We do NOT append 'status'. The backend should handle setting it to 'Pending' by default.

    const toastId = toast.loading('Submitting your leave request...');

    try {
      const response = await axios.post(LEAVE_API_ENDPOINT, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // IMPORTANT: Do NOT set 'Content-Type': 'multipart/form-data'. 
          // Axios/browser will do it automatically with the correct boundary.
        },
      });
      
      // Use the success message from the API for the toast
      toast.success(response.data.message || 'Leave request submitted!', { id: toastId });
      
      // On success, refresh the data
      await fetchLeaveData();

    } catch (err) {
      console.error("Error submitting leave request:", err.response?.data || err);
      const errorMessage = err.response?.data?.message || 'Failed to submit request. Please try again.';
      toast.error(errorMessage, { id: toastId });
      
      // Re-throw the error so the form knows the submission failed
      throw err;
    }
  };

  return (
    <div className="container mx-auto">
      {/* Step 2: Add the Toaster component here */}
      <Toaster position="top-center" reverseOrder={false} />
      
      <LeaveHistoryTable 
        leaves={leaves}
        counts={counts}
        onApplyLeave={handleApplyLeave}
        isLoading={isLoading}
        error={error}
        onRefresh={fetchLeaveData}
      />
    </div>
  );
};

export default EmployeeDashboard;