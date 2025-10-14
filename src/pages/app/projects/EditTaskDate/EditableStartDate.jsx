import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Cookies from "js-cookie";
import ReactDOM from "react-dom";
import Swal from "sweetalert2";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import Icon from "@/components/ui/Icon";

const getAuthToken = () => Cookies.get("token");

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};
const PortalContainer = ({ children }) => {
  return ReactDOM.createPortal(children, document.body);
};

const EditableStartDate = ({
  taskId,
  currentStartDate,
  onDateUpdate,
  isEditable,
}) => {
  const [startDate, setStartDate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // --- YAHAN SAHI CHECK ADD KIYA GAYA HAI ---
  useEffect(() => {
    if (!currentStartDate) {
      setStartDate(null);
      return;
    }
    // Seedha prop se date banayein, bina kuch jode
    const dateObj = new Date(currentStartDate);

    // Check karein ki date valid hai
    if (dateObj instanceof Date && !isNaN(dateObj)) {
      setStartDate(dateObj);
    } else {
      setStartDate(null);
    }
  }, [currentStartDate]);
  // --- BADLAV KHATAM ---

  if (!isEditable) {
    const formattedDate = startDate
      ? startDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "N/A";
    return <span>{formattedDate}</span>;
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
    const apiPath = getApiBasePathForRole(`/project-task/${taskId}`);
    const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
    try {
      await axios.put(
        `${VITE_BASE_URL}${apiPath}`,
        { start_date: formattedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onDateUpdate) {
        onDateUpdate(taskId, formattedDate);
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
        error.response?.data?.message || "Could not update start date.",
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
        className="form-input w-full px-2 py-2 text-sm bg-transparent border-0 focus:ring-0 text-left cursor-pointer"
        popperPlacement="top-end"
        disabled={isUpdating}
         popperContainer={PortalContainer}
      />
    </div>
  );
};

export default EditableStartDate;
