import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie"; // === Naya Import ===
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import Swal from "sweetalert2";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  deleteProjectAPI,
  setEditModalAndItem,
  toggleUpdateAssigneesModal,
  fetchProjectsAPI, // === Naya Import (Refresh ke liye) ===
} from "./store";
import { getApiPrefix } from "@/pages/utility/apiHelper";

// === Puraane 'EditableStatusCell' ki jagah naye component ko import karein ===
import EditableProjectStatus from "./EditableProjectStatus";

// AvatarStack component mein koi badlav nahi
const AvatarStack = ({ assignees }) => {
  if (!assignees || assignees.length === 0)
    return <span className="text-slate-400">N/A</span>;
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
  return (
    <div className="flex items-center -space-x-2">
      {assignees.slice(0, 3).map(({ id, user }) => {
        if (!user) return null;
        const avatarUrl = user.profile_pic
          ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${user.profile_pic}`
          : null;
        return (
          <div
            key={id}
            title={user.name}
            className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold"
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

const ProjectList = ({ projects }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // === `currentPage` ko Redux state se lein ===
  const { isDeleting, isUpdating, currentPage } = useSelector((state) => state.project);
  const userRole = getApiPrefix();

  // === API ke liye zaroori variables ===
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  const token = Cookies.get("token");

  // API path ke liye helper function
  const getApiBasePathForRole = (basePath) => {
    const role = getApiPrefix();
    const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
    return role ? `/api/${role}${cleanBasePath}` : `/api/admin${cleanBasePath}`;
  };

  const handleOpenAssigneesModal = (project, e) => {
    e.stopPropagation();
    dispatch(toggleUpdateAssigneesModal({ open: true, project }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime())
        ? "Invalid Date"
        : d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handleRowNavigation = (projectId) => {
    if (!projectId) return;
    if (userRole === "customer")
      navigate(`/customer/order-details/${projectId}`);
    else navigate(`/projects/${projectId}`);
  };

  const handleEdit = (item, e) => {
    e.stopPropagation();
    dispatch(setEditModalAndItem({ open: true, project: item }));
  };

  const handleDelete = (item, e) => {
    e.stopPropagation();
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${item.name || "this project"}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProjectAPI(item.id))
          .unwrap()
          .then(() =>
            Swal.fire(
              "Deleted!",
              `Project "${item.name}" has been deleted.`,
              "success"
            )
          )
          .catch((error) =>
            Swal.fire(
              "Failed!",
              `Could not delete. ${error || "Try again."}`,
              "error"
            )
          );
      }
    });
  };

  const COLUMNS = useMemo(() => {
    const baseColumns = [
      {
        Header: "Name",
        accessor: "name",
        Cell: ({ cell: { value } }) => (
          <div className="flex space-x-3 items-center text-left rtl:space-x-reverse">
            <div className="flex-none">
              <div className="h-10 w-10 rounded-full text-sm bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-medium -tracking-[1px]">
                {value
                  ? (value.charAt(0) + (value.charAt(1) || "")).toUpperCase()
                  : "NA"}
              </div>
            </div>
            <div className="flex-1 font-medium text-sm leading-4 whitespace-nowrap">
              {value && value.length > 25
                ? value.substring(0, 25) + "..."
                : value || "N/A"}
            </div>
          </div>
        ),
      },
      {
        Header: "Assigned To",
        accessor: "project_assignees",
        Cell: ({ cell: { value }, row }) => (
          <div
            className="cursor-pointer"
            onClick={(e) => handleOpenAssigneesModal(row.original, e)}
          >
            <AvatarStack assignees={value} />
          </div>
        ),
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ cell: { value } }) => <span>{formatDate(value)}</span>,
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ cell: { value } }) => <div>{formatDate(value)}</div>,
      },
      {
        Header: "Status",
        accessor: "status",
        // === FINAL FIX: Yahan naye component ka istemal karein ===
        Cell: ({ cell: { value }, row }) => (
          <EditableProjectStatus
            projectId={row.original.id}
            currentStatus={value}
            onStatusUpdate={() => dispatch(fetchProjectsAPI(currentPage))}
            isEditable={userRole === "admin"}
            apiBaseUrl={API_BASE_URL}
            apiPath={getApiBasePathForRole("/update-project-status")}
            token={token}
          />
        ),
      },
    ];

    if (userRole !== "customer") {
      baseColumns.push({
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => {
          const projectItem = row.original;
          const actionsDisabled = isDeleting || isUpdating;
          return (
            <div
              className="flex items-center justify-center space-x-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowNavigation(projectItem.id);
                }}
                className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors duration-200"
                title="View Project"
              >
                <Icon icon="heroicons-outline:eye" className="w-4 h-4" />
              </button>
              {userRole === "admin" && (
                <>
                  <button
                    onClick={(e) => handleEdit(projectItem, e)}
                    disabled={actionsDisabled}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      actionsDisabled
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : "hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400"
                    }`}
                    title="Edit Project"
                  >
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(projectItem, e)}
                    disabled={actionsDisabled}
                    className={`p-2 rounded-full transition-colors duration-200 ${
                      actionsDisabled
                        ? "opacity-50 cursor-not-allowed text-gray-400"
                        : "hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    }`}
                    title="Delete Project"
                  >
                    <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          );
        },
      });
    }
    return baseColumns;
    // === Dependencies mein zaroori cheezein add karein ===
  }, [isDeleting, isUpdating, userRole, dispatch, currentPage, token]);

  const data = useMemo(() => projects || [], [projects]);
  const { getTableProps, getTableBodyProps, headerGroups, page, prepareRow } =
    useTable(
      { columns: COLUMNS, data, initialState: { pageSize: 10 } },
      useGlobalFilter,
      useSortBy,
      usePagination,
      useRowSelect
    );

  if (!projects || projects.length === 0) return null;

  return (
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
                      className="even:bg-slate-50 dark:even:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600"
                    >
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          className="table-td"
                          style={{
                            cursor:
                              userRole !== "customer" &&
                              cell.column.id !== "action"
                                ? "pointer"
                                : "default",
                          }}
                          onClick={() => {
                            const specialClickColumns = [
                              "endDate",
                              "status",
                              "project_assignees",
                              "action",
                            ];
                            if (!specialClickColumns.includes(cell.column.id)) {
                              handleRowNavigation(row.original.id);
                            }
                          }}
                        >
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
    </Card>
  );
};

export default ProjectList;