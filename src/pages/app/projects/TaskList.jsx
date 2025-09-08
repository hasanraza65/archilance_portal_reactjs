import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { getApiPrefix, getEmployeeType } from "@/pages/utility/apiHelper";

import Icon from "@/components/ui/Icon";
import TableLoading from "@/components/skeleton/Table";
import EditTask from "./EditTask";
import EditableTaskStatus from "./EditableTaskStatus";
import EditableDueDate from "./EditableDueDate";

const getAuthToken = () => Cookies.get("token");

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
};

const AvatarStack = ({ assignees }) => {
  if (!assignees || assignees.length === 0)
    return <span className="text-slate-400">N/A</span>;
  const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  return (
    <div className="flex items-center -space-x-2">
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
            className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-medium"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-slate-600 dark:text-slate-300">
                {getInitials(user.name)}
              </span>
            )}
          </div>
        );
      })}
      {assignees.length > 3 && (
        <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
};

const TaskList = ({ statusFilter, searchQuery, onLoadingChange, assignedToMe }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRole = getApiPrefix();
  const employeeType = getEmployeeType();

  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

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
        
        // Initialize expanded sections - open backlog by default, others collapsed
        const statuses = [...new Set(response.data.map(item => {
          const taskToShow = item.sub_task || item.task;
          return taskToShow.task_status?.toLowerCase();
        }))];
        
        const initialExpandedState = {};
        statuses.forEach(status => {
          initialExpandedState[status] = status === 'backlog';
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
    setTasks(prevTasks =>
      prevTasks.map(item => {
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

  const handleUpdateTaskDueDate = useCallback((taskId, newDueDate) => {
    setTasks(prevTasks =>
      prevTasks.map(item => {
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
    setExpandedSections(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const transformedData = useMemo(() => {
    if (!tasks || !Array.isArray(tasks)) return [];
    
    return tasks.map(item => {
      const taskToShow = item.sub_task || item.task;
      
      return {
        id: taskToShow.id,
        project_name: item.project?.project_name || 'N/A',
        project_title: item.task?.task_title || 'N/A',
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
    
    transformedData.forEach(item => {
      const status = item.task_status?.toLowerCase() || 'unknown';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(item);
    });
    
    return grouped;
  }, [transformedData]);

  const filteredData = useMemo(() => {
    const result = {};
    
    Object.keys(groupedData).forEach(status => {
      // Apply status filter if specified
      if (statusFilter && statusFilter.toLowerCase() !== "all" && status !== statusFilter.toLowerCase()) {
        return;
      }
      
      // Apply search filter
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
              fetchTasks();
            })
            .catch((error) => {
              Swal.fire(
                "Failed!",
                error.response?.data?.message || "The task could not be deleted.",
                "error"
              );
            });
        }
      });
    },
    [fetchTasks]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRowClick = (rowData) => {
    if (userRole === "customer") {
      return;
    }
    navigate(`/project/${rowData.id}`);
  };

  if (isLoading) return <TableLoading count={10} />;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  const hasData = Object.keys(filteredData).length > 0;

  if (!hasData) {
    return (
      <div className="p-16 text-center text-slate-500">
        <Icon icon="heroicons-outline:inbox" className="mx-auto h-12 w-12" />
        <h4 className="mt-2 text-lg font-medium">No Tasks Found</h4>
        {searchQuery ? (
           <p className="mt-1">No tasks match your search for "<span className="font-semibold">{searchQuery}</span>".</p>
        ) : statusFilter.toLowerCase() !== "all" ? (
          <p className="mt-1">
            There are no tasks with the status "
            <span className="font-semibold capitalize">{statusFilter}</span>".
          </p>
        ) : (
          <p>There are currently no tasks to display.</p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-6">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            {Object.entries(filteredData).map(([status, tasks]) => (
              <div key={status} className="mb-6">
                <div 
                  className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 cursor-pointer"
                  onClick={() => toggleSection(status)}
                >
                  <h3 className="text-lg font-medium capitalize">
                    {status} ({tasks.length})
                  </h3>
                  <Icon 
                    icon={expandedSections[status] ? "heroicons:chevron-up" : "heroicons:chevron-down"} 
                    className="w-5 h-5" 
                  />
                </div>
                
                {expandedSections[status] && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="table-th">Jobs</th>
                          <th className="table-th">Projects</th>
                          <th className="table-th">Task</th>
                          <th className="table-th">Assigned To</th>
                          <th className="table-th">Start Date</th>
                          <th className="table-th">Due Date</th>
                          <th className="table-th">Status</th>
                          <th className="table-th">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700">
                        {tasks.map((rowData, index) => (
                          <tr
                            key={index}
                            onClick={() => handleRowClick(rowData)}
                            className="even:bg-slate-50 dark:even:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                          >
                            <td className="table-td">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {rowData.project_name}
                              </span>
                            </td>
                            <td className="table-td">
                              <span className="font-medium text-slate-600 capitalize">
                                {rowData.project_title}
                              </span>
                            </td>
                            <td className="table-td">
                              <span className="text-slate-500 capitalize">
                                {rowData.task_title || 'N/A'}
                              </span>
                            </td>
                            <td className="table-td">
                              <AvatarStack assignees={rowData.assignees} />
                            </td>
                            <td className="table-td">
                              <span>{formatDate(rowData.created_at)}</span>
                            </td>
                            <td className="table-td">
                              <EditableDueDate
                                taskId={rowData.id}
                                currentDueDate={rowData.due_date}
                                onDateUpdate={handleUpdateTaskDueDate}
                                isEditable={userRole === "admin" || employeeType === "Manager"}
                              />
                            </td>
                            <td className="table-td">
                              <EditableTaskStatus
                                taskId={rowData.id}
                                currentStatus={rowData.task_status}
                                onStatusUpdate={handleUpdateTaskStatus}
                                isEditable={userRole === "admin" || employeeType === "Manager"}
                              />
                            </td>
                            <td className="table-td">
                              <div
                                className="flex items-center justify-center space-x-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                                  title="Edit Task"
                                  onClick={(e) => handleOpenEditModal(rowData.original_task_data, e)}
                                >
                                  <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                                  title="Delete Task"
                                  onClick={(e) => {
                                    const titleToDelete = rowData.task_title || rowData.project_title;
                                    handleDelete(rowData.id, titleToDelete, e);
                                  }}
                                >
                                  <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
                                </button>
                              </div>
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
    </>
  );
};

export default TaskList;