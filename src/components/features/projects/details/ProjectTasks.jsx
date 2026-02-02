import React from "react";
import Icon from "@/components/ui/Icon";
import StatusBadge from "./StatusBadge";
import {
    mapApiAssigneeToLocal,
    getPriorityClass,
    getStatusGradient,
} from "./utils";
import { useNavigate } from "react-router-dom";

import EditableTaskStatus from "@/pages/app/projects/EditableTaskStatus";

const MAX_DISPLAY_ASSIGNEES_IN_LIST = 2;

const ProjectTasks = ({
    tasks,
    groupedTasks,
    sortedStatusOrder,
    expandedSections,
    toggleSection,
    tasksViewMode,
    setTasksViewMode,
    handleKanbanBoard,
    handleOpenAddTaskModal,
    handleOpenEditTaskModal,
    handleDeleteTask,
    isManagerOrAdmin,
    id,
    projectDetails,
    onStatusUpdate,
}) => {
    const navigate = useNavigate();

    if (tasks.length === 0) {
        return (
            <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
                <svg
                    className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        vectorEffect="non-scaling-stroke"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
                    No Projects in this Job Yet
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Get started by adding the first project to "
                    {projectDetails?.project_name || "this job"}".
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={handleKanbanBoard}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        View Kanban Board
                    </button>
                    <button
                        type="button"
                        onClick={handleOpenAddTaskModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Add New Project
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-slate-600 gap-4 bg-white dark:bg-slate-800 rounded-t-lg">
                <div className="flex-grow">
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
                        Project for this Job
                    </h2>
                    {/* View Toggler for Mobile */}
                    <div className="mt-2 sm:hidden">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setTasksViewMode("grid")}
                                className={`py-2 px-4 text-sm font-medium ${tasksViewMode === "grid"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-900"
                                    } rounded-l-lg border border-gray-200 hover:bg-gray-100`}
                            >
                                Grid
                            </button>
                            <button
                                type="button"
                                onClick={() => setTasksViewMode("list")}
                                className={`py-2 px-4 text-sm font-medium ${tasksViewMode === "list"
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-900"
                                    } rounded-r-md border border-gray-200 hover:bg-gray-100`}
                            >
                                List
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
                    <button
                        onClick={handleKanbanBoard}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                        </svg>
                        Kanban Board
                    </button>
                    <button
                        onClick={handleOpenAddTaskModal}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Add Project
                    </button>
                </div>
            </div>

            {/* Grid/Accordion View */}
            <div
                className={`${tasksViewMode === "grid" ? "block" : "hidden"} sm:block space-y-4`}
            >
                {sortedStatusOrder.map((status) => {
                    const tasksForStatus = groupedTasks[status];
                    return (
                        <div
                            key={status}
                            className="rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
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
                                    <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                        {tasksForStatus.length}
                                    </span>
                                </div>
                                <StatusBadge status={status} />
                            </div>

                            {expandedSections[status] && (
                                <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-2 md:p-0">
                                    <table className="min-w-full responsive-project-table">
                                        <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-4/12">
                                                    Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                                                    Status
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                                                    Assignees
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                                                    Due date
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                                                    Priority
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-transparent md:bg-white md:dark:bg-slate-800 md:divide-y md:divide-slate-200 md:dark:divide-slate-700">
                                            {tasksForStatus.map((task) => {
                                                const mappedTaskAssignees = (task.assignees || [])
                                                    .map((a) => mapApiAssigneeToLocal(a.user || a))
                                                    .filter(Boolean);
                                                return (
                                                    <tr
                                                        key={task.id}
                                                        onClick={() =>
                                                            navigate(`/project/${task.id}`, {
                                                                state: { jobId: id },
                                                            })
                                                        }
                                                        className="block md:table-row md:hover:bg-slate-50 md:dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-150"
                                                    >
                                                        <td
                                                            data-label="Name"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            <span className="text-slate-900 dark:text-slate-100 truncate">
                                                                {task.task_title || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td
                                                            data-label="Status"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            <EditableTaskStatus
                                                                taskId={task.id}
                                                                currentStatus={task.task_status}
                                                                onStatusUpdate={onStatusUpdate}
                                                                isEditable={true}
                                                            />
                                                        </td>
                                                        <td
                                                            data-label="Assignees"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            {mappedTaskAssignees.length > 0 ? (
                                                                <div className="flex -space-x-2 overflow-hidden items-center justify-end md:justify-start">
                                                                    {mappedTaskAssignees
                                                                        .slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST)
                                                                        .map((assignee) =>
                                                                            assignee.profilePic ? (
                                                                                <img
                                                                                    key={assignee.id}
                                                                                    src={assignee.profilePic}
                                                                                    alt={assignee.name}
                                                                                    title={assignee.name}
                                                                                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white dark:ring-slate-700"
                                                                                />
                                                                            ) : (
                                                                                <span
                                                                                    key={assignee.id}
                                                                                    title={assignee.name}
                                                                                    className={`w-8 h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-white dark:ring-slate-700`}
                                                                                >
                                                                                    {assignee.avatar}
                                                                                </span>
                                                                            )
                                                                        )}
                                                                    {mappedTaskAssignees.length >
                                                                        MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                                                                            <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-1 ring-white dark:ring-slate-700">
                                                                                +
                                                                                {mappedTaskAssignees.length -
                                                                                    MAX_DISPLAY_ASSIGNEES_IN_LIST}
                                                                            </span>
                                                                        )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                                                                    Unassigned
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td
                                                            data-label="Due Date"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            <span className="text-slate-700 dark:text-slate-300">
                                                                {task.due_date
                                                                    ? new Date(task.due_date).toLocaleDateString()
                                                                    : "N/A"}
                                                            </span>
                                                        </td>
                                                        <td
                                                            data-label="Priority"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            <span
                                                                className={`font-medium ${getPriorityClass(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {task.priority || "N/A"}
                                                            </span>
                                                        </td>
                                                        <td
                                                            data-label="Actions"
                                                            className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                                        >
                                                            <div
                                                                className="flex items-center justify-end md:justify-center space-x-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <button
                                                                    onClick={(e) =>
                                                                        handleOpenEditTaskModal(task, e)
                                                                    }
                                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 p-1 rounded hover:bg-blue-100 dark:hover:bg-slate-700"
                                                                    title="Edit Project"
                                                                >
                                                                    <Icon
                                                                        icon="heroicons:pencil-square"
                                                                        className="w-5 h-5"
                                                                    />
                                                                </button>
                                                                {isManagerOrAdmin && (
                                                                    <button
                                                                        onClick={(e) =>
                                                                            handleDeleteTask(task.id, e)
                                                                        }
                                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded hover:bg-red-100 dark:hover:bg-slate-700"
                                                                        title="Delete Task"
                                                                    >
                                                                        <Icon
                                                                            icon="heroicons-outline:trash"
                                                                            className="w-5 h-5"
                                                                        />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* List/Table View for Mobile */}
            <div
                className={`${tasksViewMode === "list" ? "block" : "hidden"
                    } sm:hidden w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700`}
            >
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Name
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Status
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Assignees
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Due Date
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Priority
                            </th>
                            <th
                                scope="col"
                                className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider"
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                        {tasks.map((task) => {
                            const mappedTaskAssignees = (task.assignees || [])
                                .map((a) => mapApiAssigneeToLocal(a.user || a))
                                .filter(Boolean);
                            return (
                                <tr
                                    key={task.id}
                                    onClick={() =>
                                        navigate(`/project/${task.id}`, { state: { jobId: id } })
                                    }
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                                        {task.task_title || "N/A"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <EditableTaskStatus
                                            taskId={task.id}
                                            currentStatus={task.task_status}
                                            onStatusUpdate={onStatusUpdate}
                                            isEditable={true}
                                        />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {mappedTaskAssignees.length > 0 ? (
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {mappedTaskAssignees
                                                    .slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST)
                                                    .map((assignee) =>
                                                        assignee.profilePic ? (
                                                            <img
                                                                key={assignee.id}
                                                                src={assignee.profilePic}
                                                                alt={assignee.name}
                                                                title={assignee.name}
                                                                className="w-7 h-7 rounded-full object-cover ring-1 ring-white dark:ring-slate-700"
                                                            />
                                                        ) : (
                                                            <span
                                                                key={assignee.id}
                                                                title={assignee.name}
                                                                className={`w-7 h-7 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs font-semibold ring-1 ring-white dark:ring-slate-700`}
                                                            >
                                                                {assignee.avatar}
                                                            </span>
                                                        )
                                                    )}
                                                {mappedTaskAssignees.length >
                                                    MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                                                        <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-1 ring-white dark:ring-slate-700">
                                                            +
                                                            {mappedTaskAssignees.length -
                                                                MAX_DISPLAY_ASSIGNEES_IN_LIST}
                                                        </span>
                                                    )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                                Unassigned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                        {task.due_date
                                            ? new Date(task.due_date).toLocaleDateString()
                                            : "N/A"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span
                                            className={`font-medium ${getPriorityClass(
                                                task.priority
                                            )}`}
                                        >
                                            {task.priority || "N/A"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                        <div
                                            className="flex items-center justify-center space-x-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => handleOpenEditTaskModal(task, e)}
                                                className="text-blue-500 p-1 rounded hover:bg-blue-100 dark:hover:bg-slate-600"
                                            >
                                                <Icon
                                                    icon="heroicons:pencil-square"
                                                    className="w-5 h-5"
                                                />
                                            </button>
                                            {isManagerOrAdmin && (
                                                <button
                                                    onClick={(e) => handleDeleteTask(task.id, e)}
                                                    className="text-red-500 p-1 rounded hover:bg-red-100 dark:hover:bg-slate-600"
                                                >
                                                    <Icon
                                                        icon="heroicons-outline:trash"
                                                        className="w-5 h-5"
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectTasks;
