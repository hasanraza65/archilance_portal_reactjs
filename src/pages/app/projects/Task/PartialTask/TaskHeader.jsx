import React from "react";
import { useNavigate } from "react-router-dom";
import {
  statusUpdateOptions,
  getCurrentStatusDisplayLabel,
  getStatusClass,
  getStatusSelectedBarColor,
} from "./taskDetailsUtils";
import { Edit } from "lucide-react"; // Import Edit icon

const TaskHeader = ({
  taskTitle,
  taskStatus,
  isStatusDropdownOpen,
  setIsStatusDropdownOpen,
  statusDropdownRef,
  handleUpdateTaskField,
  isEditable,
  onEditTaskClick, // New prop for the edit button
}) => {
  const navigate = useNavigate();
  const currentStatusLabel = getCurrentStatusDisplayLabel(taskStatus);
  const currentStatusForNull = taskStatus === null ? "Todo" : taskStatus;

  return (
    <div className="bg-gradient-to-r from-blue-200 to-indigo-300 p-6">
      <div className="flex items-start justify-between">
        {/* Task Title aur Edit Icon ke liye flex container */}
        <div className="flex-1 flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800">{taskTitle}</h1>
          {/* Edit icon button */}
          {isEditable && onEditTaskClick && (
            <button
              type="button"
              onClick={onEditTaskClick}
              className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              title="Edit Task Details"
            >
              <Edit size={16} className="text-gray-600 dark:text-slate-300" />
            </button>
          )}
        </div>

        {isEditable ? (
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 flex items-center ${getStatusClass(
                taskStatus
              )}`}
              aria-haspopup="true"
              aria-expanded={isStatusDropdownOpen}
            >
              {currentStatusLabel.toUpperCase()}
              <svg
                className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transform transition-transform duration-200 ${
                  isStatusDropdownOpen ? "rotate-180" : ""
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
            {isStatusDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-30 border border-slate-200 overflow-y-auto max-h-60 py-1">
                {/* ***** SUDHAAR: Yahan button ko div se badal diya hai ***** */}
                <div
                  className={`w-full text-left px-3 py-2.5 text-sm flex items-center relative cursor-default ${
                    taskStatus === null
                      ? "font-semibold text-blue-600"
                      : "text-slate-700"
                  }`}
                >
                  {taskStatus === null && (
                    <span
                      className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(
                        null
                      )}`}
                    ></span>
                  )}
                  {taskStatus === null ? (
                    <svg
                      className="w-4 h-4 mr-2.5 text-blue-600 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="w-4 h-4 mr-2.5 shrink-0"></span>
                  )}
                  <span className="italic text-slate-500">
                    — Default (To-Do) —
                  </span>
                </div>
                <div className="border-t border-slate-100 my-1 mx-1"></div>
                {statusUpdateOptions.map((option) => (
                  <button
                    key={option.apiValue}
                    onClick={async () => {
                      await handleUpdateTaskField(
                        "task_status",
                        option.apiValue
                      );
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center relative ${
                      currentStatusForNull === option.apiValue
                        ? "font-semibold text-blue-600"
                        : "text-slate-700"
                    }`}
                  >
                    {currentStatusForNull === option.apiValue && (
                      <span
                        className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(
                          option.apiValue
                        )}`}
                      ></span>
                    )}
                    {currentStatusForNull === option.apiValue ? (
                      <svg
                        className="w-4 h-4 mr-2.5 text-blue-600 shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="w-4 h-4 mr-2.5 shrink-0"></span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusClass(
                        option.apiValue
                      )}`}
                    >
                      {option.displayLabel}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border ${getStatusClass(
              taskStatus
            )}`}
          >
            {currentStatusLabel.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskHeader;
