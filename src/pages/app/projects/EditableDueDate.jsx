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

const EditableDueDate = ({ taskId, currentDueDate, onDateUpdate, isEditable }) => {
  const [dueDate, setDueDate] = useState(currentDueDate ? new Date(currentDueDate) : null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setDueDate(currentDueDate ? new Date(currentDueDate) : null);
  }, [currentDueDate]);

  if (!isEditable) {
    const formattedDate = dueDate 
      ? dueDate.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) 
      : "N/A";
    return <span>{formattedDate}</span>;
  }

  const handleDateChange = async (date) => {
    if (!date) return;
    setDueDate(date);
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
      await axios.put(
        `${VITE_BASE_URL}${apiPath}`,
        { due_date: formattedDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onDateUpdate) {
        onDateUpdate(taskId, formattedDate);
      }

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Due date updated successfully!',
        showConfirmButton: false,
        timer: 1500
      });

    } catch (error) {
      console.error("Failed to update due date:", error);
      Swal.fire("Failed!", error.response?.data?.message || "Could not update the due date.", "error");
      setDueDate(currentDueDate ? new Date(currentDueDate) : null);
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
        selected={dueDate}
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

export default EditableDueDate;