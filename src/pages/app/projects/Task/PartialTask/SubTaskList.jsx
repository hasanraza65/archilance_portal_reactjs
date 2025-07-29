// src/components/TaskDetails/SubTaskList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  mapApiUserToLocal,
  getCurrentPriorityDetails,
  getStatusClass,
} from "./taskDetailsUtils";

const SubTaskList = ({ subTasks, onAddSubTaskClick }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
          <p className="text-sm text-slate-600 mt-1">
            {subTasks.length} task{subTasks.length !== 1 ? "s" : ""} total
          </p>
        </div>
        
        {onAddSubTaskClick && (
          <button
            onClick={onAddSubTaskClick}
            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span>Add Task</span>
          </button>
        )}
      </div>
      {subTasks.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {subTasks.map((subTask, index) => {
            // ***** SUDHAAR: Yahan creator ko fallback ke tor par use karna band kar diya hai *****
            // Ab sirf assigned user hi show hoga. Agar koi assigned nahi hai to "Unassigned" show hoga.
            const assignee =
              subTask.assignees && subTask.assignees.length > 0
                ? mapApiUserToLocal(subTask.assignees[0].user)
                : null;
            const subTaskPriority = getCurrentPriorityDetails(subTask.priority);
            return (
              <div
                key={subTask.id || `subtask-${index}`}
                className="p-6 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-lg font-semibold text-slate-800 mb-2 hover:text-blue-600 cursor-pointer"
                      onClick={() => navigate(`/task/${subTask.id}`)}
                    >
                      {subTask.task_title || "Untitled Task"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(
                          subTask.task_status
                        )}`}
                      >
                        {String(subTask.task_status || "N/A").toUpperCase()}
                      </span>
                      <div
                        className="flex items-center space-x-1"
                        title={`Priority: ${subTaskPriority.displayLabel}`}
                      >
                        <span>{subTaskPriority.icon}</span>
                        <span
                          className={`font-medium ${subTaskPriority.colorClass}`}
                        >
                          {subTaskPriority.displayLabel}
                        </span>
                      </div>
                      {subTask.due_date && (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <svg
                            className="w-4 h-4"
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
                          <span>
                            {new Date(subTask.due_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 sm:space-x-4 ml-4">
                    {assignee ? (
                      <div
                        className="flex items-center space-x-2"
                        title={`Assigned to: ${assignee.name}`}
                      >
                        {assignee.profilePic ? (
                          <img
                            src={assignee.profilePic}
                            alt={assignee.name}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <span
                            className={`w-7 h-7 sm:w-8 sm:h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-1 ring-slate-200`}
                          >
                            {assignee.avatar}
                          </span>
                        )}
                        <span className="text-sm font-medium text-slate-700 hidden md:block truncate max-w-[100px]">
                          {assignee.name}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 rounded-full flex items-center justify-center"
                        title="Unassigned"
                      >
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400"
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
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">
            No tasks yet
          </h3>
          <p className="text-slate-500 mb-4 text-sm">
            {onAddSubTaskClick 
              ? "Break down this task into smaller, manageable pieces." 
              : "There are no sub-tasks for this item."
            }
          </p>
          
          {onAddSubTaskClick && (
            <button
              onClick={onAddSubTaskClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm"
            >
              Create First Task
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SubTaskList;