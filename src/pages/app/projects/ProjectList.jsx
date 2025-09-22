import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
} from "react-table";
import Swal from "sweetalert2";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  deleteProjectAPI,
  setEditModalAndItem,
  toggleUpdateAssigneesModal,
  fetchProjectsAPI,
} from "./store";
import EditableProjectStatus from "./EditableProjectStatus";
import EditableProjectStartDate from "./EditProjectDate/EditableProjectStartDate";
import EditableProjectDueDate from "./EditProjectDate/EditableProjectDueDate";

const AvatarStack = ({ assignees }) => {
  if (!assignees || assignees.length === 0)
    return <span className="text-slate-400">N/A</span>;
  const getInitials = (name) => (name ? name.charAt(0).toUpperCase() : "U");
  return (
    <div className="flex items-center -space-x-2">
      {assignees.slice(0, 3).map(({ id, user }) => {
        if (!user) return null;
        const avatarUrl = user.profile_pic
          ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${
              user.profile_pic
            }`
          : null;
        return (
          <div
            key={id}
            title={user.name}
            className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold"
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
        <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
};

const ProjectList = ({ projects, userRole, employeeType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDeleting, isUpdating, currentPage } = useSelector(
    (state) => state.project
  );

  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
  const token = Cookies.get("token");

  const getApiBasePathForRole = (basePath) => {
    const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
    return userRole
      ? `/api/${userRole}${cleanBasePath}`
      : `/api/admin${cleanBasePath}`;
  };
  const handleOpenAssigneesModal = (project, e) => {
    e.stopPropagation();
    dispatch(toggleUpdateAssigneesModal({ open: true, project }));
  };

  const handleDataUpdate = () => {
    dispatch(fetchProjectsAPI(currentPage));
  };
  
  const handleRowNavigation = (projectId) => {
    if (!projectId) return;
    if (userRole === "customer") navigate(`/order-details/${projectId}`);
    else navigate(`/jobs/${projectId}`);
  };
  const handleEdit = (item, e) => {
    e.stopPropagation();
    dispatch(setEditModalAndItem({ open: true, project: item }));
  };
  const handleDelete = (item, e) => {
    e.stopPropagation();
    const displayName = item.customer?.name || item.name || "this project";
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${displayName}".`,
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
              `Project "${displayName}" has been deleted.`,
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
    // --- UPDATED CODE ---
    // Supervisor ko editable access diya gaya hai
    const isEditable = userRole === "admin" || employeeType === "Manager" || employeeType === "Supervisor";

    const baseColumns = [
      {
        Header: "Name",
        accessor: "project_name", 
        Cell: ({ row }) => (
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="flex-none">
              <div className="h-10 w-10 rounded-full text-sm bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-medium -tracking-[1px]">
                {row.original.project_name
                  ? (
                      row.original.project_name.charAt(0) +
                      (row.original.project_name.split(' ')[1]?.charAt(0) || "")
                    ).toUpperCase()
                  : "NA"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4
                className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate"
                title={row.original.project_name}
              >
                {row.original.project_name || "N/A"}
              </h4>
              {row.original.customer?.name && (
                <div className="text-slate-500 dark:text-slate-400 text-xs mt-1 truncate">
                  {row.original.customer.name}
                </div>
              )}
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
        accessor: "start_date",
        Cell: ({ cell: { value }, row }) => (
          <EditableProjectStartDate
            projectId={row.original.id}
            currentStartDate={value}
            onDateUpdate={handleDataUpdate}
            isEditable={isEditable}
            userRole={userRole}
          />
        ),
      },
      {
        Header: "Due Date",
        accessor: "due_date",
        Cell: ({ cell: { value }, row }) => (
          <EditableProjectDueDate
            projectId={row.original.id}
            currentDueDate={value}
            onDateUpdate={handleDataUpdate}
            isEditable={isEditable}
            userRole={userRole}
          />
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ cell: { value }, row }) => (
          <EditableProjectStatus
            projectId={row.original.id}
            currentStatus={value}
            onStatusUpdate={handleDataUpdate}
            isEditable={isEditable}
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
              className="flex items-center justify-center space-x-1 rtl:space-x-reverse"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowNavigation(projectItem.id);
                }}
                className="action-btn text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200"
                title="View Project"
              >
                <Icon icon="heroicons-outline:eye" className="w-4 h-4" />
              </button>
              
              {/* --- UPDATED CODE --- */}
              {/* Supervisor ko Edit button ka access diya gaya hai */}
              {(userRole === "admin" || employeeType === "Manager" || employeeType === "Supervisor") && (
                  <button
                    onClick={(e) => handleEdit(projectItem, e)}
                    disabled={actionsDisabled}
                    className="action-btn text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    title="Edit Project"
                  >
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                  </button>
              )}

              {/* --- UPDATED CODE --- */}
              {/* Supervisor ko Delete button ka access diya gaya hai */}
              {(userRole === "admin" || employeeType === "Manager" || employeeType === "Supervisor") && (
                  <button
                    onClick={(e) => handleDelete(projectItem, e)}
                    disabled={actionsDisabled}
                    className="action-btn text-red-500 bg-red-100 hover:bg-red-200 disabled:opacity-50"
                    title="Delete Project"
                  >
                    <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
                  </button>
              )}
            </div>
          );
        },
      });
    }
    return baseColumns;
  }, [
    isDeleting,
    isUpdating,
    userRole,
    employeeType,
    dispatch,
    currentPage,
    token,
  ]);

  const data = useMemo(() => projects || [], [projects]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      { columns: COLUMNS, data },
      useGlobalFilter,
      useSortBy,
      useRowSelect
    );

  if (!projects || projects.length === 0) return null;

  return (
    <Card noBorder>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden">
            <table
              className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
              {...getTableProps()}
            >
              <thead className="bg-slate-50 dark:bg-slate-800">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps(
                          column.getSortByToggleProps()
                        )}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
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
                className="bg-white divide-y divide-slate-200 dark:bg-slate-800"
                {...getTableBodyProps()}
              >
                {rows.map((row) => {
                  prepareRow(row);
                  return (
                    <tr
                      {...row.getRowProps()}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleRowNavigation(row.original.id)}
                    >
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap"
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