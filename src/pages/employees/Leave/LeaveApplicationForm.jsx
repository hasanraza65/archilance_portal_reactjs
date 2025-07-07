import React, { useState } from 'react';
import { Calendar, Clock, FileText, Send, CheckCircle, User, Edit3 } from 'lucide-react';

const LeaveApplicationForm = ({ onApplyLeave }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [leaveType, setLeaveType] = useState('');
  // Added: State for the custom "Other" leave type reason
  const [otherLeaveType, setOtherLeaveType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave', color: 'bg-red-100 text-red-800' },
    { value: 'vacation', label: 'Vacation', color: 'bg-green-100 text-green-800' },
    { value: 'personal', label: 'Personal Leave', color: 'bg-blue-100 text-blue-800' },
    // Added: "Other" option
    { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Changed: Updated validation logic
    if (!reason || !startDate || !endDate || !leaveType) {
      alert('Please fill in all required fields.');
      return;
    }

    // Added: Validation for the "Other" field
    if (leaveType === 'other' && !otherLeaveType.trim()) {
      alert('Please specify the reason for "Other" leave type.');
      return;
    }
    
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Changed: Determine the final leave type to submit
    const finalLeaveType = leaveType === 'other' ? otherLeaveType : leaveType;
    onApplyLeave({ startDate, endDate, reason, leaveType: finalLeaveType });
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      setLeaveType('');
      // Added: Reset the "Other" leave type state
      setOtherLeaveType('');
    }, 2000);
    
    setIsSubmitting(false);
  };

  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start > end) return 0; // Prevent negative days
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Leave Application</h1>
          <p className="text-gray-600">Submit your leave request with ease</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3 animate-pulse">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-green-800 font-medium">Leave request submitted successfully!</p>
              <p className="text-green-600 text-sm">Your manager will review your request soon.</p>
            </div>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center space-x-3 text-white">
              <User className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Employee Leave Request</h2>
                <p className="text-blue-100 text-sm">Fill out the form below to apply for leave</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Leave Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <FileText className="inline w-4 h-4 mr-2" />
                Leave Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setLeaveType(type.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      leaveType === type.value
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="leaveType"
                        value={type.value}
                        checked={leaveType === type.value}
                        onChange={(e) => setLeaveType(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{type.label}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${type.color}`}>
                          {type.value.charAt(0).toUpperCase() + type.value.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Added: Conditional input for "Other" leave type */}
            {leaveType === 'other' && (
              <div className="space-y-3 pt-2 animate-fade-in-down">
                <label htmlFor="otherLeaveType" className="block text-sm font-semibold text-gray-700">
                  <Edit3 className="inline w-4 h-4 mr-2" />
                  Please Specify
                </label>
                <input
                  type="text"
                  id="otherLeaveType"
                  value={otherLeaveType}
                  onChange={(e) => setOtherLeaveType(e.target.value)}
                  placeholder="e.g., Bereavement, Jury Duty"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            )}


            {/* Date Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Duration Display */}
            {calculateDays() > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Duration: {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="space-y-3">
              <label htmlFor="reason" className="block text-sm font-semibold text-gray-700">
                <FileText className="inline w-4 h-4 mr-2" />
                Reason for Leave
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                maxLength="200"
                placeholder="Please provide details about your leave request..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                required
              />
              <p className="text-sm text-gray-500 text-right">
                {reason.length}/200
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105 hover:shadow-lg'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Submit Leave Request</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationForm;