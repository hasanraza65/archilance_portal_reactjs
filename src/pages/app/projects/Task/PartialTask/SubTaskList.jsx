// src/pages/app/projects/Task/PartialTask/SubTaskList.jsx

import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  mapApiUserToLocal,
  getCurrentPriorityDetails,
  getStatusClass,
} from "./taskDetailsUtils";
import Icon from "@/components/ui/Icon"; // Icon component import karein

// =================================================================
// == HELPER COMPONENTS AND FUNCTIONS (FOR STYLING & CONSISTENCY) ==
// =================================================================

const StatusBadge = ({ status }) => {
  const statusString = String(status || "unknown").toLowerCase();
  const statusColors = {
    backlog:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "on hold":
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "awaiting info":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "in progress":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-house review":
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    "client review":
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  const defaultColor =
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
        statusColors[statusString] || defaultColor
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

const getStatusGradient = (status) => {
  const statusString = String(status || "unknown").toLowerCase();
  const statusGradients = {
    "on hold":
      "from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-900",
    backlog:
      "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900",
    "awaiting info":
      "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900",
    "in progress":
      "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900",
    "in-house review":
      "from-cyan-50 to-cyan-100 dark:from-cyan-800 dark:to-cyan-900",
    "client review":
      "from-indigo-50 to-indigo-100 dark:from-indigo-800 dark:to-indigo-900",
    completed:
      "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
    done: "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
  };

  return (
    statusGradients[statusString] ||
    "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
  );
};

// =================================================================
// == MAIN COMPONENT START ==
// =================================================================

const SubTaskList = ({
  subTasks,
  jobId,
  onAddSubTaskClick,
  onEditSubTask,
  onDeleteSubTask,
  isEditable,
}) => {
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState({});

  // Group tasks by status using useMemo for performance
  const groupedTasks = useMemo(() => {
    return subTasks.reduce((acc, task) => {
      const status = String(task.task_status || "unknown").toLowerCase();
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});
  }, [subTasks]);

  // Sort the status groups according to the custom order
  const sortedStatusOrder = useMemo(() => {
    const statusOrder = [
      "on hold",
      "backlog",
      "awaiting info",
      "in progress",
      "in-house review",
      "client review",
      "completed",
      "done",
    ];
    const availableStatuses = Object.keys(groupedTasks);
    return availableStatuses.sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedTasks]);

  // Set all sections to be expanded by default when component loads or tasks change
  useEffect(() => {
    const initialExpandedState = {};
    sortedStatusOrder.forEach((status) => {
      initialExpandedState[status] = true;
    });
    setExpandedSections(initialExpandedState);
  }, [sortedStatusOrder]);

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 dark:border-slate-700">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
            Tasks
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
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
        <div className="w-full space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50">
          {sortedStatusOrder.map((status) => {
            const tasksForStatus = groupedTasks[status];
            return (
              <div
                key={status}
                className="rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r ${getStatusGradient(
                    status
                  )}`}
                  onClick={() => toggleSection(status)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      icon={
                        expandedSections[status]
                          ? "heroicons:chevron-down"
                          : "heroicons:chevron-right"
                      }
                      className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    />
                    <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {status}
                    </h3>
                    <span className="px-2 py-1 bg-white/70 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                      {tasksForStatus.length}
                    </span>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {expandedSections[status] && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {tasksForStatus.map((subTask, index) => {
                      const assignee =
                        subTask.assignees && subTask.assignees.length > 0
                          ? mapApiUserToLocal(subTask.assignees[0].user)
                          : null;
                      const subTaskPriority = getCurrentPriorityDetails(
                        subTask.priority
                      );
                      return (
                        <div
                          key={subTask.id || `subtask-${index}`}
                          className="p-6 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                onClick={() =>
                                  navigate(`/project/${subTask.id}`, {
                                    state: { jobId: jobId },
                                  })
                                }
                              >
                                {subTask.task_title || "Untitled Task"}
                              </h3>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(
                                    subTask.task_status
                                  )}`}
                                >
                                  {String(
                                    subTask.task_status || "N/A"
                                  ).toUpperCase()}
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
                                  <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
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
                                      {new Date(
                                        subTask.due_date
                                      ).toLocaleDateString()}
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
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block truncate max-w-[100px]">
                                    {assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center"
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
                              {isEditable && (
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => onEditSubTask(subTask)}
                                    title="Edit Task"
                                    className="p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:hover:bg-slate-600"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                      <path
                                        fillRule="evenodd"
                                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => onDeleteSubTask(subTask.id)}
                                    title="Delete Task"
                                    className="p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-slate-600"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              ? "Break down this project into smaller, manageable tasks."
              : "There are no tasks for this item."}
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
