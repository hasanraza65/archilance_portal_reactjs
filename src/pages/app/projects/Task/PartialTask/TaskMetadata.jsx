// src/components/TaskDetails/PartialTask/TaskMetadata.jsx
import React from "react";
import DOMPurify from "dompurify";
import {
  priorityUpdateOptions,
  getCurrentPriorityDetails,
  mapApiUserToLocal,
} from "./taskDetailsUtils";

const TaskMetadata = ({
  description,
  priority,
  dueDate,
  currentAssignees,
  onOpenAssigneeModal,
  isPriorityDropdownOpen,
  setIsPriorityDropdownOpen,
  priorityDropdownRef,
  handleUpdateTaskField,
  isEditable, 
}) => {
  const currentPriorityDisplay = getCurrentPriorityDetails(priority);

  const mappedAssignees = (currentAssignees || [])
    .map((assigneeLink) =>
      assigneeLink.user ? mapApiUserToLocal(assigneeLink.user) : null
    )
    .filter(Boolean);

  const MAX_DISPLAY_ASSIGNEES = 3;

  const sanitizedDescriptionHtml = DOMPurify.sanitize(description || "");
  const hasActualContent =
    sanitizedDescriptionHtml.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Description
        </h3>
        <div className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 break-words min-h-[60px] prose prose-sm max-w-none dark:prose-invert">
          {hasActualContent ? (
            <div
              dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }}
            />
          ) : (
            <span className="italic text-slate-400 dark:text-slate-500">
              No description provided
            </span>
          )}
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {/* --- PRIORITY SECTION --- */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Priority
          </h4>

          {/* ***** SUDHAAR: Role ke hisab se UI badlein ***** */}
          {isEditable ? (
            // --- ADMIN / EMPLOYEE VIEW (Clickable Dropdown) ---
            <div className="relative" ref={priorityDropdownRef}>
              <button
                onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-600/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                  isPriorityDropdownOpen
                    ? "bg-slate-200/60 dark:bg-slate-600/60"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
                aria-haspopup="true"
                aria-expanded={isPriorityDropdownOpen}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{currentPriorityDisplay.icon}</span>
                  <span
                    className={`font-semibold ${currentPriorityDisplay.colorClass}`}
                  >
                    {currentPriorityDisplay.displayLabel}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transform transition-transform duration-200 ${
                    isPriorityDropdownOpen ? "rotate-180" : ""
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
              {isPriorityDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 rounded-md shadow-lg z-30 border border-slate-200 dark:border-slate-700 overflow-y-auto max-h-60 py-1">
                  {priorityUpdateOptions.map((option) => (
                    <button
                      key={option.apiValue}
                      onClick={async () => {
                        await handleUpdateTaskField(
                          "priority",
                          option.apiValue
                        );
                        setIsPriorityDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center ${
                        priority === option.apiValue
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {priority === option.apiValue && (
                        <svg
                          className="w-3.5 h-3.5 mr-2 text-blue-600 dark:text-blue-400 shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className="text-sm mr-2 shrink-0">
                        {option.icon}
                      </span>
                      <span className={option.colorClass}>
                        {option.displayLabel}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // --- CUSTOMER VIEW (Static Label) ---
            <div className="w-full flex items-center space-x-2 p-2 rounded-md">
              <span className="text-lg">{currentPriorityDisplay.icon}</span>
              <span
                className={`font-semibold ${currentPriorityDisplay.colorClass}`}
              >
                {currentPriorityDisplay.displayLabel}
              </span>
            </div>
          )}
        </div>

        {/* --- DUE DATE SECTION --- */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Due Date
          </h4>
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <input
              type="date"
              value={
                dueDate ? new Date(dueDate).toISOString().split("T")[0] : ""
              }
              onChange={async (e) =>
                await handleUpdateTaskField("due_date", e.target.value || null)
              }
              // ***** SUDHAAR: Input ko disable karein agar user edit nahi kar sakta *****
              disabled={!isEditable}
              className="text-slate-700 dark:text-slate-300 font-medium bg-transparent border-0 focus:ring-0 p-0 w-full focus:outline-none appearance-none disabled:cursor-not-allowed"
            />
            {!dueDate && (
              <span className="text-slate-500 dark:text-slate-400 text-sm italic whitespace-nowrap">
                No due date
              </span>
            )}
          </div>
        </div>

        {/* --- ASSIGNEES SECTION --- */}
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Assignees
          </h4>
          <button
            type="button"
            onClick={onOpenAssigneeModal}
            // ***** SUDHAAR: Button ko disable karein aur "Click to manage" text hide karein *****
            disabled={!onOpenAssigneeModal}
            className="w-full flex items-center p-2 rounded-md hover:bg-slate-200/60 dark:hover:bg-slate-600/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors space-x-3 text-left disabled:cursor-not-allowed disabled:hover:bg-transparent dark:disabled:hover:bg-transparent"
            aria-label="Manage assignees"
          >
            {mappedAssignees.length > 0 ? (
              <>
                <div className="flex -space-x-2 overflow-hidden flex-shrink-0">
                  {mappedAssignees
                    .slice(0, MAX_DISPLAY_ASSIGNEES)
                    .map((assignee) =>
                      assignee.profilePic ? (
                        <img
                          key={assignee.id}
                          src={assignee.profilePic}
                          alt={assignee.name}
                          title={assignee.name}
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-50 dark:ring-slate-700 border-white dark:border-slate-800"
                        />
                      ) : (
                        <span
                          key={assignee.id}
                          title={assignee.name}
                          className={`w-8 h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-slate-50 dark:ring-slate-700 border-white dark:border-slate-800`}
                        >
                          {assignee.avatar}
                        </span>
                      )
                    )}
                </div>
                {mappedAssignees.length > MAX_DISPLAY_ASSIGNEES && (
                  <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-2 ring-slate-50 dark:ring-slate-700 border-white dark:border-slate-800">
                    +{mappedAssignees.length - MAX_DISPLAY_ASSIGNEES}
                  </span>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-slate-700 dark:text-slate-300 font-medium text-sm leading-tight truncate">
                    {mappedAssignees.length === 1
                      ? mappedAssignees[0].name
                      : `${mappedAssignees.length} Assignees`}
                  </span>
                  {onOpenAssigneeModal && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                      Click to manage
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-tight">
                    Unassigned
                  </span>
                  {onOpenAssigneeModal && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 leading-tight">
                      Click to assign
                    </span>
                  )}
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskMetadata;
