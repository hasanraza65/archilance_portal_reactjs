import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import LeaveHistoryTable from "./LeaveHistoryTable";
import LeaveApplicationForm from "./LeaveApplicationForm";
import Cookies from "js-cookie";
import { Toaster, toast } from "react-hot-toast";
import Swal from "sweetalert2";

// --- Helper Functions & Constants ---
const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const getAuthToken = () => {
  return Cookies.get("token");
};

const EmployeeDashboard = () => {
  // --- State Management ---
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });
  const [leaveTypesCount, setLeaveTypesCount] = useState({
    casual: 0,
    annual: 0,
    sick: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);

  const LEAVE_API_ENDPOINT = `${API_BASE_URL}/api/employee/leave-request`;

  // --- API Functions ---
  const fetchLeaveData = useCallback(async (silent = false) => {
    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found. Please log in.");
      setIsLoading(false);
      return;
    }

    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(LEAVE_API_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      setLeaves(response.data.data || []);
      setCounts(
        response.data.counts || {
          total: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
        }
      );
      setLeaveTypesCount(
        response.data.types || {
          casual: 0,
          annual: 0,
          sick: 0,
        }
      );
    } catch (err) {
      console.error("Error fetching leave data:", err);
      if (!silent) setError("Failed to fetch leave data. Please try again later.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [LEAVE_API_ENDPOINT]);

  useEffect(() => {
    fetchLeaveData();

    // Set up polling to refresh data every 30 seconds silently
    const intervalId = setInterval(() => {
      fetchLeaveData(true);
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchLeaveData]);

  // Handles both Create and Update operations - REMOVED AS IT IS HANDLED IN LeaveApplicationForm

  // Handles deleting a leave request
  const handleDeleteRequest = async (id) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication failed.");
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const toastId = toast.loading("Deleting request...");
        try {
          await axios.delete(`${LEAVE_API_ENDPOINT}/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          toast.success("Leave request deleted successfully.", { id: toastId });
          await fetchLeaveData(true);
        } catch (err) {
          console.error("Error deleting request:", err);
          toast.error("Failed to delete request.", { id: toastId });
        }
      }
    });
  };

  // --- UI Handlers ---
  const handleEditClick = (leave) => {
    setEditingLeave(leave);
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setEditingLeave(null);
    setIsFormVisible(false);
  };

  const handleToggleForm = () => {
    if (isFormVisible && !editingLeave) {
      setIsFormVisible(false);
    } else {
      setEditingLeave(null);
      setIsFormVisible(true);
    }
  };

  return (
    <div className="container mx-auto">
      <Toaster position="top-center" reverseOrder={false} />

      <LeaveHistoryTable
        leaves={leaves}
        counts={counts}
        leaveTypesCount={leaveTypesCount}
        isLoading={isLoading}
        error={error}
        onRefresh={() => fetchLeaveData(false)} // Explicitly show loader on manual refresh
        onEdit={handleEditClick}
        onDelete={handleDeleteRequest}
        isFormVisible={isFormVisible}
        onToggleForm={handleToggleForm}
        editingLeaveId={editingLeave?.id}
      >
        <LeaveApplicationForm
          onSuccess={() => fetchLeaveData(true)}
          initialData={editingLeave}
          onClose={handleCloseForm}
        />
      </LeaveHistoryTable>
    </div>
  );
};

export default EmployeeDashboard;
