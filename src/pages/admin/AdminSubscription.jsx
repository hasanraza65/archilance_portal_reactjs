import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, CreditCard, AlertCircle, CheckCircle, XCircle, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { getMediaUrl } from "@/pages/utility/apiHelper";

const UserAvatar = ({ user }) => {
  const [hasError, setHasError] = useState(false);
  const { name, profile_pic } = user;

  useEffect(() => {
    setHasError(false);
  }, [profile_pic]);

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

  const shouldUseImage = profile_pic && !hasError;

  if (shouldUseImage) {
    return (
      <img
        src={getMediaUrl(profile_pic)}
        alt={name || 'Profile'}
        className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-lg flex-shrink-0"
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center shadow-lg flex-shrink-0">
      <span className="font-bold text-white text-sm">{initials}</span>
    </div>
  );
};

const AdminSubscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token' || name === 'auth_token' || name === 'bearer_token') {
        return value;
      }
    }
    return null;
  };

  const fetchSubscriptions = async (page = 1) => {
    try {
      setLoading(true);
      const token = getTokenFromCookie();
      
      if (!token) {
        throw new Error('Authorization token not found in cookies');
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/all_subscriptions?page=${page}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSubscriptions(data.subscriptions.data);
      setCurrentPage(data.subscriptions.current_page);
      setTotalPages(data.subscriptions.last_page);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions(currentPage);
  }, [currentPage]);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = sub.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.stripe_subscription_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm";
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-gradient-to-r from-green-400 to-green-500 text-white`;
      case 'canceled':
        return `${baseClasses} bg-gradient-to-r from-red-400 to-red-500 text-white`;
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-amber-400 to-amber-500 text-white`;
      default:
        return `${baseClasses} bg-gradient-to-r from-gray-400 to-gray-500 text-white`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'canceled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const getPlanName = (planId) => {
    switch (String(planId)) {
      case '1':
        return 'Standard';
      case '2':
        return 'Basic';
      case '3':
        return 'Hourly';
      default:
        return `Plan ID: ${planId}`;
    }
  };

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(sub => sub.status === 'active').length,
    canceled: subscriptions.filter(sub => sub.status === 'canceled').length,
    pending: subscriptions.filter(sub => sub.status === 'pending').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="w-16 h-16 border-4 border-blue-500 rounded-full animate-spin absolute top-0 left-0" style={{borderTopColor: 'transparent'}}></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => fetchSubscriptions(currentPage)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Subscription Management
                </h1>
                <p className="mt-2 text-gray-600">
                  Monitor and manage all user subscriptions from one place
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => fetchSubscriptions(currentPage)}
                  className="bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 p-3 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              </div>
              <div className="bg-gradient-to-r from-green-400 to-green-500 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Canceled</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.canceled}</p>
              </div>
              <div className="bg-gradient-to-r from-red-400 to-red-500 p-3 rounded-full">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</p>
                <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pending}</p>
              </div>
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-3 rounded-full">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or subscription ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium min-w-[160px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="canceled">Canceled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                    User
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                    Subscription
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/6">
                    Duration
                  </th>
                  <th className="px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-1/6">
                    Billing
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredSubscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                    <td className="px-3 py-4">
                      <div className="flex items-center">
                        <UserAvatar user={subscription.user} />
                        <div className="ml-3 min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900 truncate">
                            {subscription.user.name}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {subscription.user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {getPlanName(subscription.plan_id)}
                      </div>
                      <div className="text-xs text-gray-600 font-mono truncate">
                        {subscription.stripe_subscription_id}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(subscription.status)}
                        <span className={`ml-2 ${getStatusBadge(subscription.status)}`}>
                          {subscription.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate">Start: {formatDate(subscription.starts_at)}</div>
                          <div className="text-gray-500 truncate">End: {formatDate(subscription.ends_at)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-600">
                      {subscription.billing_detail ? (
                        <div className="flex items-center space-x-2">
                          <div className="bg-gradient-to-r from-green-400 to-green-500 p-1.5 rounded-full flex-shrink-0">
                            <CreditCard className="h-3 w-3 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{subscription.billing_detail.first_name} {subscription.billing_detail.last_name}</div>
                            <div className="text-gray-500 truncate">{subscription.billing_detail.company}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No billing info</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubscriptions.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No subscriptions found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters to find what you\'re looking for' 
                  : 'No subscriptions have been created yet. They will appear here once users start subscribing.'}
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-white rounded-2xl shadow-lg mt-6 border border-gray-100">
            <div className="flex items-center">
              <p className="text-sm font-medium text-gray-700">
                Showing page <span className="font-bold text-blue-600">{currentPage}</span> of <span className="font-bold text-blue-600">{totalPages}</span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSubscription;