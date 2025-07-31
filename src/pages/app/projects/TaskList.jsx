import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { getApiPrefix } from "@/pages/utility/apiHelper";
// UI Components
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Pagination from "@/components/ui/Pagination";
import TableLoading from "@/components/skeleton/Table";
import EditTask from "./EditTask"; // Import the new modal component

// Helper function to get the auth token
const getAuthToken = () => Cookies.get("token");
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
// Helper Components
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
const StatusBadge = ({ status }) => {
  const getStatusClass = (s) => {
    s = String(s).toLowerCase();
    if (s.includes("progress")) return "bg-blue-100 text-blue-800";
    if (s.includes("completed") || s.includes("done"))
      return "bg-green-100 text-green-800";
    if (s.includes("todo") || s.includes("pending"))
      return "bg-yellow-100 text-yellow-800";
    if (s.includes("cancel")) return "bg-red-100 text-red-800";
    return "bg-slate-100 text-slate-800";
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${getStatusClass(status)}`}>
      {status.replace("_", " ")}
    </span>
  );
};

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  // State for the Edit Modal
  const [editTaskModal, setEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("taskListPage");
    return savedPage ? Number(savedPage) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem("taskListPage", String(currentPage));
  }, [currentPage]);

  const fetchTasks = useCallback(async (page) => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      setError("Authentication token not found.");
      setIsLoading(false);
      return;
    }
    try {
        const apiPath = getApiBasePathForRole("/");
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }${apiPath}projects-with-tasks?page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setTasks(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      if (err.response?.status === 404) {
        setCurrentPage(1);
      } else {
        setError("Failed to load tasks. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(currentPage);
  }, [currentPage, fetchTasks]);

  // Handler to open the edit modal
  const handleOpenEditModal = (task) => {
    setCurrentTask(task);
    setEditTaskModal(true);
  };

  const handleDelete = (taskId, taskTitle) => {
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
        axios
          .delete(
            `${
              import.meta.env.VITE_BACKEND_BASE_URL
            }/api/admin/project-task/${taskId}`,
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
            if (tasks.length === 1 && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            } else {
              fetchTasks(currentPage);
            }
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
  };

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
        Header: "Projects",
        accessor: (row) => row.project?.project_name || "N/A",
        Cell: ({ value }) => (
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {value}
          </span>
        ),
      },
      {
        Header: "Tasks",
        accessor: "task_title",
        Cell: ({ value }) => (
          <span className="font-medium text-red-500">{value}</span>
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
        Cell: ({ value }) => <StatusBadge status={value} />,
      },
      {
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => (
          <div className="flex items-center justify-center space-x-2">
            <button
              className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400"
              title="View Task"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/project/${row.original.id}`);
              }}
            >
              <Icon icon="heroicons-outline:eye" className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
              title="Edit Task"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(row.original);
              }}
            >
              <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
              title="Delete Task"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row.original.id, row.original.task_title);
              }}
            >
              <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [fetchTasks, currentPage, tasks.length, navigate]
  );

  const data = useMemo(() => tasks, [tasks]);

  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } =
    useTable(
      { columns: COLUMNS, data, manualPagination: true, pageCount: totalPages },
      useSortBy,
      usePagination
    );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (isLoading) {
    return <TableLoading count={10} />;
  }
  if (error) {
    return (
      <Card>
        <div className="p-4 text-center text-red-500">{error}</div>
      </Card>
    );
  }
  if (!tasks.length && currentPage === 1) {
    return (
      <Card>
        <div className="p-16 text-center text-slate-500">
          <Icon icon="heroicons-outline:inbox" className="mx-auto h-12 w-12" />
          <h4 className="mt-2 text-lg font-medium">No Tasks Found</h4>
          <p>There are currently no tasks to display.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card noBorder>
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
                  {page.map((row) => {
                    prepareRow(row);
                    return (
                      <tr
                        {...row.getRowProps()}
                        className="even:bg-slate-50 dark:even:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        {row.cells.map((cell) => {
                          return (
                            <td {...cell.getCellProps()} className="table-td">
                              {cell.render("Cell")}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>

      {!isLoading && tasks.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            className="bg-slate-100 dark:bg-slate-500 w-fit py-2 px-3 rounded-md"
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        </div>
      )}

      <EditTask
        activeModal={editTaskModal}
        onClose={() => setEditTaskModal(false)}
        task={currentTask}
        onUpdate={() => fetchTasks(currentPage)}
      />
    </>
  );
};

export default TaskList;
