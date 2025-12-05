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
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Heart,
  Briefcase,
} from "lucide-react";

const LeaveHistoryTable = ({
  children,
  leaves = [],
  counts = { total: 0, approved: 0, rejected: 0, pending: 0 },
  leaveTypesCount = { casual: 0, annual: 0, sick: 0 },
  isLoading,
  error,
  onRefresh,
  onEdit,
  onDelete,
  isFormVisible,
  onToggleForm,
  editingLeaveId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

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

  const leaveTypeConfig = {
    casual: {
      total: 10,
      label: "Casual Leaves",
      icon: Briefcase,
      color: "blue",
    },
    annual: {
      total: 10,
      label: "Annual Leaves",
      icon: FileText,
      color: "green",
    },
    sick: { total: 8, label: "Sick Leaves", icon: Heart, color: "purple" },
  };

  const leaveTypeColors = {
    casual: "bg-blue-100 text-blue-800",
    annual: "bg-green-100 text-green-800",
    sick: "bg-purple-100 text-purple-800",
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

  // --- UPDATED LOGIC: Excludes Weekends (Sat/Sun) ---
  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (endDate < startDate) return 0;

    let count = 0;
    let currentDate = new Date(startDate);

    // Loop through every day
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // 0 is Sunday, 6 is Saturday. We only count if it is NOT 0 and NOT 6.
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return count;
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const formatDisplayReason = (reason) => {
    if (!reason) return "";
    const otherReasonMatch = reason.match(/^\[Other - (.*?)]: (.*)$/s);
    if (otherReasonMatch) {
      return otherReasonMatch[2];
    }
    return reason;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Leave Management
                </h1>
                <p className="text-gray-600">
                  Track, apply for, and manage your leave requests
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {isLoading ? "..." : counts.total}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? "..." : counts.approved}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {isLoading ? "..." : counts.pending}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-600">
                    {isLoading ? "..." : counts.rejected}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Leave Balances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(leaveTypeConfig).map(([key, config]) => {
                const used = leaveTypesCount[key] || 0;
                const remaining = config.total - used;
                const percentage = (used / config.total) * 100;
                const Icon = config.icon;

                return (
                  <div
                    key={key}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-${config.color}-500`} />
                        <p className="text-md font-semibold text-gray-800">
                          {config.label}
                        </p>
                      </div>
                      <p className="font-bold text-lg text-gray-900">
                        {used}
                        <span className="text-sm font-medium text-gray-500">
                          /{config.total}
                        </span>
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <div
                        className={`bg-${config.color}-500 h-2.5 rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-right text-gray-500">
                      {remaining} days remaining
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-gray-200"
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
                  onClick={onToggleForm}
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

        <div
          className={`transition-all duration-700 ease-in-out overflow-hidden ${
            isFormVisible
              ? "max-h-[2000px] opacity-100 mb-8"
              : "max-h-0 opacity-0"
          }`}
        >
          {isFormVisible && children}
        </div>

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
                      Status & Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((leave) => {
                      const StatusIcon =
                        statusConfig[leave.status]?.icon || AlertCircle;
                      // Calculated using the new logic
                      const duration = calculateDuration(
                        leave.start_date,
                        leave.end_date
                      );
                      return (
                        <tr
                          key={leave.id}
                          className={`${
                            editingLeaveId === leave.id
                              ? "bg-blue-100"
                              : "hover:bg-blue-50/50"
                          } transition-all duration-300 group`}
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
                                {formatDisplayReason(leave.reason)}
                              </div>
                              {leave.leave_type && (
                                <span
                                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                                    leaveTypeColors[leave.leave_type] ||
                                    "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {capitalizeFirstLetter(leave.leave_type)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center justify-between">
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
                              <div className="flex items-center">
                                {leave.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => onEdit(leave)}
                                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors ml-2"
                                      aria-label="Edit Leave Request"
                                    >
                                      <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                      onClick={() => onDelete(leave.id)}
                                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                      aria-label="Delete Leave Request"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </>
                                )}
                              </div>
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
                              No requests match your criteria.
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
