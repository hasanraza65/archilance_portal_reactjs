import React, { useState } from "react";
import {
  Calendar,
  Filter,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  X,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import LeaveApplicationForm from "./LeaveApplicationForm";

const LeaveHistoryTable = ({
  leaves = [],
  counts = {},
  onApplyLeave,
  isLoading,
  error,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isFormVisible, setIsFormVisible] = useState(false);

  // Colors should match the 'leave_type' values from your API
  const leaveTypeColors = {
    Vacation: "bg-blue-100 text-blue-800",
    Sick: "bg-purple-100 text-purple-800",
    Personal: "bg-indigo-100 text-indigo-800",
    Emergency: "bg-orange-100 text-orange-800",
  };

  const statusConfig = {
    Approved: {
      icon: CheckCircle,
      className:
        "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200",
      dotColor: "bg-green-400",
    },
    Rejected: {
      icon: XCircle,
      className:
        "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200",
      dotColor: "bg-red-400",
    },
    Pending: {
      icon: AlertCircle,
      className:
        "bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200",
      dotColor: "bg-yellow-400",
    },
  };

  const filteredLeaves = leaves.filter((leave) => {
    const searchLower = searchTerm.toLowerCase();
    const reasonMatch = leave.reason.toLowerCase().includes(searchLower);
    const typeMatch = leave.leave_type.toLowerCase().includes(searchLower);
    const statusMatch = statusFilter === "All" || leave.status === statusFilter;
    return (reasonMatch || typeMatch) && statusMatch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleApplyAndCloseForm = async (leaveData) => {
    try {
      await onApplyLeave(leaveData);
      setIsFormVisible(false); // Close form only on success
    } catch (error) {
      // If an error occurs, the form remains open for the user to correct
      console.log("Submit failed, keeping form open.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header and Dynamic Stats Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Leave Management
                </h1>
                <p className="text-gray-600">
                  Track and manage your leave requests
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Total Leaves
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : counts.total}
                </p>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {isLoading ? "..." : counts.approved}
                </p>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {isLoading ? "..." : counts.pending}
                </p>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {isLoading ? "..." : counts.rejected}
                </p>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
          {/* Filters and Apply Button */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by reason or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  >
                    <option value="All">All Status</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="w-full md:w-auto">
                <button
                  onClick={() => setIsFormVisible((prev) => !prev)}
                  className={`w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 shadow-lg ${
                    isFormVisible
                      ? "bg-gradient-to-r from-gray-500 to-gray-600"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  }`}
                >
                  {isFormVisible ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                  <span>
                    {isFormVisible ? "Close Form" : "Apply for Leave"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Form */}
        <div
          className={`transition-all duration-700 ease-in-out overflow-hidden ${
            isFormVisible
              ? "max-h-[2000px] opacity-100 mb-8"
              : "max-h-0 opacity-0"
          }`}
        >
          {isFormVisible && (
            <LeaveApplicationForm onApplyLeave={handleApplyAndCloseForm} />
          )}
        </div>

        {/* History Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center p-16">
                <RefreshCw className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                <p className="mt-4 text-gray-600">Loading leave history...</p>
              </div>
            ) : error ? (
              <div className="text-center p-16 bg-red-50 text-red-700 rounded-lg">
                <AlertTriangle className="w-12 h-12 mx-auto" />
                <p className="mt-4 font-semibold">Error</p>
                <p>{error}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Leave Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => {
                      const StatusIcon =
                        statusConfig[leave.status]?.icon || AlertCircle;
                      const duration = calculateDuration(
                        leave.start_date,
                        leave.end_date
                      );
                      return (
                        <tr
                          key={leave.id}
                          className="hover:bg-blue-50/50 transition-all duration-200 group"
                        >
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {formatDate(leave.start_date)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  to {formatDate(leave.end_date)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-purple-100 rounded-lg">
                                <Clock className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {duration} {duration === 1 ? "day" : "days"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  duration
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div>
                              <div className="font-medium text-gray-900 mb-2">
                                {leave.reason}
                              </div>
                              {leave.leave_type && (
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    leaveTypeColors[leave.leave_type] ||
                                    "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {leave.leave_type}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div
                              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm ${
                                statusConfig[leave.status]?.className ||
                                "bg-gray-100 text-gray-800"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  statusConfig[leave.status]?.dotColor ||
                                  "bg-gray-400"
                                }`}
                              ></div>
                              <StatusIcon className="w-4 h-4" />
                              {leave.status}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 bg-gray-100 rounded-full">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No leaves found
                            </h3>
                            <p className="text-gray-600">
                              {searchTerm || statusFilter !== "All"
                                ? "No results for this filter"
                                : "You have not applied for any leave yet."}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveHistoryTable;
