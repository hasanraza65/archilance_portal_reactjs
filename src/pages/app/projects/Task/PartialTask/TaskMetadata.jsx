// src/components/TaskDetails/TaskMetadata.jsx
import React from "react";
import {
  priorityUpdateOptions,
  getCurrentPriorityDetails,
  mapApiUserToLocal,
} from "./taskDetailsUtils";

const TaskMetadata = ({
  description,
  priority,
  dueDate,
  assignee,
  isPriorityDropdownOpen,
  setIsPriorityDropdownOpen,
  priorityDropdownRef,
  handleUpdateTaskField,
}) => {
  const currentPriorityDisplay = getCurrentPriorityDetails(priority);
  const mappedAssignee = assignee ? mapApiUserToLocal(assignee) : null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
        <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4">
          {description || "No description provided"}
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</h4>
          <div className="relative" ref={priorityDropdownRef}>
            <button
              onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-slate-200/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${isPriorityDropdownOpen ? "bg-slate-200/60" : "hover:bg-slate-100"}`}
              aria-haspopup="true" aria-expanded={isPriorityDropdownOpen}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentPriorityDisplay.icon}</span>
                <span className={`font-semibold ${currentPriorityDisplay.colorClass}`}>{currentPriorityDisplay.displayLabel}</span>
              </div>
              <svg className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${isPriorityDropdownOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
              </svg>
            </button>
            {isPriorityDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md shadow-lg z-30 border border-slate-200 overflow-y-auto max-h-60 py-1">
                <button
                  onClick={async () => {
                    await handleUpdateTaskField("priority", null);
                    setIsPriorityDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center ${!priority ? "font-semibold text-blue-600" : "text-slate-700"}`}
                >
                  {!priority && (<svg className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                  <span className="italic text-slate-500">— Clear Priority —</span>
                </button>
                <div className="border-t border-slate-100 my-1 mx-1"></div>
                {priorityUpdateOptions.map((option) => (
                  <button
                    key={option.apiValue}
                    onClick={async () => {
                      await handleUpdateTaskField("priority", option.apiValue);
                      setIsPriorityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center ${priority === option.apiValue ? "font-semibold text-blue-600" : "text-slate-700"}`}
                  >
                    {priority === option.apiValue && (<svg className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>)}
                    <span className="text-sm mr-2 shrink-0">{option.icon}</span>
                    <span className={option.colorClass}>{option.displayLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Due Date</h4>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="date" value={dueDate || ""} onChange={async (e) => await handleUpdateTaskField("due_date", e.target.value || null)} className="text-slate-700 font-medium bg-transparent border-0 focus:ring-0 p-0 w-full focus:outline-none appearance-none cursor-pointer" />
            {!dueDate && (<span className="text-slate-500 text-sm italic whitespace-nowrap">No due date</span>)}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee</h4>
          {mappedAssignee ? (
            <div className="flex items-center space-x-3">
              {mappedAssignee.profilePic ? (<img src={mappedAssignee.profilePic} alt={mappedAssignee.name} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200" />
              ) : (<span className={`w-8 h-8 ${mappedAssignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-200`}>{mappedAssignee.avatar}</span>)}
              <span className="text-slate-700 font-medium truncate">{mappedAssignee.name}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
              <span className="text-slate-500">Unassigned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskMetadata;