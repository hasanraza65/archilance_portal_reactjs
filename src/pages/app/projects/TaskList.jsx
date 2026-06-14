import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import {
  getApiPrefix,
  getEmployeeType,
  getApiBasePathForRole,
  getMediaUrl,
} from "@/pages/utility/apiHelper";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import Icon from "@/components/ui/Icon";
import TableLoading from "@/components/skeleton/Table";
import EditTask from "./EditTask";
import EditableTaskStatus from "./EditableTaskStatus";
import EditableDueDate from "./EditTaskDate/EditableDueDate";
import EditableStartDate from "./EditTaskDate/EditableStartDate";
import TaskListAssignee from "./TaskListAssignee";


// --- UPDATED: The exact status options from your image ---
const TASK_STATUS_OPTIONS = [
  "On Hold",
  "Backlog",
  "Awaiting Info",
  "In Progress",
  "In-house review",
  "Client Review",
  "Completed",
];

// --- UPDATED: Color function to handle the new statuses ---
const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done")
    return "bg-green-100 text-green-800 border-green-200";
  if (s.includes("progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("backlog"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (s.includes("review")) // Covers "Client Review" and "In-house review"
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s.includes("on hold"))
    return "bg-orange-100 text-orange-800 border-orange-200";
  // "Awaiting Info" will use the default slate color, which is fine
  return "bg-slate-100 text-slate-800 border-slate-200";
};

const StatusFilterBar = ({
  statuses,
  activeFilter,
  onFilterChange,
  disabled = false,
  className = "",
}) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <span className="text-sm font-medium text-slate-500 dark:text-slate-300 mr-2">
      Filter by:
    </span>
    {["All", ...statuses].map((status) => (
      <button
        key={status}
        onClick={() => onFilterChange(status)}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all duration-200 ${
          activeFilter.toLowerCase() === status.toLowerCase()
            ? `${getStatusClass(
                status
              )} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800`
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        style={{ ringColor: status.toLowerCase() === "all" ? "#64748b" : "" }}
      >
        {status}
      </button>
    ))}
  </div>
);

