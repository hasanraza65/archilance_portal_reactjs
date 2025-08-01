import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTable, useSortBy } from "react-table";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { getApiPrefix } from "@/pages/utility/apiHelper";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import TableLoading from "@/components/skeleton/Table";
import EditTask from "./EditTask";
import EditableTaskStatus from "./EditableTaskStatus";

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

const TaskList = ({ statusFilter, onLoadingChange }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userRole = getApiPrefix();

  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  useEffect(() => {
    if (onLoadingChange) {
      onLoadingChange(isLoading);
    }
  }, [isLoading, onLoadingChange]);

  const fetchTasks = useCallback(async (filter) => {
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

      const params = new URLSearchParams();
      if (filter && filter.toLowerCase() !== "all") {
        params.append("task_status", filter);
      }

      let allTasks = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        params.set("page", currentPage);
        const response = await axios.get(`${baseUrl}?${params.toString()}`, {
          headers,
        });
        allTasks.push(...(response.data.data || []));
        lastPage = response.data.last_page || 1;
        currentPage++;
      } while (currentPage <= lastPage);

      setTasks(allTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      if (err.response?.status === 404) {
        setTasks([]);
      } else {
        setError("Failed to load tasks. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(statusFilter);
  }, [statusFilter, fetchTasks]);

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
              fetchTasks(statusFilter);
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
    [statusFilter, fetchTasks]
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const COLUMNS = useMemo(
    () => [
      {
        Header: "Jobs",
        accessor: (row) => row.project?.project_name || "N/A",
        Cell: ({ value }) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {value}
          </span>
        ),
      },
      {
        Header: "Projects",
        accessor: "task_title",
        Cell: ({ value }) => (
          <span className="font-medium text-slate-600 capitalize">{value}</span>
        ),
      },
      {
        Header: "Assigned To",
        accessor: "assignees",
        Cell: ({ value }) => <AvatarStack assignees={value} />,
      },
      {
        Header: "Start Date",
        accessor: "created_at",
        Cell: ({ value }) => <span>{formatDate(value)}</span>,
      },
      {
        Header: "End Date",
        accessor: "due_date",
        Cell: ({ value }) => <span>{formatDate(value)}</span>,
      },
      {
        Header: "Status",
        accessor: "task_status",
        Cell: ({ row }) => (
          <EditableTaskStatus
            taskId={row.original.id}
            currentStatus={row.original.task_status}
            onStatusUpdate={() => fetchTasks(statusFilter)}
            isEditable={userRole !== "customer"}
          />
        ),
      },
      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => (
          <div
            className="flex items-center justify-center space-x-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
              title="Edit Task"
              onClick={(e) => handleOpenEditModal(row.original, e)}
            >
              <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              title="Delete Task"
              onClick={(e) =>
                handleDelete(row.original.id, row.original.task_title, e)
              }
            >
              <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [
      navigate,
      handleOpenEditModal,
      handleDelete,
      userRole,
      statusFilter,
      fetchTasks,
    ]
  );

  const data = useMemo(() => tasks, [tasks]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns: COLUMNS,
        data,
      },
      useSortBy
    );

  const handleRowClick = (row) => {
    if (userRole === "customer") {
      return;
    }
    navigate(`/task/${row.original.id}`);
  };

  if (isLoading) return <TableLoading count={10} />;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (tasks.length === 0) {
    return (
      <div className="p-16 text-center text-slate-500">
        <Icon icon="heroicons-outline:inbox" className="mx-auto h-12 w-12" />
        <h4 className="mt-2 text-lg font-medium">No Projects Found</h4>
        {statusFilter.toLowerCase() !== "all" ? (
          <p className="mt-1">
            There are no projects with the status "
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
            <table
              className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
              {...getTableProps()}
            >
              <thead className="bg-slate-50 dark:bg-slate-700">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        scope="col"
                        className="table-th"
                      >
                        {column.render("Header")}
                        <span>
                          {column.isSorted
                            ? column.isSortedDesc
                              ? " 🔽"
                              : " 🔼"
                            : ""}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                {...getTableBodyProps()}
              >
                {rows.map((row) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      onClick={() => handleRowClick(row)}
                      className="even:bg-slate-50 dark:even:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      {row.cells.map((cell) => (
                        <td {...cell.getCellProps()} className="table-td">
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <EditTask
        activeModal={editTaskModal}
        onClose={() => setEditTaskModal(false)}
        task={currentTask}
        onUpdate={() => fetchTasks(statusFilter)}
      />
    </>
  );
};

export default TaskList;
