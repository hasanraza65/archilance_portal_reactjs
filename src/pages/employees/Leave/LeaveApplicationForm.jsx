import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import Cookies from "js-cookie";
import { Calendar, Send, User, Edit3, X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
// Must stay in sync with ADDITIONAL_LEAVE_USER_IDS in the backend's
// employee/LeaveRequestController — the backend rejects `additional` from
// anyone not on ITS list, so offering the option here to someone the server
// doesn't allow makes the request fail validation.
// NOTE: user 177 was intentionally removed — they no longer get additional leaves.
const ADDITIONAL_LEAVE_USER_IDS = [109, 171, 22, 173, 50, 172, 147, 118, 35, 180, 114, 69, 182, 23, 26, 21, 128, 175, 139, 28, 58, 162];

// Without this, a Laravel validation failure is answered with a 302 redirect to
// an HTML page instead of a 422. axios follows it, resolves with a 200, and the
// form reports success while nothing was saved. See the create/update calls.
const JSON_HEADERS = { Accept: "application/json", "Content-Type": "application/json" };

const LeaveApplicationForm = ({ initialData, onClose, onSuccess, policy = null }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [otherLeaveType, setOtherLeaveType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!initialData;

  const user = useSelector((state) => state.auth.user);
  const joiningDate = user?.joining_date;
  const isEligibleForAdditional = ADDITIONAL_LEAVE_USER_IDS.includes(user?.id);

  const eligibility = useMemo(() => {
    if (!joiningDate) return { casual: false, annual: false };
    const join = new Date(joiningDate);
    const now = new Date();
    let months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
    if (now.getDate() < join.getDate()) months--;
    
    return {
      casual: months >= 1,
      annual: months >= 6,
    };
  }, [joiningDate]);

  // Leave Policy (1 Aug 2026): the selectable types and their eligibility come
  // from the backend so entitlement changes need no frontend release. The old
  // service-month rules below are the fallback for a pre-policy backend.
  const leaveTypes = useMemo(() => {
    if (policy?.entitlements) {
      // "additional" (BIM Team public-holiday compensation, its own 8-day
      // pool — separate from casual) is only present in entitlements for BIM
      // Team members, so the .filter() below naturally omits it otherwise.
      const ordered = ["casual", "additional", "annual", "sick", "marriage", "unpaid"];
      return [
        ...ordered
          .filter((key) => policy.entitlements[key])
          .map((key) => {
            const e = policy.entitlements[key];
            return {
              value: key,
              label: `${e.label} Leave`,
              isEligible: e.available !== false,
              note: e.note || null,
            };
          }),
        { value: "other", label: "Other (Specify)", isEligible: true },
      ];
    }

    return [
      { value: "casual", label: "Casual Leave", isEligible: eligibility.casual },
      { value: "annual", label: "Annual Leave", isEligible: eligibility.annual },
      { value: "sick", label: "Sick Leave", isEligible: true },
      { value: "other", label: "Other (Specify)", isEligible: true },
      ...(isEligibleForAdditional
        ? [{ value: "additional", label: "Additional Absences", isEligible: true }]
        : []),
    ];
  }, [policy, eligibility, isEligibleForAdditional]);

  /** Annual, Marriage and Unpaid consume weekends; Casual and Sick do not. */
  const unitForType = (type) =>
    policy?.entitlements?.[type]?.unit
      || (["annual", "marriage", "unpaid"].includes(type) ? "calendar_days" : "working_days");

  const handleResetForm = () => {
    setStartDate("");
    setEndDate("");
    setReason("");
    setLeaveType("");
    setOtherLeaveType("");
  };

  // --- Populate Form in Edit Mode ---
  useEffect(() => {
    if (isEditMode && initialData) {
      setStartDate(initialData.start_date || "");
      setEndDate(initialData.end_date || "");
      
      const type = initialData.leave_type?.toLowerCase() || "";
      const reasonText = initialData.reason || "";
      
      // Parse "Other" reason format if applicable
      const otherReasonMatch = reasonText.match(/^\[Other - (.*?)]: (.*)$/s);

      if (otherReasonMatch && type === 'casual') {
        setLeaveType('other');
        setOtherLeaveType(otherReasonMatch[1]);
        setReason(otherReasonMatch[2]);
      } else {
        const standardTypes = ["casual", "annual", "sick", "additional", "marriage", "unpaid"];
        if (standardTypes.includes(type)) {
          setLeaveType(type);
          setReason(reasonText);
          setOtherLeaveType("");
        } else {
          // Default fallback
          setLeaveType("casual");
          setReason(reasonText);
        }
      }
    } else {
      handleResetForm();
    }
  }, [initialData, isEditMode]);

  // --- LOGIC: Calculate Duration ---
  // Counted the way the selected type is counted: Annual, Marriage and Unpaid
  // consume weekends (per the policy), Casual and Sick count working days only.
  const calculateDuration = (start, end, unit = "working_days") => {
    if (!start || !end) return 0;

    const startDateObj = new Date(start);
    const endDateObj = new Date(end);

    if (endDateObj < startDateObj) return 0;

    if (unit === "calendar_days") {
      return Math.round((endDateObj - startDateObj) / 86400000) + 1;
    }

    let count = 0;
    let currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay();
      // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return count;
  };

  // --- MAIN SUBMISSION HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Basic Validation
    if (!reason || !startDate || !endDate || !leaveType) {
      Swal.fire({
        icon: 'warning',
        title: 'Incomplete Form',
        text: 'Please fill in all required fields.',
      });
      return;
    }

    if (leaveType === "other" && !otherLeaveType.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please specify the reason for the "Other" leave type.',
      });
      return;
    }
    
    // 2. Duration Check (Casual Limit) — "Other" is filed as Casual.
    // The backend enforces this and every other policy rule too; this is just a
    // faster, friendlier message before the round trip.
    if (leaveType === 'casual' || leaveType === 'other') {
      const maxConsecutive = policy?.rules?.casual_max_consecutive ?? 2;
      const duration = calculateDuration(startDate, endDate, "working_days");
      if (duration > maxConsecutive) {
        Swal.fire({
            icon: 'error',
            title: 'Policy Violation',
            text: `Casual leave cannot be for more than ${maxConsecutive} working days. You selected ${duration} working days. Please select Annual Leave instead.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    const token = Cookies.get("token");

    // 3. Prepare Payload
    const finalLeaveType = leaveType === "other" ? "casual" : leaveType;
    const finalReason = leaveType === "other"
      ? `[Other - ${otherLeaveType.trim()}]: ${reason}`
      : reason;

    const payload = {
        start_date: startDate,
        end_date: endDate,
        reason: finalReason,
        leave_type: finalLeaveType
    };

    try {
      // 4. Determine Endpoint (Create vs Edit)
      if (isEditMode) {
         await axios.put(
            `${API_BASE_URL}/api/employee/leave-request/${initialData.id}`,
            payload,
            { headers: { Authorization: `Bearer ${token}`, ...JSON_HEADERS } }
         );
      } else {
         await axios.post(
            `${API_BASE_URL}/api/employee/leave-request`,
            payload,
            { headers: { Authorization: `Bearer ${token}`, ...JSON_HEADERS } }
         );
      }

      // 5. Success Handling
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: isEditMode ? 'Leave request updated successfully.' : 'Leave request submitted successfully.',
        timer: 2000,
        showConfirmButton: false
      });
      
      if (!isEditMode) handleResetForm();
      if (onSuccess) onSuccess(); // Refresh parent list
      if (onClose) onClose(); // Close modal if applicable

    } catch (error) {
      console.error("Submission Error:", error);

      // --- 6. ROBUST ERROR HANDLING (Fixes "Stuck Submitting") ---
      if (error.response && error.response.data && error.response.data.message) {
        // This catches the "Limit Exceeded" message from backend
        Swal.fire({
            icon: 'error',
            title: 'Request Failed',
            text: error.response.data.message, // Shows: "You have exceeded your annual leave limit..."
            footer: 'Please check your leave balance.'
        });
      } else if (error.response?.data?.errors) {
        // Catches Validation Errors
        const firstError = Object.values(error.response.data.errors)[0][0];
        toast.error(firstError);
      } else {
        // Catches Network/Server Errors
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      // 7. ALWAYS Stop Loading
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-3xl">
      <Toaster position="top-right" />
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <Edit3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isEditMode ? "Edit Leave Request" : "New Leave Application"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update the details of your leave request."
              : "Fill out the form to apply for leave."}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
            <div className="flex items-center space-x-3 text-white">
              <User className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-semibold">Leave Request Details</h2>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Leave Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Leave Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {leaveTypes.map((type) => (
                  <div
                    key={type.value}
                    onClick={() => {
                      if (type.isEligible) {
                        setLeaveType(type.value);
                      } else {
                        toast.error(`${type.label} is available after ${type.value === 'casual' ? '1 month' : '6 months'} of joining.`);
                      }
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      !type.isEligible 
                        ? "opacity-50 grayscale bg-gray-50 cursor-not-allowed" 
                        : leaveType === type.value
                          ? "border-blue-500 bg-blue-50 cursor-pointer"
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="leaveType"
                        value={type.value}
                        checked={leaveType === type.value}
                        disabled={!type.isEligible}
                        onChange={(e) => {
                          if (type.isEligible) setLeaveType(e.target.value);
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <p className={`font-medium ${!type.isEligible ? "text-gray-400" : "text-gray-900"}`}>
                        {type.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Reason Input */}
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
                  placeholder="e.g., Bereavement"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            )}

            {/* Dates */}
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
                  min={isEditMode ? undefined : new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                  min={startDate || (isEditMode ? undefined : new Date().toISOString().split("T")[0])}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            {/* Reason */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <p className="text-sm text-gray-500 text-right">
                {reason.length}/200
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              {isEditMode && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                  <span>Cancel</span>
                </button>
              )}
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
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>{isEditMode ? "Updating..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>
                      {isEditMode ? "Update Request" : "Submit Request"}
                    </span>
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