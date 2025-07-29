// src/pages/projects/EditableProjectStatus.js (Final Corrected Code)

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";
import { FiLoader } from "react-icons/fi";

// --- Utility functions (No changes here) ---
const STATUS_OPTIONS = ["In Progress", "Pending", "Completed", "Cancelled", "Backlog"];
const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done") return "bg-green-100 text-green-800 border-green-200";
  if (s.includes("progress")) return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("pending")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
  if (s.includes("backlog")) return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
};
const getStatusSelectedBarColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done") return "bg-green-500";
  if (s.includes("progress")) return "bg-blue-500";
  if (s.includes("pending")) return "bg-yellow-500";
  if (s.includes("cancel")) return "bg-red-500";
  if (s.includes("backlog")) return "bg-purple-500";
  return "bg-slate-500";
};

// --- The Component ---

const EditableProjectStatus = ({
  projectId,
  currentStatus,
  onStatusUpdate,
  isEditable,
  apiBaseUrl,
  apiPath,
  token,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // === YAHAN POSITION CALCULATION KO THEEK KIYA GAYA HAI ===
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56
      
      let left = rect.left;
      // Agar menu screen se bahar ja raha hai, to usko left side shift karo
      if (rect.left + menuWidth > window.innerWidth) {
        left = window.innerWidth - menuWidth - 8;
      }
      
      // `position: fixed` ke liye, `getBoundingClientRect` ki values hi kaafi hain.
      // ScrollY add karne ki zaroorat nahi hai.
      setMenuPosition({
        top: rect.bottom + 4, // Button ke 4px neeche
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
      calculatePosition(); // Position calculate karein
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", calculatePosition);
      window.addEventListener("scroll", calculatePosition, true); // Scroll par bhi update karein
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

    try {
      const response = await fetch(`${apiBaseUrl}${apiPath}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });
      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.message || "Failed to update.");
      
      toast.success(responseData.message || "Status updated!");
      onStatusUpdate();
      
    } catch (error) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      {isSaving ? (
        <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border flex items-center justify-center ${getStatusClass(currentStatus)}`}>
            <FiLoader className="animate-spin" />
        </div>
      ) : (
        isEditable ? (
          <>
            <button
              ref={buttonRef}
              onClick={() => setIsOpen((prev) => !prev)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1  flex items-center ${getStatusClass(currentStatus)}`}
              aria-haspopup="true"
              aria-expanded={isOpen}
              disabled={isSaving}
            >
              {(currentStatus || "Unknown").toUpperCase()}
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {isOpen && createPortal(
              <div
                ref={dropdownRef}
                style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
                className="fixed w-56 bg-white rounded-lg shadow-xl z-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 overflow-y-auto max-h-60 py-1"
                onClick={(e) => e.stopPropagation()}
              >
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center relative ${currentStatus === option ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    {currentStatus === option && (<span className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(option)}`}></span>)}
                    {currentStatus === option ? (
                      <Icon icon="heroicons-solid:check" className="w-4 h-4 mr-2.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (<span className="w-4 h-4 mr-2.5 shrink-0"></span>)}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusClass(option)}`}>
                      {option}
                    </span>
                  </button>
                ))}
              </div>,
              document.body
            )}
          </>
        ) : (
          <div className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusClass(currentStatus)}`}>
            {(currentStatus || "Unknown").toUpperCase()}
          </div>
        )
      )}
    </div>
  );
};

export default EditableProjectStatus;