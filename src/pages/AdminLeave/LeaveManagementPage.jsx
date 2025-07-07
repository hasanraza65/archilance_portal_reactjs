import React, { useState } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Filter, Search, Download, Plus } from 'lucide-react';

const initialLeaveRequests = [
  {
    id: 1,
    employeeName: 'Ali Khan',
    employeeId: 'EMP001',
    department: 'Engineering',
    startDate: '2024-07-25',
    endDate: '2024-07-27',
    reason: 'Family wedding',
    status: 'Pending',
    type: 'Personal',
    days: 3,
    appliedDate: '2024-07-20',
    avatar: 'AK'
  },
  {
    id: 2,
    employeeName: 'Fatima Ahmed',
    employeeId: 'EMP002',
    department: 'Marketing',
    startDate: '2024-08-01',
    endDate: '2024-08-02',
    reason: 'Medical checkup',
    status: 'Pending',
    type: 'Medical',
    days: 2,
    appliedDate: '2024-07-22',
    avatar: 'FA'
  },
  {
    id: 3,
    employeeName: 'Saad Malik',
    employeeId: 'EMP003',
    department: 'Sales',
    startDate: '2024-07-20',
    endDate: '2024-07-21',
    reason: 'Personal reason',
    status: 'Approved',
    type: 'Personal',
    days: 2,
    appliedDate: '2024-07-15',
    avatar: 'SM'
  },
  {
    id: 4,
    employeeName: 'Ayesha Bibi',
    employeeId: 'EMP004',
    department: 'HR',
    startDate: '2024-07-18',
    endDate: '2024-07-22',
    reason: 'Vacation',
    status: 'Rejected',
    type: 'Vacation',
    days: 5,
    appliedDate: '2024-07-10',
    avatar: 'AB'
  },
  {
    id: 5,
    employeeName: 'Hassan Ali',
    employeeId: 'EMP005',
    department: 'Finance',
    startDate: '2024-08-05',
    endDate: '2024-08-07',
    reason: 'Family emergency',
    status: 'Pending',
    type: 'Emergency',
    days: 3,
    appliedDate: '2024-07-28',
    avatar: 'HA'
  },
];

const LeaveManagementPage = () => {
  const [leaveRequests, setLeaveRequests] = useState(initialLeaveRequests);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleApprove = (id) => {
    setLeaveRequests(
      leaveRequests.map((req) =>
        req.id === id ? { ...req, status: 'Approved' } : req
      )
    );
  };

  const handleReject = (id) => {
    setLeaveRequests(
      leaveRequests.map((req) =>
        req.id === id ? { ...req, status: 'Rejected' } : req
      )
    );
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'Approved':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
          bgColor: 'bg-emerald-500'
        };
      case 'Rejected':
        return {
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
          bgColor: 'bg-red-500'
        };
      case 'Pending':
      default:
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle,
          bgColor: 'bg-amber-500'
        };
    }
  };

  const getLeaveTypeColor = (type) => {
    switch (type) {
      case 'Medical':
        return 'bg-blue-100 text-blue-800';
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Vacation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesFilter = filter === 'All' || request.status === filter;
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'Pending').length,
    approved: leaveRequests.filter(r => r.status === 'Approved').length,
    rejected: leaveRequests.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Leave Management Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Manage and track employee leave requests</p>
            </div>
            
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees or departments..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
              {['All', 'Pending', 'Approved', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests */}
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const statusConfig = getStatusConfig(request.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Employee Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {request.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{request.employeeName}</h3>
                          <span className="text-sm text-gray-500">ID: {request.employeeId}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {request.department}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {request.startDate} to {request.endDate}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.days} days
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLeaveTypeColor(request.type)}`}>
                            {request.type}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            Applied: {request.appliedDate}
                          </span>
                        </div>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                          <span className="font-medium">Reason:</span> {request.reason}
                        </p>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex flex-col items-center gap-4 lg:items-end">
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="font-medium">{request.status}</span>
                      </div>
                      
                      {request.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(request.id)}
                            className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(request.id)}
                            className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Status indicator bar */}
                <div className={`h-1 ${statusConfig.bgColor} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagementPage;