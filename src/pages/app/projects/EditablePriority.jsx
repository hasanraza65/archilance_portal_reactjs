import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { FiLoader } from "react-icons/fi";
import axios from "axios";
import Cookies from "js-cookie";
import Icon from "@/components/ui/Icon";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import {
  priorityUpdateOptions,
  getCurrentPriorityDetails,
} from "@/pages/app/projects/Task/PartialTask/taskDetailsUtils";

// Inline priority editor — mirrors EditableTaskStatus. Persists via
// PUT /{role}/project-task/{id} with { priority }.
const getPillClass = (priority) => {
  switch (String(priority || "").toLowerCase()) {
    case "urgent":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "normal":
    case "medium":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "low":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const EditablePriority = ({
  taskId,
  currentPriority,
  onPriorityUpdate,
  isEditable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const details = getCurrentPriorityDetails(currentPriority);

  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 200;
      let left = rect.left;
      if (rect.left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      setMenuPosition({ top: rect.bottom + 4, left });
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

  const handleSelect = async (newPriority) => {
    if (newPriority === currentPriority || isSaving) {
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
      await axios.put(
        url,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      toast.success("Priority updated!");
      if (onPriorityUpdate) onPriorityUpdate(taskId, newPriority);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update priority.");
    } finally {
      setIsSaving(false);
    }
  };

  const pill = (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${getPillClass(
        currentPriority
      )}`}
    >
      <span className="text-[11px] leading-none">{details.icon}</span>
      {details.displayLabel}
    </span>
  );

  if (isSaving) {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getPillClass(
          currentPriority
        )}`}
      >
        <FiLoader className="animate-spin" />
      </span>
    );
  }

  if (!isEditable) return pill;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((p) => !p);
        }}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1 ${getPillClass(
          currentPriority
        )}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-[11px] leading-none">{details.icon}</span>
        {details.displayLabel}
        <svg
          className={`w-3 h-3 ml-0.5 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
            className="fixed w-48 bg-white rounded-lg shadow-xl z-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            {priorityUpdateOptions.map((option) => (
              <button
                key={option.apiValue}
                onClick={() => handleSelect(option.apiValue)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 ${
                  String(currentPriority).toLowerCase() ===
                  option.apiValue.toLowerCase()
                    ? "font-semibold"
                    : ""
                }`}
              >
                {String(currentPriority).toLowerCase() ===
                option.apiValue.toLowerCase() ? (
                  <Icon
                    icon="heroicons-solid:check"
                    className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0"
                  />
                ) : (
                  <span className="w-4 h-4 shrink-0" />
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${getPillClass(
                    option.apiValue
                  )}`}
                >
                  <span className="text-[11px] leading-none">{option.icon}</span>
                  {option.displayLabel}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

export default EditablePriority;
