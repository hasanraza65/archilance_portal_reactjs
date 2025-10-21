import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { Toaster, toast } from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  RefreshCw,
  AlertTriangle,
  Trash2,
  X,
  Download,
  BarChart3,
} from "lucide-react";

// --- Helper Functions ---
const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const getAuthToken = () => Cookies.get("token");

const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const calculateDuration = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (endDate < startDate) return 0;
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getStatusText = (count) => {
  if (count >= 5) return "Good";
  if (count >= 2) return "Low";
  return "Critical";
};

// --- Employee Detail Modal Component (Clean Version) ---
const EmployeeLeaveDetailModal = ({ employee, isOpen, onClose }) => {
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmployeeLeaveDetails = useCallback(async () => {
    if (!employee || !isOpen) return;
    setIsLoading(true);
    const token = getAuthToken();
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/leave-request/${employee.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setLeaveSummary(response.data.leave_summary);
      setCycle(response.data.cycle);
    } catch (err) {
      console.error("Error fetching employee leave details:", err);
      toast.error("Failed to load employee leave details.");
    } finally {
      setIsLoading(false);
    }
  }, [employee, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployeeLeaveDetails();
    }
  }, [fetchEmployeeLeaveDetails, isOpen]);

  if (!isOpen) return null;

  const leaveTypes = [
    { key: "casual", name: "Casual Leave", total: 10 },
    { key: "annual", name: "Annual Leave", total: 15 },
    { key: "sick", name: "Sick Leave", total: 7 },
  ];

  return (
    <div className="fixed inset-0 bg-transparent bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[70vh] flex flex-col transform transition-all duration-300">
        <div className="flex-grow overflow-y-auto p-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-md">
              {employee.profile_pic ? (
                <img
                  src={`${API_BASE_URL}/storage/${employee.profile_pic}`}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-bold text-2xl">
                  {employee.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "N/A"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">
                {employee.name}
              </h3>
              <p className="text-gray-500">{employee.email}</p>
              <p className="text-sm font-medium text-gray-600 capitalize mt-1 px-2 py-0.5 bg-gray-100 border border-gray-200 rounded-full inline-block">
                {employee.employee_type?.toLowerCase()}
              </p>
            </div>
          </div>
          {cycle && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Current Leave Cycle
              </p>
              <p className="font-bold text-gray-900 text-md">
                {formatDate(cycle.start)} - {formatDate(cycle.end)}
              </p>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Remaining Leaves
            </h3>
            {isLoading ? (
              <div className="text-center py-10">
                <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
                <p className="mt-3 text-gray-500">Loading leave details...</p>
              </div>
            ) : leaveSummary ? (
              <div className="space-y-3">
                {leaveTypes.map((type) => {
                  const remaining = leaveSummary[type.key] || 0;
                  const progress =
                    type.total > 0 ? (remaining / type.total) * 100 : 0;
                  return (
                    <div
                      key={type.key}
                      className="bg-white border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="font-semibold text-gray-800 text-md">
                            {type.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-lg">
                            {remaining}
                          </span>
                          <span className="text-gray-500 text-sm">
                            days left
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gray-700 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">0 days</span>
                          <span className="text-xs font-medium text-gray-600">{`Status: ${getStatusText(
                            remaining
                          )}`}</span>
                          <span className="text-xs text-gray-500">
                            {type.total} days
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
                <AlertTriangle className="w-10 h-10 mx-auto text-gray-400" />
                <p className="mt-3 text-gray-500">No leave data available.</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-3 bg-white text-gray-800 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-sm"
          >
            Close
          </button>
          <button
            onClick={() => toast.success("Export feature coming soon!")}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-black transition-colors shadow-sm"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const LeaveManagementPage = () => {
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
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const ADMIN_LEAVE_API_URL = `${API_BASE_URL}/api/admin/leave-request`;

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

  useEffect(() => {
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleStatusUpdate = async (id, newStatus) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication failed.");
      return;
    }
    const toastId = toast.loading(`Updating status to ${newStatus}...`);
    const formData = new FormData();
    formData.append("status", newStatus);
    formData.append("_method", "put");
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

  const handleDeleteRequest = (id) => {
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
          await axios.delete(`${ADMIN_LEAVE_API_URL}/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          });
          toast.success("Leave request deleted.", { id: toastId });
          await fetchLeaveRequests();
        } catch (err) {
          console.error("Error deleting request:", err);
          toast.error("Failed to delete request.", { id: toastId });
        }
      }
    });
  };

  const handleEmployeeNameClick = (employee) => {
    setSelectedEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedEmployee(null);
  };

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
      default:
        return {
          color: "bg-amber-50 text-amber-700 border-amber-200",
          icon: AlertCircle,
          bgColor: "bg-amber-500",
        };
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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" reverseOrder={false} />
      <EmployeeLeaveDetailModal
        employee={selectedEmployee}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Leave Requests
              </h1>
              <p className="text-gray-500 mt-1">
                Manage and track employee leave requests.
              </p>
            </div>
            <button
              onClick={fetchLeaveRequests}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
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
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-10">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
              <p className="mt-3 text-gray-500">Loading Requests...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 bg-red-50 text-red-700 rounded-lg p-4">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="mt-2 font-semibold">Error Loading Data</p>
              <p>{error}</p>
            </div>
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                            {request.user?.profile_pic ? (
                              <img
                                src={`${API_BASE_URL}/storage/${request.user.profile_pic}`}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              // --- THIS WAS THE BUGGY PART, NOW FIXED ---
                              <span className="text-white font-bold text-lg">
                                {request.user && request.user.name
                                  ? request.user.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                  : "N/A"}
                              </span>
                            )}
                          </div>
                          <div>
                            <button
                              onClick={() =>
                                handleEmployeeNameClick(request.user)
                              }
                              className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors text-left"
                            >
                              {request.user?.name || "Unknown Employee"}
                            </button>
                            <p className="text-sm text-gray-500">
                              {request.user?.email || "No email"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {formatDate(request.start_date)} to{" "}
                              {formatDate(request.end_date)}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {calculateDuration(
                                request.start_date,
                                request.end_date
                              )}{" "}
                              days
                            </div>
                          </div>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded-md border break-words">
                            <span className="font-medium">Reason:</span>{" "}
                            {request.reason}
                          </p>
                        </div>
                      </div>
                      <div className="w-full md:w-auto flex flex-col items-stretch md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                        <div
                          className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-full text-sm ${statusConfig.color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          <span className="font-medium">{request.status}</span>
                        </div>
                        <div className="flex gap-2 w-full justify-end">
                          {request.status === "Pending" ? (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(request.id, "Approved")
                                }
                                className="flex-1 md:flex-none bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(request.id, "Rejected")
                                }
                                className="flex-1 md:flex-none bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-sm"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="w-full md:w-auto flex items-center justify-center gap-2 bg-gray-500 text-white px-3 py-1.5 rounded-md hover:bg-gray-600 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800">
                No Requests Found
              </h3>
              <p className="text-gray-500">
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
