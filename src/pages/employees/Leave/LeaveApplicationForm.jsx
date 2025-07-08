import React, { useState } from "react";
import { Calendar, Clock, FileText, Send, User, Edit3 } from "lucide-react";

const LeaveApplicationForm = ({ onApplyLeave }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [otherLeaveType, setOtherLeaveType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed showSuccess and submitError states, as toasts will handle this.

  const leaveTypes = [
    { value: "sick", label: "Sick Leave" },
    { value: "vacation", label: "Vacation" },
    { value: "personal", label: "Personal Leave" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason || !startDate || !endDate || !leaveType) {
      // You can use a toast here too, or a simple alert.
      alert("Please fill in all required fields.");
      return;
    }
    if (leaveType === "other" && !otherLeaveType.trim()) {
      alert('Please specify the reason for the "Other" leave type.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalLeaveType = leaveType === "other" ? otherLeaveType : leaveType;
      // onApplyLeave will now handle the toast notifications
      await onApplyLeave({
        startDate,
        endDate,
        reason,
        leaveType: finalLeaveType,
      });

      // If onApplyLeave succeeds, reset the form
      setReason("");
      setStartDate("");
      setEndDate("");
      setLeaveType("");
      setOtherLeaveType("");
    } catch (error) {
      // The parent component already showed an error toast.
      // We just need to catch the error here so the form doesn't reset.
      console.log("Submission failed, form not reset.");
    } finally {
      // This runs after both success and failure
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-3xl border border-gray-200/50 shadow-inner">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leave Application
          </h1>
          <p className="text-gray-600">Submit your leave request with ease</p>
        </div>

        {/* Success and Error messages are now handled by toasts, so no need for divs here. */}

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center space-x-3 text-white">
              <User className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">
                  Employee Leave Request
                </h2>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* The form JSX remains the same, only the handler logic changed */}
            {/* ... (Your existing form fields JSX) ... */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Leave Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => setLeaveType(type.value)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      leaveType === type.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
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
                      <p className="font-medium text-gray-900">{type.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {leaveType === "other" && (
              <div className="space-y-3 pt-2 animate-fade-in-down">
                <label
                  htmlFor="otherLeaveType"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Please Specify
                </label>
                <input
                  type="text"
                  id="otherLeaveType"
                  value={otherLeaveType}
                  onChange={(e) => setOtherLeaveType(e.target.value)}
                  placeholder="e.g., Bereavement, Jury Duty"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  required
                />
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label
                  htmlFor="startDate"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-3">
                <label
                  htmlFor="endDate"
                  className="block text-sm font-semibold text-gray-700"
                >
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  required
                />
              </div>
            </div>
            <div className="space-y-3">
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-gray-700"
              >
                Reason for Leave
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                maxLength="200"
                placeholder="Please provide details..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
                required
              />
              <p className="text-sm text-gray-500 text-right">
                {reason.length}/200
              </p>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-105"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveApplicationForm;
