// src/pages/app/projects/ProjectList.js (FINAL AND CORRECTED SIMPLE TABLE)

import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useTable, useSortBy } from "react-table";
import Swal from "sweetalert2";
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
import { getApiBasePathForRole } from "@/pages/utility/apiHelper";

const AvatarStack = ({ assignees }) => {
  if (!assignees || assignees.length === 0)
    return <span className="text-slate-400">N/A</span>;
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
                {user.name.charAt(0).toUpperCase()}
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

// This is now a simple table component that expects a flat array of `projects`
const ProjectList = ({ projects, userRole, employeeType }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDeleting, isUpdating, currentPage } = useSelector(
    (state) => state.project
  );

  const handleDataUpdate = () => {
    dispatch(fetchProjectsAPI({ page: currentPage }));
  };

  const handleOpenAssigneesModal = (project, e) => {
    e.stopPropagation();
    dispatch(toggleUpdateAssigneesModal({ open: true, project }));
  };

  const handleRowNavigation = (projectId) => {
    if (!projectId) return;
    if (userRole === "customer" || userRole === "member")
      navigate(`/order-details/${projectId}`);
    else navigate(`/jobs/${projectId}`);
  };

  const COLUMNS = useMemo(() => {
    const isEditable =
      userRole === "admin" ||
      employeeType === "Manager" ||
      employeeType === "Supervisor";
    const baseColumns = [
      {
        Header: "Name",
        accessor: "project_name",
        Cell: ({ row }) => (
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
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
            apiBaseUrl={import.meta.env.VITE_BACKEND_BASE_URL}
            apiPath={getApiBasePathForRole("/update-project-status")}
            token={Cookies.get("token")}
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
              {(userRole === "admin" ||
                employeeType === "Manager" ||
                employeeType === "Supervisor") && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch(
                        setEditModalAndItem({
                          open: true,
                          project: projectItem,
                        })
                      );
                    }}
                    disabled={actionsDisabled}
                    className="action-btn text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    title="Edit Project"
                  >
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      Swal.fire({
                        title: "Are you sure?",
                        text: `Delete "${projectItem.project_name}"?`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        confirmButtonText: "Yes, delete it!",
                      }).then(
                        (r) =>
                          r.isConfirmed &&
                          dispatch(deleteProjectAPI(projectItem.id))
                      );
                    }}
                    disabled={actionsDisabled}
                    className="action-btn text-red-500 bg-red-100 hover:bg-red-200 disabled:opacity-50"
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
  }, [isDeleting, isUpdating, userRole, employeeType, dispatch, currentPage]);

  const data = useMemo(() => projects || [], [projects]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({ columns: COLUMNS, data }, useSortBy);

  if (!projects || projects.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-800 rounded-md shadow-md border border-slate-200 dark:border-slate-700">
      <table
        className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
        {...getTableProps()}
      >
        <thead className="bg-slate-50 dark:bg-slate-700">
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
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
  );
};

export default ProjectList;
