import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { useAuth } from "@/context/AuthContext";
import { canManageEmployees } from "@/pages/utility/apiHelper";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
  console.log(role);
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const EMPLOYEE_API_COLUMNS_CONFIG = (
  navigate,
  openDeleteModalHandler,
  hasPermission
) => [
  {
    Header: "Id",
    accessor: "id",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Name",
    accessor: "name",
    Cell: ({ row }) => {
      const { name, profile_pic, id, employee_type } = row.original;

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
          <div className="flex items-center space-x-2">
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
              {name}
            </span>

            {(employee_type === "Manager" ||
              employee_type === "Outsource" ||
              employee_type === "Supervisor") && (
              <span
                className={`
                  px-2 py-0.5 text-xs font-semibold rounded-full capitalize
                  ${
                    employee_type === "Manager"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-700 dark:text-emerald-200"
                      : employee_type === "Supervisor"
                      ? "bg-sky-100 text-sky-800 dark:bg-sky-700 dark:text-sky-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-200"
                  }
                `}
              >
                {employee_type.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    Header: "Email",
    accessor: "email",
    Cell: ({ cell: { value } }) => {
      const displayValue = value ? value.toLowerCase() : "N/A";
      return <span style={{ textTransform: "none" }}>{displayValue}</span>;
    },
  },
  {
    Header: "Username",
    accessor: "username",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Phone",
    accessor: "phone",
    Cell: ({ cell: { value } }) => <span>{value || "N/A"}</span>,
  },
  {
    Header: "Role ID",
    accessor: "user_role",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
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

const Allemployees = () => {
  const { user } = useAuth();
  // console.log("LOGGED IN USER:", user); // Debugging ke liye isko uncomment kar sakte hain

  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

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
      // Hamesha admin API call karein taake poori list mil sake
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
      if (response.data && Array.isArray(response.data.data)) {
        setEmployeeData(response.data.data);
        // console.log("FULL LIST FROM API:", response.data.data); // Debugging ke liye isko uncomment kar sakte hain
      } else if (response.data && Array.isArray(response.data)) {
        setEmployeeData(response.data);
        // console.log("FULL LIST FROM API:", response.data); // Debugging ke liye isko uncomment kar sakte hain
      } else {
        setFetchError("Received unexpected data format from server.");
        setEmployeeData([]);
      }
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

  // --- BEHTAR AUR MAZBOOT FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    if (!user || !employeeData.length) {
      return [];
    }

    const currentUserRole = user.role?.toLowerCase();
    const currentUserType = user.employee_type?.toLowerCase(); // Case-insensitive
    const currentUserId = user.id;

    if (currentUserRole === "admin") {
      return employeeData;
    }

    if (currentUserType === "manager") {
      return employeeData.filter((emp) => {
        const empType = emp.employee_type?.toLowerCase(); // Case-insensitive
        // Manager ko supervisor aur employee nazar aayenge
        return (
          empType === "supervisor" ||
          empType === "employee" ||
          !emp.employee_type
        );
      });
    }

    if (currentUserType === "supervisor") {
      return employeeData.filter((emp) => {
        const empType = emp.employee_type?.toLowerCase(); // Case-insensitive
        // Supervisor ko SIRF employee nazar aayenge.
        // Agar kisi ka employee_type NULL hai, to hum usay employee samjhenge.
        return empType === "employee" || !emp.employee_type;
      });
    }

    if (currentUserType === "employee") {
      return employeeData.filter((emp) => emp.id === currentUserId);
    }

    return [];
  }, [employeeData, user]);

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

  const columns = useMemo(
    () =>
      EMPLOYEE_API_COLUMNS_CONFIG(
        navigate,
        handleOpenDeleteModal,
        hasManagementPermission
      ),
    [navigate, handleOpenDeleteModal, hasManagementPermission]
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
