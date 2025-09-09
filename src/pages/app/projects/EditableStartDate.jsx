import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import Icon from "@/components/ui/Icon";

const getAuthToken = () => Cookies.get("token");

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

const EditableStartDate = ({ taskId, currentStartDate, onDateUpdate, isEditable }) => {
  const [startDate, setStartDate] = useState(currentStartDate ? new Date(currentStartDate) : null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStartDate(currentStartDate ? new Date(currentStartDate) : null);
  }, [currentStartDate]);

  if (!isEditable) {
    const formattedDate = startDate
      ? startDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
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

    const formattedDate = date.toISOString().split('T')[0];
    const apiPath = getApiBasePathForRole(`/project-task/${taskId}`);
    const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

    try {
      // Assuming the API accepts a 'start_date' or similar field.
      // If your API uses 'created_at', be aware this might have other implications.
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
        position: 'top-end',
        icon: 'success',
        title: 'Start date updated successfully!',
        showConfirmButton: false,
        timer: 1500
      });

    } catch (error) {
      console.error("Failed to update start date:", error);
      Swal.fire("Failed!", error.response?.data?.message || "Could not update the start date.", "error");
      setStartDate(currentStartDate ? new Date(currentStartDate) : null);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {isUpdating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-slate-800/70 z-10 rounded">
          <Icon icon="eos-icons:loading" className="w-6 h-6 animate-spin text-slate-500" />
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
      />
    </div>
  );
};

export default EditableStartDate;