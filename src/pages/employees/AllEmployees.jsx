import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "../table/react-table/GlobalFilter";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import Alert from "@/components/ui/Alert";
import Tooltip from "@/components/ui/Tooltip";
import { useAuth } from "@/context/AuthContext";
import { canManageEmployees } from "@/pages/utility/apiHelper";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const calculateElapsedHours = (startDatetime) => {
  if (!startDatetime) return 0;
  const start = new Date(startDatetime);
  const now = new Date();
  const diffMs = now - start;
  return diffMs / (1000 * 60 * 60);
};

const formatElapsedTime = (startDatetime) => {
  if (!startDatetime) return "";
  const elapsedHours = calculateElapsedHours(startDatetime);
  const hours = Math.floor(elapsedHours);
  const minutes = Math.floor((elapsedHours - hours) * 60);
  
  if (hours === 0 && minutes === 0) {
    return "Just started";
  }
  
  if (hours === 0) {
    return `${minutes} min${minutes !== 1 ? "s" : ""}`;
  }
  
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  
  return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} min${minutes !== 1 ? "s" : ""}`;
};

const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

  const JoiningDateCell = ({ value, id, onUpdateSuccess }) => {
  const [updating, setUpdating] = useState(false);
  const isUpdatingRef = useRef(false);
  const fpInstanceRef = useRef(null);

  const handleDateChange = async (selectedDates) => {
    if (selectedDates.length === 0 || isUpdatingRef.current) return;
    
    const date = selectedDates[0];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    // Prevent duplicate calls if the date is the same as current
    const currentFormatted = value ? new Date(value).toISOString().split("T")[0] : "";
    if (formattedDate === currentFormatted) return;

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    isUpdatingRef.current = true;
    setUpdating(true);
    try {
      const apiPath = getApiBasePathForRole("/update-joining-date");
      await axios.post(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          employee_id: id,
          joining_date: formattedDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      toast.success("Joining date updated successfully");
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update date");
    } finally {
      isUpdatingRef.current = false;
      setUpdating(false);
    }
  };

  return (
    <div className="relative group min-w-[120px]">
      <div 
        className={`inline-flex items-center space-x-2 py-1.5 px-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer rounded text-slate-600 dark:text-slate-300 ${updating ? 'opacity-50 cursor-wait' : ''}`}
        onClick={() => !updating && fpInstanceRef.current?.open()}
      >
        <span className="text-sm border-b border-dashed border-slate-400 dark:border-slate-500 group-hover:border-blue-500 group-hover:text-blue-600">
          {formatDate(value)}
        </span>
        <Icon 
          icon="heroicons-outline:calendar" 
          className="w-4 h-4 text-slate-400 group-hover:text-blue-500" 
        />
      </div>
      <div className="absolute opacity-0 pointer-events-none">
        <Flatpickr
          value={value || ""}
          onReady={(selectedDates, dateStr, instance) => { 
            fpInstanceRef.current = instance; 
          }}
          onChange={handleDateChange}
          options={{
            disableMobile: true,
            dateFormat: "Y-m-d",
          }}
        />
      </div>
    </div>
  );
};

const formatDatetime = (datetime) => {
  if (!datetime) return "N/A";
  const date = new Date(datetime);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const EMPLOYEE_API_COLUMNS_CONFIG = (
  navigate,
  openDeleteModalHandler,
  hasPermission,
  isAdmin = false,
  onUpdateSuccess
) => {
  const baseColumns = [
  {
    Header: "Id",
    accessor: "id",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Name",
    accessor: "name",
    Cell: ({ row }) => {
      const { name, profile_pic, id, employee_type, email, phone } = row.original;
      const lowerCaseEmployeeType = employee_type?.toLowerCase();

      // --- UPDATED CODE ---
      const isSupervisor = lowerCaseEmployeeType === "supervisor";
      const displayType = isSupervisor ? "Coordinators" : employee_type;

      // Logic to determine if a badge should be shown
      const showBadge =
        lowerCaseEmployeeType === "manager" ||
        lowerCaseEmployeeType === "executive" || // Added executive
        lowerCaseEmployeeType === "outsource" ||
        isSupervisor;

      // Logic to assign badge color
      let badgeClass = "";
      if (lowerCaseEmployeeType === "manager") {
        badgeClass =
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-200";
      } else if (lowerCaseEmployeeType === "executive") {
        // New badge class for Executive
        badgeClass =
          "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200";
      } else if (isSupervisor) {
        badgeClass =
          "bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200";
      } else {
        // Fallback for Outsource
        badgeClass =
          "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-200";
      }
      // --- END OF UPDATE ---

      return (
        <div
          className="flex items-center space-x-3 rtl:space-x-reverse cursor-pointer group"
          onClick={() => navigate(`/employees/work-sessions/${id}`)}
          title={`View work sessions for ${name}`}
        >
          <span className="w-7 h-7 rounded-full flex-none bg-slate-600">
            {profile_pic ? (
              <img
                src={`${PFP_BASE_URL}${profile_pic}`}
                alt={name || "Profile"}
                className="object-cover w-full h-full rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  const initials = name
                    ? name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : "?";
                  e.target.outerHTML = `<span class="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">${initials}</span>`;
                }}
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </span>
            )}
          </span>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
                {name}
              </span>

              {showBadge && (
                <span
                  className={`px-2 py-0.5 text-[10px] leading-tight font-semibold rounded-full capitalize ${badgeClass}`}
                >
                  {displayType}
                </span>
              )}
            </div>
            <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {email && <span className="lowercase truncate max-w-[150px]" title={email}>{email}</span>}
              {phone && <span>{phone}</span>}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    Header: "Username",
    accessor: "username",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Joining Date",
    accessor: "joining_date",
    Cell: ({ row, cell: { value } }) => (
      <JoiningDateCell 
        value={value} 
        id={row.original.id} 
        onUpdateSuccess={onUpdateSuccess} 
      />
    ),
  },
  ...(isAdmin
    ? [
        {
          Header: "Status",
          accessor: "status",
          Cell: ({ row }) => {
            const { start_datetime } = row.original;
            const isOnline =
              start_datetime !== null && start_datetime !== undefined;
            const elapsedHours = calculateElapsedHours(start_datetime);
            const isExceededThreshold = elapsedHours >= 8;

            let dotColor = "bg-slate-400";
            let statusText = "Offline";

            if (isOnline) {
              statusText = "Online";
              if (isExceededThreshold) {
                dotColor = "bg-red-500";
              } else {
                dotColor = "bg-green-500";
              }
            }

            const elapsedTimeText = isOnline
              ? formatElapsedTime(start_datetime)
              : "";
            const tooltipContent = start_datetime ? (
              <div className="text-left">
                <div>Started: {formatDatetime(start_datetime)}</div>
                <div>Elapsed: {elapsedTimeText}</div>
              </div>
            ) : (
              "Offline"
            );

            return (
              <Tooltip content={tooltipContent} placement="top" arrow>
                <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer">
                  <span
                    className={`w-2 h-2 rounded-full ${dotColor}`}
                    aria-label={statusText}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {statusText}
                  </span>
                </div>
              </Tooltip>
            );
          },
        },
        {
          Header: "Today Time",
          accessor: "today_time",
          Cell: ({ row }) => {
            const val = row.original?.today_time;
            return <span className="text-sm text-slate-600 dark:text-slate-300">{val || "0h 0m"}</span>;
          },
        },
        {
          Header: "Week Time",
          accessor: "week_time",
          Cell: ({ row }) => {
            const val = row.original?.week_time;
            return <span className="text-sm text-slate-600 dark:text-slate-300">{val || "0h 0m"}</span>;
          },
        },
      ]
    : []),
  {
    Header: "Action",
    accessor: "action",
    Cell: ({ row }) => {
      const handleView = () => {
        navigate(`/employees/view/${row.original.id}`);
      };
      const handleEdit = () => {
        navigate(`/employees/edit/${row.original.id}`);
      };
      const handleDeleteClick = () => {
        openDeleteModalHandler(row.original);
      };

      return (
        <div className="flex space-x-1 items-center rtl:space-x-reverse">
          <button
            onClick={handleView}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700 rounded-md transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="View Employee Details"
          >
            <Icon icon="heroicons-outline:eye" className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/employees/work-hours/${row.original.id}`)}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700 rounded-md transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="Manage Work Hours"
          >
            <Icon icon="heroicons-outline:clock" className="w-4 h-4" />
          </button>
          {hasPermission && (
            <>
              <button
                onClick={handleEdit}
                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700"
                title="Edit Employee"
              >
                <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-all duration-200 border border-transparent hover:border-red-200 dark:hover:border-red-700"
                title="Delete Employee"
              >
                <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      );
    },
  },
  ];

  return baseColumns;
};

