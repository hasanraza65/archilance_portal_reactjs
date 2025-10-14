import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom"; // ReactDOM ko import karein
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import Icon from "@/components/ui/Icon";

const getAuthToken = () => Cookies.get("token");

const getApiBasePathForRole = (role, basePath) => {
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

// --- YEH HELPER COMPONENT ADD KAREIN ---
// Yeh calendar ko body mein render karega
const PortalContainer = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};
// --- BADLAV KHATAM ---

const EditableProjectStartDate = ({
  projectId,
  currentStartDate,
  onDateUpdate,
  isEditable,
  userRole,
}) => {
  const [startDate, setStartDate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!currentStartDate) {
      setStartDate(null);
      return;
    }
    const dateObj = new Date(currentStartDate);
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      setStartDate(dateObj);
    } else {
      setStartDate(null);
    }
  }, [currentStartDate]);

  if (!isEditable) {
    const formattedDate = startDate
      ? startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";
    return (
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {formattedDate}
      </span>
    );
  }

  const handleDateChange = async (date) => {
    if (!date) return;
    setStartDate(date);
    setIsUpdating(true);
    const token = getAuthToken();
    if (!token) {
      Swal.fire("Error", "Authentication token not found.", "error");
      setIsUpdating(false);
      return;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    const apiPath = getApiBasePathForRole(userRole, `/project/${projectId}`);
    const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    try {
      await axios.put(
        `${VITE_BASE_URL}${apiPath}`,
        { start_date: formattedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onDateUpdate) {
        onDateUpdate();
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Start date updated!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Failed to update start date:", error);
      Swal.fire(
        "Failed!",
        error.response?.data?.message || "Could not update the start date.",
        "error"
      );
      const oldDateObj = new Date(currentStartDate);
      if (oldDateObj instanceof Date && !isNaN(oldDateObj)) {
        setStartDate(oldDateObj);
      } else {
        setStartDate(null);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-800/70 z-10 rounded">
          <Icon
            icon="eos-icons:loading"
            className="w-6 h-6 animate-spin text-slate-500"
          />
        </div>
      )}
      <DatePicker
        selected={startDate}
        onChange={handleDateChange}
        dateFormat="MMM d, yyyy"
        placeholderText="N/A"
        className="form-input w-full px-2 py-1 text-sm bg-transparent border-0 focus:ring-0 text-left cursor-pointer"
        popperPlacement="top-end"
        disabled={isUpdating}
        // --- YEH PROP ADD KAREIN ---
        popperContainer={PortalContainer}
        // --- BADLAV KHATAM ---
      />
    </div>
  );
};

export default EditableProjectStartDate;