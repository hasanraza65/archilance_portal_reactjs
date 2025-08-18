import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";
import Icon from "@/components/ui/Icon";
import { FiLoader } from "react-icons/fi";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const STATUS_OPTIONS = ["To Do", "In Progress", "Done", "Cancelled"];

const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "done":
    case "completed":
      return "bg-green-100 text-green-700";
    case "in progress":
      return "bg-blue-100 text-blue-700";
    case "to do":
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getStatusSelectedBarColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "done" || s === "completed") return "bg-green-500";
  if (s.includes("progress")) return "bg-blue-500";
  if (s.includes("to do") || s.includes("pending")) return "bg-yellow-500";
  if (s.includes("cancel")) return "bg-red-500";
  return "bg-slate-500";
};

const EditableTaskStatus = ({
  taskId,
  currentStatus,
  onStatusUpdate,
  isEditable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224;
      let left = rect.left;
      if (rect.left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      setMenuPosition({
        top: rect.bottom + 4,
        left: left,
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        !buttonRef.current?.contains(event.target) &&
        !dropdownRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      calculatePosition();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [isOpen]);

  const handleSelectOption = async (newStatus) => {
    if (newStatus === currentStatus || isSaving) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);
    setIsOpen(false);

    try {
      const token = Cookies.get("token");
      const apiPath = getApiPrefix();
      const url = `${
        import.meta.env.VITE_BACKEND_BASE_URL
      }/api/${apiPath}/project-task/${taskId}`;

      const response = await axios.put(
        url,
        { task_status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      toast.success(response.data.message || "Status updated successfully!");
      if (onStatusUpdate) {
        onStatusUpdate();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayStatus = currentStatus || "To Do";

  return (
    <div className="relative">
      {isSaving ? (
        <div
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center ${getStatusClass(
            displayStatus
          )}`}
        >
          <FiLoader className="animate-spin" />
        </div>
      ) : isEditable ? (
        <>
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center ${getStatusClass(
              displayStatus
            )}`}
            aria-haspopup="true"
            aria-expanded={isOpen}
          >
            {displayStatus.toUpperCase()}
            <Icon
              icon="heroicons-outline:chevron-down"
              className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transform transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          {isOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
                className="fixed w-56 bg-white rounded-lg shadow-xl z-50 border dark:bg-slate-800 dark:border-slate-700 overflow-hidden py-1"
                onClick={(e) => e.stopPropagation()}
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center relative ${
                      displayStatus === option
                        ? "font-semibold text-blue-600 dark:text-blue-400"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {displayStatus === option && (
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(
                          option
                        )}`}
                      ></span>
                    )}
                    {displayStatus === option ? (
                      <Icon
                        icon="heroicons-solid:check"
                        className="w-4 h-4 mr-2.5 text-blue-600 dark:text-blue-400 shrink-0"
                      />
                    ) : (
                      <span className="w-4 h-4 mr-2.5 shrink-0"></span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusClass(
                        option
                      )}`}
                    >
                      {option}
                    </span>
                  </button>
                ))}
              </div>,
              document.body
            )}
        </>
      ) : (
        <div
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${getStatusClass(
            displayStatus
          )}`}
        >
          {displayStatus.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default EditableTaskStatus;