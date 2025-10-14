import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import GridLoading from "@/components/skeleton/Grid";
import { getEmployeeType, getApiPrefix } from "@/pages/utility/apiHelper";

import EditableTaskStatus from "../EditableTaskStatus";
import EditableDueDate from "../EditTaskDate/EditableDueDate";
import EditableStartDate from "../EditTaskDate/EditableStartDate";
import EditTask from "../EditTask";

const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const STATUS_ORDER = [
  "On Hold",
  "Backlog",
  "Awaiting Info",
  "In Progress",
  "In-house review",
  "Client Review",
  "Completed",
];

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const getAuthToken = () => Cookies.get("token");

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const statusConfig = {
  "On Hold": {
    badge: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200",
    gradient:
      "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
  },
  Backlog: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    gradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
  },
  "Awaiting Info": {
    badge:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    gradient:
      "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900",
  },
  "In Progress": {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    gradient:
      "from-amber-50 to-amber-100 dark:from-amber-800 dark:to-amber-900",
  },
  "In-house review": {
    badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    gradient: "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900",
  },
  "Client Review": {
    badge:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    gradient:
      "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900",
  },
  Completed: {
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    gradient:
      "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
  },
  Default: {
    badge: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    gradient: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900",
  },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig["Default"];
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${config.badge}`}
    >
      {status || "Unknown"}
    </span>
  );
};

const MemberTaskTable = ({ memberTasksByStatus, onUpdate }) => {
  const [expandedSections, setExpandedSections] = useState({});
  const navigate = useNavigate();
  const userRole = getApiPrefix();
  const employeeType = getEmployeeType();
  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  useEffect(() => {
    const firstStatusWithTasks = STATUS_ORDER.find(
      (status) => memberTasksByStatus[status]?.count > 0
    );
    if (firstStatusWithTasks) {
      setExpandedSections({ [firstStatusWithTasks]: true });
    }
  }, []);

  const handleUpdateTask = () => {
    onUpdate();
  };

  const handleOpenEditModal = useCallback((task, e) => {
    e.stopPropagation();
    setCurrentTask(task);
    setEditTaskModal(true);
  }, []);

  const handleDelete = useCallback(
    (taskId, taskTitle, e) => {
      e.stopPropagation();
      Swal.fire({
        title: "Are you sure?",
        text: `You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6e7881",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          axios
            .delete(
              `${VITE_BASE_URL}${getApiBasePathForRole(
                `/project-task/${taskId}`
              )}`,
              {
                headers: { Authorization: `Bearer ${getAuthToken()}` },
              }
            )
            .then(() => {
              Swal.fire("Deleted!", "The task has been deleted.", "success");
              onUpdate();
            })
            .catch((error) => {
              Swal.fire(
                "Failed!",
                error.response?.data?.message || "Could not delete task.",
                "error"
              );
            });
        }
      });
    },
    [onUpdate]
  );

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleRowClick = (taskData) => {
    if (userRole === "customer") return;
    const breadcrumbs = [{ title: "Jobs", link: "/jobs" }];
    if (taskData.project)
      breadcrumbs.push({
        title: taskData.project.project_name,
        link: `/jobs/${taskData.project.id}`,
      });
    if (taskData.parent_task)
      breadcrumbs.push({
        title: taskData.parent_task.task_title,
        link: `/project/${taskData.parent_task.id}`,
      });
    breadcrumbs.push({ title: taskData.task_title });
    navigate(`/project/${taskData.id}`, {
      state: { breadcrumbs, jobId: taskData.project?.id },
    });
  };

  return (
    <div className="space-y-3 pt-4">
      {STATUS_ORDER.map((status) => {
        const statusData = memberTasksByStatus[status];
        if (!statusData || statusData.count === 0) return null;

        const isOpen = expandedSections[status];
        const config = statusConfig[status] || statusConfig["Default"];

        return (
          <div
            key={status}
            className={`rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-gradient-to-r ${config.gradient}`}
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleSection(status)}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  icon={
                    isOpen
                      ? "heroicons:chevron-down"
                      : "heroicons:chevron-right"
                  }
                  className="w-5 h-5 text-slate-600 dark:text-slate-300 transition-transform"
                />
                <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                  {status}
                </h3>
                <span className="flex items-center justify-center h-6 w-6 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-inner">
                  {statusData.count}
                </span>
              </div>
              <StatusBadge status={status} />
            </div>

            {isOpen && (
              <div className="w-full bg-white dark:bg-slate-800 p-2 md:p-0">
                <table className="min-w-full responsive-task-table">
                  <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/5">
                        Jobs
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/5">
                        Projects
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/5">
                        Task
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/8">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/8">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/8">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-1/12">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-transparent md:bg-white md:dark:bg-slate-800 md:divide-y md:divide-slate-200 md:dark:divide-slate-700">
                    {statusData.tasks.map((task) => {
                      const isEditable = userRole === "admin" || employeeType === "Manager" || employeeType === "Supervisor" || employeeType === "Executive";
                      return (
                        <tr
                          key={task.id}
                          onClick={() => handleRowClick(task)}
                          className="block md:table-row hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                          <td
                            data-label="Job"
                            className="block md:table-cell px-4 py-3"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                              {task.project?.project_name || "N/A"}
                            </span>
                          </td>
                          <td
                            data-label="Project"
                            className="block md:table-cell px-4 py-3"
                          >
                            <span className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                              {task.parent_task?.task_title || "N/A"}
                            </span>
                          </td>
                          <td
                            data-label="Task"
                            className="block md:table-cell px-4 py-3"
                          >
                            <span className="text-slate-700 dark:text-slate-300 text-sm">
                              {task.task_title || "N/A"}
                            </span>
                          </td>
                          <td
                            data-label="Start Date"
                            className="block md:table-cell px-4 py-3"
                          >
                            <EditableStartDate
                              taskId={task.id}
                              currentStartDate={task.created_at}
                              onDateUpdate={handleUpdateTask}
                              isEditable={isEditable}
                            />
                          </td>
                          <td
                            data-label="Due Date"
                            className="block md:table-cell px-4 py-3"
                          >
                            <EditableDueDate
                              taskId={task.id}
                              currentDueDate={task.due_date}
                              onDateUpdate={handleUpdateTask}
                              isEditable={isEditable}
                            />
                          </td>
                          <td
                            data-label="Status"
                            className="block md:table-cell px-4 py-3"
                          >
                            <EditableTaskStatus
                              taskId={task.id}
                              currentStatus={task.task_status}
                              onStatusUpdate={handleUpdateTask}
                              isEditable={isEditable}
                            />
                          </td>
                          <td
                            data-label="Action"
                            className="block md:table-cell px-4 py-3"
                          >
                            {isEditable && (
                              <div
                                className="flex items-center justify-end space-x-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  title="Edit"
                                  onClick={(e) => handleOpenEditModal(task, e)}
                                  className="p-2 rounded-full hover:bg-green-100 dark:hover:bg-green-800/20 text-green-600"
                                >
                                  <Icon
                                    icon="heroicons:pencil-square"
                                    className="w-4 h-4"
                                  />
                                </button>
                                <button
                                  title="Delete"
                                  onClick={(e) =>
                                    handleDelete(task.id, task.task_title, e)
                                  }
                                  className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-800/20 text-red-600"
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
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
      {currentTask && (
        <EditTask
          activeModal={editTaskModal}
          onClose={() => setEditTaskModal(false)}
          task={currentTask}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
};

const MembersView = () => {
  const [membersData, setMembersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMemberId, setOpenMemberId] = useState(null);

  const fetchMembersData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const userRole = getApiPrefix();
    const employeeType = getEmployeeType();

    if (userRole !== "admin" && employeeType !== "Manager" && employeeType !== "Supervisor" && employeeType !== "Executive") {
      setError("You are not authorized to view this information.");
      setIsLoading(false);
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      setError("Authentication failed. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const apiPath = getApiBasePathForRole("/projects-with-members");
      const apiUrl = `${VITE_BASE_URL}${apiPath}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      setMembersData(response.data);
    } catch (err) {
      setError("Failed to fetch members data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembersData();
  }, [fetchMembersData]);

  // --- UPDATED CODE ---
  // Is useEffect ki dependency array se `openMemberId` ko hata diya gaya hai.
  // Ab yeh sirf `membersData` ke change hone par (yaani pehli baar load hone par) chalega.
  useEffect(() => {
    if (membersData.length > 0 && openMemberId === null) {
      setOpenMemberId(membersData[0].id);
    }
  }, [membersData]);

  const handleToggleMember = (memberId) => {
    setOpenMemberId((prevId) => (prevId === memberId ? null : memberId));
  };

  useEffect(() => {
    const styleId = "responsive-task-list-styles";
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .responsive-task-table td, .responsive-task-table th { word-break: break-word; }
      @media (max-width: 767px) {
        .responsive-task-table thead { display: none; }
        .responsive-task-table tbody tr { display: block; margin-bottom: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); background-color: #ffffff; }
        .dark .responsive-task-table tbody tr { border-color: #334155; background-color: #1e293b; }
        .responsive-task-table td { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; text-align: right; border-bottom: 1px solid #f1f5f9; }
        .dark .responsive-task-table td { border-bottom-color: #334155; }
        .responsive-task-table tr td:last-child { border-bottom: none; }
        .responsive-task-table td::before { content: attr(data-label); font-weight: 600; text-align: left; margin-right: 1rem; color: #475569; }
        .dark .responsive-task-table td::before { color: #94a3b8; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (isLoading) return <GridLoading count={4} />;
  if (error)
    return (
      <div className="p-4 text-center text-red-500 bg-red-100 rounded-lg">
        {error}
      </div>
    );

  return (
    <div className="space-y-4">
      {membersData.map((member) => (
        <Card key={member.id} bodyClass="p-0">
          <div
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 cursor-pointer"
            onClick={() => handleToggleMember(member.id)}
          >
            <div className="flex items-center space-x-4">
              <img
                src={`${VITE_BASE_URL}/storage/${member.profile_pic}`}
                alt={member.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h5 className="font-semibold text-slate-700 dark:text-slate-200">
                  {member.name}
                </h5>
                <p className="text-sm text-slate-500 break-all">
                  {member.email}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 sm:space-x-4">
              <span className="inline-block px-3 py-1 text-sm font-semibold text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                {member.total_tasks} Tasks
              </span>
              <Icon
                icon={
                  openMemberId === member.id
                    ? "heroicons-outline:chevron-up"
                    : "heroicons-outline:chevron-down"
                }
                className="w-6 h-6 text-slate-500"
              />
            </div>
          </div>

          {openMemberId === member.id && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4">
              <MemberTaskTable
                memberTasksByStatus={member.tasks_by_status}
                onUpdate={fetchMembersData}
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default MembersView;