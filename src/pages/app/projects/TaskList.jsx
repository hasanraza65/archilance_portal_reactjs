import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import {
  getApiPrefix,
  getEmployeeType,
  getApiBasePathForRole,
} from "@/pages/utility/apiHelper";

import Icon from "@/components/ui/Icon";
import TableLoading from "@/components/skeleton/Table";
import EditTask from "./EditTask";
import EditableTaskStatus from "./EditableTaskStatus";
import EditableDueDate from "./EditTaskDate/EditableDueDate";
import EditableStartDate from "./EditTaskDate/EditableStartDate";
import TaskListAssignee from "./TaskListAssignee";

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

// --- IS COMPONENT KO UPDATE KAREIN ---
const AvatarStack = ({ assignees, onClick }) => {
  // Jab koi assignee na ho, tab bhi ek clickable element return karein
  if (!assignees || assignees.length === 0) {
    return (
      // Is div par onClick lagaya gaya hai
      <div onClick={onClick} className="cursor-pointer">
        <span className="text-slate-400">N/A</span>
      </div>
    );
  }

  const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  return (
    <div className="flex items-center -space-x-2 cursor-pointer" onClick={onClick}>
      {assignees.slice(0, 3).map(({ user }) => {
        if (!user) return null;
        const avatarUrl = user.profile_pic
          ? `${VITE_BASE_URL}/storage/${user.profile_pic}`
          : null;
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

// ... baaki TaskList component ka code same rahega
const StatusBadge = ({ status }) => {
  const statusColors = {
    backlog:
      "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    todo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in progress":
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    review:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  const defaultColor =
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
        statusColors[status?.toLowerCase()] || defaultColor
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

const TaskList = ({
  statusFilter,
  searchQuery,
  onLoadingChange,
  assignedToMe,
}) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRole = getApiPrefix();
  const employeeType = getEmployeeType();

  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const [assigneeModal, setAssigneeModal] = useState(false);
  const [taskForAssignees, setTaskForAssignees] = useState(null);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }

    try {
      const apiPath = getApiBasePathForRole("/projects-with-tasks");
      const baseUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const params = {};
      if (assignedToMe) {
        params.assigned_me = 1;
      }

      const response = await axios.get(baseUrl, { headers, params });

      if (Array.isArray(response.data)) {
        setTasks(response.data);

        const statuses = [
          ...new Set(
            response.data.map((item) => {
              const taskToShow = item.sub_task || item.task;
              return taskToShow.task_status?.toLowerCase();
            })
          ),
        ];

        const initialExpandedState = {};
        statuses.forEach((status) => {
          initialExpandedState[status] = true;
        });

        setExpandedSections(initialExpandedState);
      } else {
        setTasks([]);
        setExpandedSections({});
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setTasks([]);
        setExpandedSections({});
      } else {
        setError("Failed to load tasks. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [assignedToMe]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleUpdateTaskStatus = useCallback((taskId, newStatus) => {
    setTasks((prevTasks) =>
      prevTasks.map((item) => {
        const taskToUpdate = item.sub_task || item.task;
        if (taskToUpdate && taskToUpdate.id === taskId) {
          const updatedTask = { ...taskToUpdate, task_status: newStatus };
          if (item.sub_task) {
            return { ...item, sub_task: updatedTask };
          } else {
            return { ...item, task: updatedTask };
          }
        }
        return item;
      })
    );
  }, []);

  const handleUpdateTaskStartDate = useCallback((taskId, newStartDate) => {
    setTasks((prevTasks) =>
      prevTasks.map((item) => {
        const taskToUpdate = item.sub_task || item.task;
        if (taskToUpdate && taskToUpdate.id === taskId) {
          const updatedTask = { ...taskToUpdate, created_at: newStartDate };
          if (item.sub_task) {
            return { ...item, sub_task: updatedTask };
          } else {
            return { ...item, task: updatedTask };
          }
        }
        return item;
      })
    );
  }, []);

  const handleUpdateTaskDueDate = useCallback((taskId, newDueDate) => {
    setTasks((prevTasks) =>
      prevTasks.map((item) => {
        const taskToUpdate = item.sub_task || item.task;
        if (taskToUpdate && taskToUpdate.id === taskId) {
          const updatedTask = { ...taskToUpdate, due_date: newDueDate };
          if (item.sub_task) {
            return { ...item, sub_task: updatedTask };
          } else {
            return { ...item, task: updatedTask };
          }
        }
        return item;
      })
    );
  }, []);

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const transformedData = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];

    return tasks.map((item) => {
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
      };
    });
  }, [tasks]);

  const groupedData = useMemo(() => {
    const grouped = {};

    transformedData.forEach((item) => {
      const status = item.task_status?.toLowerCase() || "unknown";
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(item);
    });

    return grouped;
  }, [transformedData]);

  const filteredData = useMemo(() => {
    const result = {};

    Object.keys(groupedData).forEach((status) => {
      if (
        statusFilter &&
        statusFilter.toLowerCase() !== "all" &&
        status !== statusFilter.toLowerCase()
      ) {
        return;
      }

      let dataToFilter = groupedData[status];

      if (searchQuery && searchQuery.trim() !== "") {
        const lowerCaseQuery = searchQuery.toLowerCase();
        dataToFilter = dataToFilter.filter(
          (row) =>
            row.project_name?.toLowerCase().includes(lowerCaseQuery) ||
            row.project_title?.toLowerCase().includes(lowerCaseQuery) ||
            row.task_title?.toLowerCase().includes(lowerCaseQuery)
        );
      }

      if (dataToFilter.length > 0) {
        result[status] = dataToFilter;
      }
    });

    return result;
  }, [groupedData, statusFilter, searchQuery]);

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
    (taskId, taskTitle, e) => {
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
          const deleteApiPath = getApiBasePathForRole(
            `/project-task/${taskId}`
          );
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
              fetchTasks();
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
    [fetchTasks]
  );

  const handleRowClick = (rowData) => {
     // Is function ki ab zaroorat nahi agar links par click ho raha hai, 
     // lekin fallback ke liye rakha ja sakta hai jab row mein kahin aur click ho.
    navigate(`/project/${rowData.id}`, {
        state: { jobId: rowData.project_id },
    });
  };

  const getStatusGradient = (status) => {
    const statusGradients = {
      backlog:
        "from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800",
      todo: "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900",
      "in progress":
        "from-amber-50 to-amber-100 dark:from-amber-800 dark:to-amber-900",
      review:
        "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900",
      done: "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
      completed:
        "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
    };

    return (
      statusGradients[status] ||
      "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
    );
  };

  if (isLoading) return <TableLoading count={10} />;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const hasData = Object.keys(filteredData).length > 0;

  if (!hasData) {
    return (
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
    );
  }

  return (
    <>
      <ResponsiveTableStyles />
      <div className="w-full">
        <div className="w-full align-middle">
          <div className="w-full space-y-4">
            {Object.entries(filteredData).map(([status, tasks]) => (
              <div
                key={status}
                className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
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
                      {tasks.length}
                    </span>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {expandedSections[status] && (
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-2 md:p-0">
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
                        {tasks.map((rowData, index) => (
                          <tr
                            key={index}
                            onClick={() => handleRowClick(rowData)}
                            className="block md:table-row md:hover:bg-slate-50 md:dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-150"
                          >
                            <td
                              data-label="Job"
                              className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                            >
                              <a
                                href={`/jobs/${rowData.project_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-medium text-slate-800 dark:text-slate-200 text-sm hover:underline"
                              >
                                {rowData.project_name}
                              </a>
                            </td>
                            <td
                              data-label="Project"
                              className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                            >
                              <a
                                href={`/project/${rowData.parent_task_id || rowData.id}`}
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
                                    employeeType === "Supervisor"
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
                                    employeeType === "Supervisor"
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
                                  employeeType === "Supervisor"
                                }
                              />
                            </td>
                            <td
                              data-label="Action"
                              className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                            >
                              {(userRole === "admin" ||
                                employeeType === "Manager" ||
                                employeeType === "Supervisor") && (
                                <div
                                  className="flex items-center justify-end space-x-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors duration-200"
                                    title="Edit Task"
                                    onClick={(e) =>
                                      handleOpenEditModal(
                                        rowData.original_task_data,
                                        e
                                      )
                                    }
                                  >
                                    <Icon
                                      icon="heroicons:pencil-square"
                                      className="w-4 h-4"
                                    />
                                  </button>
                                  <button
                                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200"
                                    title="Delete Task"
                                    onClick={(e) => {
                                      const titleToDelete =
                                        rowData.task_title ||
                                        rowData.project_title;
                                      handleDelete(
                                        rowData.id,
                                        titleToDelete,
                                        e
                                      );
                                    }}
                                  >
                                    <Icon
                                      icon="heroicons-outline:trash"
                                      className="w-4 h-4"
                                    />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <EditTask
        activeModal={editTaskModal}
        onClose={() => setEditTaskModal(false)}
        task={currentTask}
        onUpdate={fetchTasks}
      />

      <TaskListAssignee
        activeModal={assigneeModal}
        onClose={() => setAssigneeModal(false)}
        task={taskForAssignees}
        onUpdate={fetchTasks}
      />
    </>
  );
};

export default TaskList;