const Allemployees = () => {
  const { user } = useAuth();
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const hasManagementPermission = useMemo(() => canManageEmployees(), []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setDeleteSuccess(null);
    setDeleteError(null);
    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        rawData = response.data;
      } else {
        setFetchError("Received unexpected data format from server.");
        setEmployeeData([]);
        return;
      }


      setEmployeeData(rawData);
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch employees."
      );
      setEmployeeData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // --- UPDATED CODE ---
  const filteredData = useMemo(() => {
    if (!user || !employeeData.length) {
      return [];
    }
    const currentUserRole = user.role?.toLowerCase();
    const currentUserType = user.employee_type?.toLowerCase();
    const currentUserId = user.id;

    let roleFilteredData = [];



    const isExecutive = currentUserType === "executive";

    roleFilteredData = employeeData.filter((emp) => {
      const empType = emp.employee_type?.toLowerCase().trim();
      let keep = false;

      if (currentUserRole === "admin") {
        keep = true;
      } else if (currentUserType === "manager" || currentUserType === "executive") {
        keep =
          (isExecutive && empType === "manager") ||
          empType === "supervisor" ||
          empType === "employee" ||
          !emp.employee_type;
      } else if (currentUserType === "supervisor") {
        keep = empType === "employee" || !emp.employee_type;
      } else if (currentUserType === "employee") {
        keep = emp.id === currentUserId;
      }

      // Detailed log for debugging specific IDs like 22 or 24


      return keep;
    });



    if (statusFilter === "all" || statusFilter === "") {
      return roleFilteredData;
    }

    return roleFilteredData.filter((emp) => {
      const { start_datetime } = emp;
      const isOnline = start_datetime !== null && start_datetime !== undefined;
      const elapsedHours = calculateElapsedHours(start_datetime);
      const isExceededThreshold = elapsedHours >= 8;

      if (statusFilter === "online") {
        return isOnline && !isExceededThreshold;
      } else if (statusFilter === "offline") {
        return !isOnline;
      } else if (statusFilter === "extra-time") {
        return isOnline && isExceededThreshold;
      }

      return true;
    });
  }, [employeeData, user, statusFilter]);
  // --- END OF UPDATE ---

  const handleOpenDeleteModal = useCallback((employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!employeeToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    const token = Cookies.get("token");
    if (!token) {
      setDeleteError("Authentication token not found for deletion.");
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      return;
    }
    try {
      const apiPath = getApiBasePathForRole("/employee-user");
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${
          employeeToDelete.id
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      setEmployeeData((prevData) =>
        prevData.filter((emp) => emp.id !== employeeToDelete.id)
      );
      setDeleteSuccess(
        `Employee "${employeeToDelete.name}" deleted successfully!`
      );
      handleCloseDeleteModal();
      setTimeout(() => setDeleteSuccess(null), 4000);
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete employee."
      );
    } finally {
      setDeleteLoading(false);
    }
  }, [employeeToDelete, handleCloseDeleteModal]);

  const isAdmin = useMemo(() => {
    return user?.role?.toLowerCase() === "admin";
  }, [user]);

  const columns = useMemo(
    () =>
      EMPLOYEE_API_COLUMNS_CONFIG(
        navigate,
        handleOpenDeleteModal,
        hasManagementPermission,
        isAdmin,
        fetchEmployees
      ),
    [navigate, handleOpenDeleteModal, hasManagementPermission, isAdmin, fetchEmployees]
  );

  const data = useMemo(() => filteredData, [filteredData]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage,
    pageOptions,
    state,
    gotoPage,
    pageCount,
    setPageSize,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;
  const { globalFilter, pageIndex, pageSize } = state;

  if (loading && !employeeData.length) {
    return (
      <Card>
        <div className="p-4 text-center">Loading employee data...</div>
      </Card>
    );
  }
  if (fetchError && !loading) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError} <br />
          <button onClick={fetchEmployees} className="mt-2 btn btn-primary">
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card noBorder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title mb-4 md:mb-0">Employee List</h4>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex-1">
              <GlobalFilter
                value={globalFilter}
                onChange={setGlobalFilter}
                placeholder="Search employees..."
              />
            </div>
            {isAdmin && (
              <div className="w-auto min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-control h-10 w-full"
                >
                  <option value="" disabled>
                    Filter
                  </option>
                  <option value="all">All</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="extra-time">Extra Time</option>
                </select>
              </div>
            )}
            {hasManagementPermission && (
              <button
                className="btn btn-dark flex items-center justify-center h-10"
                onClick={() => navigate("/employees/add")}
              >
                <Icon icon="heroicons-outline:plus" className="w-5 h-5 mr-2" />
                Add Employee
              </button>
            )}
          </div>
        </div>
        {deleteSuccess && (
          <Alert
            className="alert-success light-mode mb-4"
            toggle={() => setDeleteSuccess(null)}
          >
            {deleteSuccess}
          </Alert>
        )}
        {deleteError && (
          <Alert
            className="alert-danger light-mode mb-4"
            toggle={() => setDeleteError(null)}
          >
            {deleteError}
          </Alert>
        )}
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow-sm dark:shadow-slate-700 rounded-md">
              <table
                className="min-w-full divide-y divide-slate-200 dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-100 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => {
                    const { key, ...restHeaderGroupProps } =
                      headerGroup.getHeaderGroupProps();
                    return (
                      <tr key={key} {...restHeaderGroupProps}>
                        {headerGroup.headers.map((column) => {
                          const { key, ...restColumn } = column.getHeaderProps(
                            column.getSortByToggleProps()
                          );
                          return (
                            <th key={key} {...restColumn} className="table-th">
                              {column.render("Header")}
                              <span className="ltr:ml-1 rtl:mr-1">
                                {column.isSorted
                                  ? column.isSortedDesc
                                    ? " 🔽"
                                    : " 🔼"
                                  : ""}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    );
                  })}
                </thead>
                <tbody
                  {...getTableBodyProps()}
                  className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700"
                >
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      const { key: rowKey, ...restOfRowProps } =
                        row.getRowProps();
                      return (
                        <tr key={rowKey} {...restOfRowProps}>
                          {row.cells.map((cell) => {
                            const { key: cellKey, ...restOfCellProps } =
                              cell.getCellProps();
                            return (
                              <td
                                key={cellKey}
                                {...restOfCellProps}
                                className="table-td"
                              >
                                {cell.render("Cell")}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-center p-6 text-slate-500 dark:text-slate-400 table-td"
                      >
                        {loading
                          ? "Fetching employees..."
                          : "No employees found matching your role's permissions."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {page.length > 0 && (
          <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <select
                className="form-select py-2"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: "100px" }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {pageIndex + 1} of {pageOptions.length}
                </span>
                <span className="hidden sm:inline">
                  {" "}
                  ({data.length} total records)
                </span>
              </span>
            </div>
            <ul className="flex items-center space-x-2 rtl:space-x-reverse">
              <li>
                <button
                  className={`pagination-link ${
                    !canPreviousPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => gotoPage(0)}
                  disabled={!canPreviousPage}
                >
                  <Icon icon="heroicons:chevron-double-left-20-solid" />
                </button>
              </li>
              <li>
                <button
                  className={`pagination-link ${
                    !canPreviousPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              <li>
                <input
                  type="number"
                  className="form-control py-2 w-[60px] text-center"
                  value={pageIndex + 1}
                  onChange={(e) => {
                    const p = e.target.value ? Number(e.target.value) - 1 : 0;
                    if (p < pageOptions.length && p >= 0) gotoPage(p);
                  }}
                  min="1"
                  max={pageOptions.length}
                />
              </li>
              <li>
                <button
                  className={`pagination-link ${
                    !canNextPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
              </li>
              <li>
                <button
                  className={`pagination-link ${
                    !canNextPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => gotoPage(pageCount - 1)}
                  disabled={!canNextPage}
                >
                  <Icon icon="heroicons:chevron-double-right-20-solid" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </Card>
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={employeeToDelete?.name}
        isLoading={deleteLoading}
        message={`Are you sure you want to delete the employee: `}
      />
    </>
  );
};

export default Allemployees;