// In-file CSS component for mobile responsiveness (Final Version)
const ResponsiveTableStyles = () => {
  useEffect(() => {
    const styleId = "responsive-task-list-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .responsive-task-table {
        table-layout: fixed;
        width: 100%;
      }
      .responsive-task-table td, .responsive-task-table th {
        word-break: break-word;
      }
      @media (max-width: 767px) {
        .responsive-task-table thead {
          display: none;
        }
        .responsive-task-table tbody tr {
          display: block;
          margin-bottom: 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0; /* slate-200 */
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
          padding: 0.25rem;
          background-color: #ffffff; /* white */
        }
        .dark .responsive-task-table tbody tr {
          border-color: #334155; /* slate-700 */
          background-color: #1e293b; /* slate-800 */
        }
        .responsive-task-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          text-align: right;
          border-bottom: 1px solid #f1f5f9; /* slate-100 */
        }
        .dark .responsive-task-table td {
          border-bottom-color: #334155; /* slate-700 */
        }
        .responsive-task-table tr td:last-child {
          border-bottom: none;
        }
        .responsive-task-table td::before {
          content: attr(data-label);
          font-weight: 600;
          text-align: left;
          margin-right: 1rem;
          color: #475569; /* slate-600 */
        }
        .dark .responsive-task-table td::before {
          color: #94a3b8; /* slate-400 */
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return null;
};

const getAuthToken = () => Cookies.get("token");

const AvatarStack = ({ assignees, onClick }) => {
  if (!assignees || assignees.length === 0) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <span className="text-slate-400">N/A</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center -space-x-2 cursor-pointer"
      onClick={onClick}
    >
      {assignees.slice(0, 3).map(({ user }) => {
        if (!user) return null;
        const avatarUrl = user.profile_pic ? getMediaUrl(user.profile_pic) : null;
        const getInitials = (name) =>
          name ? name.charAt(0).toUpperCase() : "U";
        return (
          <div
            key={user.id}
            title={user.name}
            className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-medium shadow-sm"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-blue-700 dark:text-blue-800">
                {getInitials(user.name)}
              </span>
            )}
          </div>
        );
      })}
      {assignees.length > 3 && (
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-700 shadow-sm">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize border ${getStatusClass(
        status
      )}`}
    >
      {status || "Unknown"}
    </span>
  );
};

const TaskList = ({
  onLoadingChange,
  statusFilter: propStatusFilter,
  searchQuery: propSearchQuery,
  assignedToMe: propAssignedToMe,
}) => {
  const [tasksData, setTasksData] = useState(() => {
    const initial = {};
    TASK_STATUS_OPTIONS.forEach((status) => {
      initial[status.toLowerCase()] = {
        items: [],
        currentPage: 1,
        lastPage: 1,
        total: 0,
        isLoading: false,
      };
    });
    return initial;
  });
  const [expandedSections, setExpandedSections] = useState({
    "on hold": true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRole = getApiPrefix();
  const employeeType = getEmployeeType();

  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [tasksViewMode, setTasksViewMode] = useState("grid");
  const [assigneeModal, setAssigneeModal] = useState(false);
  const [taskForAssignees, setTaskForAssignees] = useState(null);

  const [expandedTasks, setExpandedTasks] = useState({});

  const [statusFilter, setStatusFilter] = useState(propStatusFilter || "All");
  const [searchQuery, setSearchQuery] = useState(propSearchQuery || "");
  const [assignedToMe, setAssignedToMe] = useState(propAssignedToMe || false);

  const toggleTaskSubtasks = useCallback((e, taskId) => {
    e.stopPropagation();
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  }, []);

  // Sync with props if they change
  useEffect(() => {
    if (propStatusFilter !== undefined) setStatusFilter(propStatusFilter);
  }, [propStatusFilter]);

  useEffect(() => {
    if (propSearchQuery !== undefined) setSearchQuery(propSearchQuery);
  }, [propSearchQuery]);

  useEffect(() => {
    if (propAssignedToMe !== undefined) setAssignedToMe(propAssignedToMe);
  }, [propAssignedToMe]);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);
  
  const formatTaskItem = useCallback((item) => {
    const taskToShow = item.sub_task || item.task;
    return {
      id: taskToShow.id,
      project_id: item.project?.id,
      parent_task_id: item.task?.id,
      project_name: item.project?.project_name || "N/A",
      project_title: item.task?.task_title || "N/A",
      task_title: item.sub_task?.task_title || null,
      assignees: taskToShow.assignees || [],
      created_at: taskToShow.created_at,
      due_date: taskToShow.due_date,
      task_status: taskToShow.task_status,
      original_task_data: taskToShow,
      sub_tasks: item.task?.sub_tasks || [],
    };
  }, []);

  const fetchStatusTasks = useCallback(
    async (statusName, page = 1, isLoadMore = false) => {
      const lowerStatus = statusName.toLowerCase();
      const token = getAuthToken();
      if (!token) return;

      setTasksData((prev) => ({
        ...prev,
        [lowerStatus]: { ...prev[lowerStatus], isLoading: true },
      }));

      try {
        const apiPath = getApiBasePathForRole("/projects-with-tasks");
        const baseUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`;

        const params = {
          page,
          task_status: statusName,
        };
        if (assignedToMe) params.assigned_me = 1;

        const response = await axios.get(baseUrl, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const responseData = response.data;
        let rawItems = [];
        let isClientPaginated = false;

        if (responseData && Array.isArray(responseData.data)) {
          rawItems = responseData.data;
        } else if (Array.isArray(responseData)) {
          rawItems = responseData;
          isClientPaginated = true;
        }
        
        let formattedItems = [];
        let totalItems = 0;
        let lastPageNum = 1;

        if (isClientPaginated) {
           totalItems = rawItems.length;
           lastPageNum = Math.ceil(totalItems / 10) || 1;
           const startIndex = (page - 1) * 10;
           const endIndex = startIndex + 10;
           const itemsToFormat = rawItems.slice(startIndex, endIndex);
           formattedItems = itemsToFormat.map(formatTaskItem);
        } else {
           formattedItems = rawItems.map(formatTaskItem);
           totalItems = responseData.total !== undefined ? responseData.total : 0;
           lastPageNum = responseData.last_page || 1;
        }

        setTasksData((prev) => {
          const currentStatusData = prev[lowerStatus];
          return {
            ...prev,
            [lowerStatus]: {
              items: isLoadMore
                ? [...currentStatusData.items, ...formattedItems]
                : formattedItems,
              currentPage: isClientPaginated ? page : (responseData.current_page || page),
              lastPage: lastPageNum,
              total: totalItems,
              isLoading: false,
            },
          };
        });
      } catch (err) {
        console.error(err);
        setTasksData((prev) => ({
          ...prev,
          [lowerStatus]: { ...prev[lowerStatus], isLoading: false },
        }));
      }
    },
    [assignedToMe, formatTaskItem]
  );

  useEffect(() => {
    // Reset all data and re-fetch On Hold when critical filters change
    const initial = {};
    TASK_STATUS_OPTIONS.forEach((status) => {
      initial[status.toLowerCase()] = {
        items: [],
        currentPage: 1,
        lastPage: 1,
        total: 0,
        isLoading: false,
      };
    });
    setTasksData(initial);
    setExpandedSections({ "on hold": true });
    fetchStatusTasks("On Hold", 1);
  }, [assignedToMe, searchQuery, fetchStatusTasks]);

  useEffect(() => {
    if (statusFilter !== "All") {
      const lowerStatus = statusFilter.toLowerCase();
      setExpandedSections((prev) => ({ ...prev, [lowerStatus]: true }));
      if (tasksData[lowerStatus].items.length === 0 && !tasksData[lowerStatus].isLoading) {
        fetchStatusTasks(statusFilter, 1);
      }
    }
  }, [statusFilter, fetchStatusTasks]);

  const handleUpdateTaskStatus = useCallback((taskId, newStatus) => {
    setTasksData((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((status) => {
        newState[status] = {
          ...newState[status],
          items: newState[status].items.map((item) => {
            if (item.id === taskId) {
              return { ...item, task_status: newStatus };
            }
            if (item.sub_tasks && item.sub_tasks.length > 0) {
              return {
                ...item,
                sub_tasks: item.sub_tasks.map(sub =>
                  sub.id === taskId ? { ...sub, task_status: newStatus } : sub
                )
              };
            }
            return item;
          }),
        };
      });
      return newState;
    });
  }, []);

  const handleUpdateTaskStartDate = useCallback((taskId, newStartDate) => {
    setTasksData((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((status) => {
        newState[status] = {
          ...newState[status],
          items: newState[status].items.map((item) => {
            if (item.id === taskId) {
              return { ...item, created_at: newStartDate };
            }
            if (item.sub_tasks && item.sub_tasks.length > 0) {
              return {
                ...item,
                sub_tasks: item.sub_tasks.map(sub =>
                  sub.id === taskId ? { ...sub, created_at: newStartDate } : sub
                )
              };
            }
            return item;
          }),
        };
      });
      return newState;
    });
  }, []);

  const handleUpdateTaskDueDate = useCallback((taskId, newDueDate) => {
    setTasksData((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((status) => {
        newState[status] = {
          ...newState[status],
          items: newState[status].items.map((item) => {
            if (item.id === taskId) {
              return { ...item, due_date: newDueDate };
            }
            if (item.sub_tasks && item.sub_tasks.length > 0) {
              return {
                ...item,
                sub_tasks: item.sub_tasks.map(sub =>
                  sub.id === taskId ? { ...sub, due_date: newDueDate } : sub
                )
              };
            }
            return item;
          }),
        };
      });
      return newState;
    });
  }, []);

  const toggleSection = (statusName) => {
    const lowerStatus = statusName.toLowerCase();
    const willExpand = !expandedSections[lowerStatus];

    setExpandedSections((prev) => ({
      ...prev,
      [lowerStatus]: willExpand,
    }));

    if (
      willExpand &&
      tasksData[lowerStatus].items.length === 0 &&
      !tasksData[lowerStatus].isLoading
    ) {
      fetchStatusTasks(statusName, 1);
    }
  };

  const hasData = useMemo(() => {
    return Object.values(tasksData).some((s) => s.items.length > 0);
  }, [tasksData]);

  const isAnyLoading = useMemo(() => {
    return Object.values(tasksData).some((s) => s.isLoading);
  }, [tasksData]);

  const handleOpenEditModal = useCallback((task, e) => {
    e.stopPropagation();
    setCurrentTask(task);
    setEditTaskModal(true);
  }, []);

  const handleOpenAssigneeModal = useCallback((task, e) => {
    e.stopPropagation();
    setTaskForAssignees(task);
    setAssigneeModal(true);
  }, []);

  const handleDelete = useCallback(
    (taskId, taskTitle, status, e) => {
      e.stopPropagation();
      Swal.fire({
        title: "Are you sure?",
        text: `You are about to delete the task: "${taskTitle}". You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6e7881",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          const token = getAuthToken();
          const deleteApiPath = getApiBasePathForRole(`/project-task/${taskId}`);
          axios
            .delete(
              `${import.meta.env.VITE_BACKEND_BASE_URL}${deleteApiPath}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then(() => {
              Swal.fire(
                "Deleted!",
                "The task has been successfully deleted.",
                "success"
              );
              if (status) {
                fetchStatusTasks(status, 1);
              }
            })
            .catch((error) => {
              Swal.fire(
                "Failed!",
                error.response?.data?.message ||
                  "The task could not be deleted.",
                "error"
              );
            });
        }
      });
    },
    [fetchStatusTasks]
  );

  const handleRowClick = (rowData) => {
    navigate(`/project/${rowData.id}`, {
      state: { jobId: rowData.project_id },
    });
  };

  const getStatusGradient = (status) => {
    const s = String(status || "").toLowerCase();
    if (s === "completed" || s === "done")
      return "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900";
    if (s.includes("progress"))
      return "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900";
    if (s.includes("backlog"))
      return "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900";
    if (s.includes("review"))
      return "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900";
    if (s.includes("on hold"))
      return "from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-900";
    return "from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800";
  };
  

  return (
    <>
      <Card className="mb-6">
        <div className="md:flex justify-between items-center space-y-4 md:space-y-0">
          <div className="relative md:w-1/3 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or tasks..."
              className="form-input py-2 pl-10 w-full dark:bg-slate-800 dark:border-slate-600"
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Icon
                icon="heroicons-outline:search"
                className="w-5 h-5 text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
            {userRole !== "admin" && (employeeType === "Manager" ||
              employeeType === "Supervisor" ||
              employeeType === "Executive" ||
              employeeType === "Employee") && (
              <Button
                text="Assigned to me"
                disabled={isLoading}
                className={`py-2 px-4 text-sm font-medium transition-colors ${
                  assignedToMe ? "btn-dark" : "btn-outline-dark"
                }`}
                onClick={() => setAssignedToMe((prev) => !prev)}
              />
            )}
          </div>
        </div>
        <hr className="my-4 border-slate-200 dark:border-slate-700" />
        <StatusFilterBar
          statuses={TASK_STATUS_OPTIONS}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          disabled={isLoading}
        />
      </Card>
      
      <ResponsiveTableStyles />
      
      {isLoading && <TableLoading count={10} />}
      {!isLoading && error && <div className="p-4 text-center text-red-500">{error}</div>}

      {!isLoading && !isAnyLoading && !error && !hasData && (
          <div className="p-16 text-center text-slate-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl">
            <Icon
              icon="heroicons-outline:inbox"
              className="mx-auto h-16 w-16 text-blue-400"
            />
            <h4 className="mt-4 text-xl font-medium text-slate-700 dark:text-slate-300">
              No Tasks Found
            </h4>
            {searchQuery ? (
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                No tasks match your search for "
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {searchQuery}
                </span>
                ".
              </p>
            ) : statusFilter.toLowerCase() !== "all" ? (
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                There are no tasks with the status "
                <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">
                  {statusFilter}
                </span>
                ".
              </p>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">
                There are currently no tasks to display.
              </p>
            )}
          </div>
      )}

      {!isLoading && !error && (
        <>
          {TASK_STATUS_OPTIONS.map((statusName) => {
            const lowerStatus = statusName.toLowerCase();
            if (statusFilter !== "All" && statusFilter !== statusName)
              return null;

            const data = tasksData[lowerStatus];
            const itemsToRender = searchQuery
              ? data.items.filter(
                  (row) =>
                    row.project_name
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    row.project_title
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    row.task_title
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())
                )
              : data.items;

            return (
              <div
                key={statusName}
                className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r ${getStatusGradient(
                    statusName
                  )}`}
                  onClick={() => toggleSection(statusName)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      icon={
                        expandedSections[lowerStatus]
                          ? "heroicons:chevron-down"
                          : "heroicons:chevron-right"
                      }
                      className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    />
                    <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {statusName}
                    </h3>
                  </div>
                  <StatusBadge status={statusName} />
                </div>
                {expandedSections[lowerStatus] && (
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-2 md:p-0">
                    {data.isLoading && data.items.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        Loading tasks...
                      </div>
                    ) : itemsToRender.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        No tasks found in this section.
                      </div>
                    ) : (
                      <>
                        <table className="min-w-full responsive-task-table">
                          <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/6">
                                Jobs
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/6">
                                Projects
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/8">
                                Task
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                                Assigned To
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                                Start Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                                Due Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/10">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                                Action
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-transparent md:bg-white md:dark:bg-slate-800 md:divide-y md:divide-slate-200 md:dark:divide-slate-700">
                            {itemsToRender.map((rowData, index) => (
                              <React.Fragment key={index}>
                                <tr
                                  onClick={() => handleRowClick(rowData)}
                                  className="block md:table-row md:hover:bg-slate-50 md:dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-150"
                                >
                                  <td
                                    data-label="Job"
                                    className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                  >
                                    <div className="flex items-center space-x-2">
                                      {rowData.sub_tasks && rowData.sub_tasks.length > 0 && (
                                        <button
                                          onClick={(e) => toggleTaskSubtasks(e, rowData.id)}
                                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                          <Icon
                                            icon={
                                              expandedTasks[rowData.id]
                                                ? "heroicons:chevron-down"
                                                : "heroicons:chevron-right"
                                            }
                                            className="w-4 h-4 text-slate-500"
                                          />
                                        </button>
                                      )}
                                      <a
                                        href={`/jobs/${rowData.project_id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="font-medium text-slate-800 dark:text-slate-200 text-sm hover:underline"
                                      >
                                        {rowData.project_name}
                                      </a>
                                    </div>
                                  </td>
                                <td
                                  data-label="Project"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  <a
                                    href={`/project/${
                                      rowData.parent_task_id || rowData.id
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-medium text-blue-600 dark:text-blue-400 capitalize text-sm hover:underline"
                                  >
                                    {rowData.project_title}
                                  </a>
                                </td>
                                <td
                                  data-label="Task"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  {rowData.task_title ? (
                                    <a
                                      href={`/project/${rowData.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-slate-700 dark:text-slate-300 capitalize text-sm hover:underline"
                                    >
                                      {rowData.task_title}
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">N/A</span>
                                  )}
                                </td>
                                <td
                                  data-label="Assigned To"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  <AvatarStack
                                    assignees={rowData.assignees}
                                    onClick={(e) =>
                                      handleOpenAssigneeModal(
                                        rowData.original_task_data,
                                        e
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  data-label="Start Date"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Icon
                                      icon="heroicons-outline:calendar"
                                      className="w-9 h-9 text-slate-500 dark:text-slate-400"
                                    />
                                    <EditableStartDate
                                      taskId={rowData.id}
                                      currentStartDate={rowData.created_at}
                                      onDateUpdate={handleUpdateTaskStartDate}
                                      isEditable={
                                        userRole === "admin" ||
                                        employeeType === "Manager" ||
                                        employeeType === "Supervisor" ||
                                        employeeType === "Executive"
                                      }
                                    />
                                  </div>
                                </td>
                                <td
                                  data-label="Due Date"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  <div className="flex items-center space-x-2">
                                    <Icon
                                      icon="heroicons-outline:calendar"
                                      className="w-9 h-9 text-slate-500 dark:text-slate-400"
                                    />
                                    <EditableDueDate
                                      taskId={rowData.id}
                                      currentDueDate={rowData.due_date}
                                      onDateUpdate={handleUpdateTaskDueDate}
                                      isEditable={
                                        userRole === "admin" ||
                                        employeeType === "Manager" ||
                                        employeeType === "Supervisor" ||
                                        employeeType === "Executive"
                                      }
                                    />
                                  </div>
                                </td>
                                <td
                                  data-label="Status"
                                  className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                >
                                  <EditableTaskStatus
                                    taskId={rowData.id}
                                    currentStatus={rowData.task_status}
                                    onStatusUpdate={handleUpdateTaskStatus}
                                    isEditable={
                                      userRole === "admin" ||
                                      employeeType === "Manager" ||
                                      employeeType === "Supervisor" ||
                                      employeeType === "Executive"
                                    }
                                  />
                                </td>
                                  <td
                                    data-label="Action"
                                    className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                  >
                                    <div className="flex space-x-3 rtl:space-x-reverse">
                                      <button
                                        className="action-btn"
                                        type="button"
                                        onClick={(e) =>
                                          handleOpenEditModal(
                                            rowData.original_task_data,
                                            e
                                          )
                                        }
                                      >
                                        <Icon icon="heroicons:pencil-square" />
                                      </button>
                                      <button
                                        className="action-btn"
                                        type="button"
                                        onClick={(e) =>
                                          handleDelete(
                                            rowData.id,
                                            rowData.task_title ||
                                              rowData.project_title,
                                            statusName,
                                            e
                                          )
                                        }
                                      >
                                        <Icon icon="heroicons:trash" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {expandedTasks[rowData.id] &&
                                  rowData.sub_tasks?.map((sub) => (
                                    <tr
                                      key={`sub-${sub.id}`}
                                      onClick={() =>
                                        navigate(`/project/${sub.id}`, {
                                          state: { jobId: rowData.project_id },
                                        })
                                      }
                                      className="block md:table-row bg-slate-50/50 dark:bg-slate-800/50 md:hover:bg-slate-100 md:dark:hover:bg-slate-700/80 cursor-pointer transition-colors duration-150 border-l-2 border-l-blue-400"
                                    >
                                      <td
                                        data-label="Job"
                                        className="block md:table-cell px-4 py-2 md:py-4 md:pl-12 w-full md:w-auto"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <span className="text-slate-400 dark:text-slate-500">↳</span>
                                          <span className="text-sm text-slate-500 dark:text-slate-400">
                                            Sub-task
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        data-label="Project"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <span className="text-sm text-slate-500 dark:text-slate-400">
                                          {rowData.project_title}
                                        </span>
                                      </td>
                                      <td
                                        data-label="Task"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <a
                                          href={`/project/${sub.id}`}
                                          onClick={(e) => e.stopPropagation()}
                                          className="text-slate-700 dark:text-slate-300 capitalize text-sm hover:underline font-medium"
                                        >
                                          {sub.task_title}
                                        </a>
                                      </td>
                                      <td
                                        data-label="Assigned To"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <AvatarStack
                                          assignees={sub.assignees}
                                          onClick={(e) =>
                                            handleOpenAssigneeModal(sub, e)
                                          }
                                        />
                                      </td>
                                      <td
                                        data-label="Start Date"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Icon
                                            icon="heroicons-outline:calendar"
                                            className="w-9 h-9 text-slate-500 dark:text-slate-400"
                                          />
                                          <EditableStartDate
                                            taskId={sub.id}
                                            currentStartDate={sub.created_at}
                                            onDateUpdate={handleUpdateTaskStartDate}
                                            isEditable={
                                              userRole === "admin" ||
                                              employeeType === "Manager" ||
                                              employeeType === "Supervisor" ||
                                              employeeType === "Executive"
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td
                                        data-label="Due Date"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <div className="flex items-center space-x-2">
                                          <Icon
                                            icon="heroicons-outline:calendar"
                                            className="w-9 h-9 text-slate-500 dark:text-slate-400"
                                          />
                                          <EditableDueDate
                                            taskId={sub.id}
                                            currentDueDate={sub.due_date}
                                            onDateUpdate={handleUpdateTaskDueDate}
                                            isEditable={
                                              userRole === "admin" ||
                                              employeeType === "Manager" ||
                                              employeeType === "Supervisor" ||
                                              employeeType === "Executive"
                                            }
                                          />
                                        </div>
                                      </td>
                                      <td
                                        data-label="Status"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <EditableTaskStatus
                                          taskId={sub.id}
                                          currentStatus={sub.task_status}
                                          onStatusUpdate={handleUpdateTaskStatus}
                                          isEditable={
                                            userRole === "admin" ||
                                            employeeType === "Manager" ||
                                            employeeType === "Supervisor" ||
                                            employeeType === "Executive"
                                          }
                                        />
                                      </td>
                                      <td
                                        data-label="Action"
                                        className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                                      >
                                        <div className="flex space-x-3 rtl:space-x-reverse">
                                          <button
                                            className="action-btn"
                                            type="button"
                                            onClick={(e) => handleOpenEditModal(sub, e)}
                                          >
                                            <Icon icon="heroicons:pencil-square" />
                                          </button>
                                          <button
                                            className="action-btn"
                                            type="button"
                                            onClick={(e) =>
                                              handleDelete(
                                                sub.id,
                                                sub.task_title,
                                                statusName,
                                                e
                                              )
                                            }
                                          >
                                            <Icon icon="heroicons:trash" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                        {data.currentPage < data.lastPage && (
                          <div className="flex justify-center p-4">
                            <Button
                              text={data.isLoading ? "Loading..." : "Load More"}
                              className="btn-outline-dark btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchStatusTasks(
                                  statusName,
                                  data.currentPage + 1,
                                  true
                                );
                              }}
                              disabled={data.isLoading}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      <EditTask
        activeModal={editTaskModal}
        onClose={() => setEditTaskModal(false)}
        task={currentTask}
        onUpdate={() => fetchStatusTasks("On Hold", 1)}
      />

      <TaskListAssignee
        activeModal={assigneeModal}
        onClose={() => setAssigneeModal(false)}
        task={taskForAssignees}
        onUpdate={() => fetchStatusTasks("On Hold", 1)}
      />
    </>
  );
};

export default TaskList;