import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import { FiLoader } from "react-icons/fi";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const STATUS_OPTIONS = [
  // "To-Do",
  "On Hold", // Added On Hold
  "Backlog",
  "Awaiting Info",
  "In Progress",
  "In-house review",
  "Client Review",
  "Completed",
];

const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200";
    case "in progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "awaiting info":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "client review":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "in-house review":
      return "bg-pink-100 text-pink-800 border-pink-200";
    case "backlog":
      return "bg-slate-100 text-slate-800 border-slate-200";
    case "on hold": // Added On Hold case
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getStatusSelectedBarColor = (status) => {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "completed":
      return "bg-green-500";
    case "in progress":
      return "bg-blue-500";
    case "awaiting info":
      return "bg-yellow-500";
    case "client review":
      return "bg-orange-500";
    case "in-house review":
      return "bg-pink-500";
    case "backlog":
      return "bg-purple-500";

    case "on hold":
      return "bg-amber-500";
    default:
      return "bg-gray-500";
  }
};
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const EditableProjectStatus = ({
  projectId,
  currentStatus,
  onStatusUpdate,
  isEditable,

  token,
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
        buttonRef.current &&
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
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

    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("status", newStatus);
    //update-project-status
    try {
      const apiBaseUrl = getApiBasePathForRole("/update-project-status");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiBaseUrl}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.message || "Failed to update.");

      toast.success(responseData.message || "Status updated!");
      onStatusUpdate();
    } catch (error) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const displayStatus = currentStatus || "To-Do";

  return (
    <div className="relative">
      {isSaving ? (
        <div
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border flex items-center justify-center ${getStatusClass(
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
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1 flex items-center ${getStatusClass(
              displayStatus
            )}`}
            aria-haspopup="true"
            aria-expanded={isOpen}
            disabled={isSaving}
          >
            {displayStatus.toUpperCase()}
            <svg
              className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transform transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>

          {isOpen &&
            createPortal(
              <div
                ref={dropdownRef}
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                }}
                className="fixed w-56 bg-white rounded-lg shadow-xl z-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 overflow-y-auto max-h-60 py-1"
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
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusClass(
            displayStatus
          )}`}
        >
          {displayStatus.toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default EditableProjectStatus;
