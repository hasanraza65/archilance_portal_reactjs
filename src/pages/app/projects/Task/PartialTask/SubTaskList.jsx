// src/pages/app/projects/Task/PartialTask/SubTaskList.jsx
//
// The "Tasks" panel on a task-detail page. Each sub-task is rendered as an
// expandable tree row (ClickUp-style): expand to reveal its own sub-tasks
// (unlimited depth, lazy-loaded), with inline status + due-date editing.

import React from "react";
import TaskTree from "@/components/features/projects/tree/TaskTree";

const SubTaskList = ({
  subTasks,
  jobId,
  onAddSubTaskClick,
  onEditSubTask,
  onDeleteSubTask, // kept for API compatibility; deletion is handled inline by the tree
  onSubTaskDeleted, // (id) => void — keeps the parent's subTasks list/count in sync
  isEditable,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
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
        <div className="p-2 sm:p-4 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <TaskTree
              nodes={subTasks}
              isEditable={isEditable}
              canDelete={isEditable}
              jobId={jobId}
              onEditTask={isEditable ? onEditSubTask : undefined}
              onNodeDeleted={onSubTaskDeleted}
              emptyLabel="No tasks yet."
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
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
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">
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
