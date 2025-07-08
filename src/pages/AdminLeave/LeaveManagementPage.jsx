import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Toaster, toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
} from "lucide-react";

// --- Helper Functions ---
const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

// Gets the authentication token from cookies
const getAuthToken = () => {
  return Cookies.get("token"); // Assumes the admin token is stored with this key
};

// Formats a date string into a more readable format
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Calculates the duration of the leave in days
const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate < startDate) return 0;
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

// --- Main Component ---
const LeaveManagementPage = () => {
  // --- State Management ---
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const ADMIN_LEAVE_API_URL = `${API_BASE_URL}/api/admin/leave-request`;

  // --- API Calls ---

  // Fetches all leave requests from the admin endpoint
  const fetchLeaveRequests = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Authentication failed. Please log in as an admin.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(ADMIN_LEAVE_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      setLeaveRequests(response.data.data || []);
      setStats(
        response.data.counts || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );
      setError(null);
    } catch (err) {
      console.error("Error fetching leave requests:", err);
      setError("Could not fetch leave requests. Please try again later.");
      toast.error("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, [ADMIN_LEAVE_API_URL]);

  // Calls the fetch function when the component mounts
  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  // Updates the status of a specific leave request (Approve/Reject)
  const handleStatusUpdate = async (id, newStatus) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication failed.");
      return;
    }

    const toastId = toast.loading(`Updating status to ${newStatus}...`);

    const formData = new FormData();
    formData.append("status", newStatus);
    formData.append("_method", "put"); // Method spoofing for Laravel backend

    try {
      await axios.post(`${ADMIN_LEAVE_API_URL}/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      toast.success("Status updated successfully!", { id: toastId });
      await fetchLeaveRequests();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status.", { id: toastId });
    }
  };

  // Deletes a leave request with a confirmation dialog
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
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const toastId = toast.loading("Deleting request...");
        try {
          await axios.delete(`${ADMIN_LEAVE_API_URL}/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });

          toast.success("Leave request deleted successfully.", { id: toastId });
          await fetchLeaveRequests();
        } catch (err) {
          console.error("Error deleting request:", err);
          toast.error("Failed to delete request.", { id: toastId });
        }
      }
    });
  };

  // --- UI Helper Functions & Filtering ---

  const getStatusConfig = (status) => {
    switch (status) {
      case "Approved":
        return {
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
          bgColor: "bg-emerald-500",
        };
      case "Rejected":
        return {
          color: "bg-red-50 text-red-700 border-red-200",
          icon: XCircle,
          bgColor: "bg-red-500",
        };
      case "Pending":
      default:
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: AlertCircle,
          bgColor: "bg-amber-500",
        };
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case "Sick":
        return "bg-red-100 text-red-800";
      case "Medical":
        return "bg-blue-100 text-blue-800";
      case "Emergency":
        return "bg-orange-100 text-orange-800";
      case "Vacation":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredRequests = leaveRequests.filter((request) => {
    const matchesFilter = filter === "All" || request.status === filter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (request.user &&
        (request.user.name.toLowerCase().includes(searchLower) ||
          request.user.email.toLowerCase().includes(searchLower)));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Leave Management Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and track employee leave requests
              </p>
            </div>
            <button
              onClick={fetchLeaveRequests}
              disabled={isLoading}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-700 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Total Requests
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.pending}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.approved}
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : stats.rejected}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
              <p className="mt-4 text-gray-600">Loading Requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-red-50 text-red-700 rounded-lg p-6">
              <AlertTriangle className="w-12 h-12 mx-auto" />
              <p className="mt-4 font-semibold">Error Loading Data</p>
              <p>{error}</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              const userAvatar = request.user?.profile_pic ? (
                <img
                  src={`${API_BASE_URL}/storage/${request.user.profile_pic}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {request.user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "N/A"}
                </span>
              );

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                          {userAvatar}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">
                            {request.user?.name || "Unknown Employee"}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">
                            {request.user?.email || "No email provided"}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-500" />{" "}
                              {formatDate(request.start_date)} to{" "}
                              {formatDate(request.end_date)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-500" />{" "}
                              {calculateDuration(
                                request.start_date,
                                request.end_date
                              )}{" "}
                              days
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getLeaveTypeColor(
                                request.leave_type
                              )}`}
                            >
                              {request.leave_type}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                              Applied: {formatDate(request.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <span className="font-medium">Reason:</span>{" "}
                            {request.reason}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4 lg:items-end w-full lg:w-auto self-stretch lg:self-center">
                        <div
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.color} mt-2 lg:mt-0`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span className="font-medium">{request.status}</span>
                        </div>
                        <div className="flex gap-2 w-full justify-end mt-auto">
                          {request.status === "Pending" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(request.id, "Approved")
                                }
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(request.id, "Rejected")
                                }
                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                              aria-label="Delete Request"
                            >
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`h-1.5 ${statusConfig.bgColor}`}></div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Requests Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveManagementPage;
