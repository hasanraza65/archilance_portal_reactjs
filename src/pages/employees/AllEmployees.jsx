import React, { useState, useMemo, useEffect, useCallback } from "react"; // Added useCallback
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "../table/react-table/GlobalFilter";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal"; // Import the modal
import Alert from "@/components/ui/Alert"; // For success/error messages

const PFP_BASE_URL = "https://demo.aentora.com/backend/public/storage/";

// Renamed and modified to accept openDeleteModalHandler
const EMPLOYEE_API_COLUMNS_CONFIG = (navigate, openDeleteModalHandler) => [
  {
    Header: "Id",
    accessor: "id",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Name",
    accessor: "name",
    Cell: ({ row }) => {
      const { name, profile_pic } = row.original;
      return (
        <div>
          <span className="inline-flex items-center">
            <span className="w-7 h-7 rounded-full ltr:mr-3 rtl:ml-3 flex-none bg-slate-600">
              {profile_pic ? (
                <img
                  src={`${PFP_BASE_URL}${profile_pic}`}
                  alt={name || 'Profile'}
                  className="object-cover w-full h-full rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                    e.target.outerHTML = `<span class="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">${initials}</span>`;
                  }}
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">
                  {name ? name.charAt(0).toUpperCase() : "?"}
                </span>
              )}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
              {name}
            </span>
          </span>
        </div>
      );
    },
  },
  { Header: "Email", accessor: "email", Cell: ({ cell: { value } }) => <span>{value}</span> },
  { Header: "Username", accessor: "username", Cell: ({ cell: { value } }) => <span>{value}</span> },
  { Header: "Phone", accessor: "phone", Cell: ({ cell: { value } }) => <span>{value || "N/A"}</span> },
  { Header: "Role ID", accessor: "user_role", Cell: ({ cell: { value } }) => <span>{value}</span> },
  {
    Header: "Action",
    accessor: "action",
    Cell: ({ row }) => {
      // Removed useNavigate from here, it's passed in or available in AllEmployees scope
      const handleView = () => {
        navigate(`/employees/view/${row.original.id}`);
      };
      const handleEdit = () => {
        navigate(`/employees/edit/${row.original.id}`);
      };
      const handleDeleteClick = () => {
        openDeleteModalHandler(row.original); // Call the passed handler
      };

      return (
        <div className="flex space-x-1 items-center rtl:space-x-reverse">
          <button
            onClick={handleView}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700 rounded-md transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="View Employee"
          >
            <Icon icon="heroicons-outline:eye" className="w-4 h-4" />
          </button>
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
        </div>
      );
    },
  },
];

// IndeterminateCheckbox remains the same
const IndeterminateCheckbox = React.forwardRef(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef();
    const resolvedRef = ref || defaultRef;
    React.useEffect(() => {
      if (resolvedRef.current) resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);
    return <input type="checkbox" ref={resolvedRef} {...rest} className="table-checkbox" />;
  }
);
IndeterminateCheckbox.displayName = "IndeterminateCheckbox";


const Allemployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  // State for delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  const fetchEmployees = useCallback(async () => { // Wrapped in useCallback
    setLoading(true);
    setFetchError(null);
    setDeleteSuccess(null); // Clear messages on new fetch
    setDeleteError(null);
    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(
        "https://demo.aentora.com/backend/public/api/admin/employee-user",
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (response.data && Array.isArray(response.data.data)) {
        setEmployeeData(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setEmployeeData(response.data);
      } else {
        setFetchError("Received unexpected data format from server.");
        setEmployeeData([]);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to fetch employees.");
      setEmployeeData([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array as fetchEmployees doesn't depend on props/state that change it

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]); // fetchEmployees is now a stable dependency

  // ---- Delete Functionality Handlers ----
  const handleOpenDeleteModal = useCallback((employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  }, []); // Empty dependency, setState functions are stable

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setEmployeeToDelete(null);
  }, []); // Empty dependency

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
      await axios.delete(
        `https://demo.aentora.com/backend/public/api/admin/employee-user/${employeeToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      setEmployeeData((prevData) => prevData.filter((emp) => emp.id !== employeeToDelete.id));
      setDeleteSuccess(`Employee "${employeeToDelete.name}" deleted successfully!`);
      handleCloseDeleteModal(); // Close modal on success
      setTimeout(() => setDeleteSuccess(null), 4000); // Auto-dismiss success
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to delete employee.");
    } finally {
      setDeleteLoading(false);
    }
  }, [employeeToDelete, handleCloseDeleteModal]); // Dependencies for handleConfirmDelete
  // ---- End Delete Functionality Handlers ----

  const columns = useMemo(
    () => EMPLOYEE_API_COLUMNS_CONFIG(navigate, handleOpenDeleteModal),
    [navigate, handleOpenDeleteModal] // Added handleOpenDeleteModal as dependency
  );
  const data = useMemo(() => employeeData, [employeeData]);

  const tableInstance = useTable(
    { columns, data, initialState: { pageIndex: 0, pageSize: 10 } },
    useGlobalFilter, useSortBy, usePagination, useRowSelect
  );

  const {
    getTableProps, getTableBodyProps, headerGroups, page, nextPage, previousPage,
    canNextPage, canPreviousPage, pageOptions, state, gotoPage, pageCount,
    setPageSize, setGlobalFilter, prepareRow,
  } = tableInstance;
  const { globalFilter, pageIndex, pageSize } = state;

  // Loading and Error States (similar to previous logic)
  if (loading && !employeeData.length) {
    return <Card><div className="p-4 text-center">Loading employee data...</div></Card>;
  }
  if (fetchError && !loading && !employeeData.length) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError} <br />
          <button onClick={fetchEmployees} className="mt-2 btn btn-primary">Try Again</button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card noBorder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Employee List</h4>
          <div className="flex flex-wrap space-x-3 items-center"> {/* flex-wrap for responsiveness */}
            <GlobalFilter filter={globalFilter || ""} setFilter={setGlobalFilter} />
            <button
              className="btn btn-dark flex items-center mt-2 md:mt-0"
              onClick={() => navigate('/employees/add')}
            >
              <Icon icon="heroicons-outline:plus" className="w-5 h-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>

        {deleteSuccess && (
          <Alert className="alert-success light-mode mb-4" toggle={() => setDeleteSuccess(null)}>
            {deleteSuccess}
          </Alert>
        )}
        {deleteError && (
          <Alert className="alert-danger light-mode mb-4" toggle={() => setDeleteError(null)}>
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
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())} className="table-th">
                          {column.render("Header")}
                          <span className="ltr:ml-1 rtl:mr-1">
                            {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()} className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                          {row.cells.map((cell) => (
                            <td {...cell.getCellProps()} className="table-td">
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={columns.length} className="text-center p-6 text-slate-500 dark:text-slate-400 table-td">
                        {loading ? "Fetching employees..." : "No employees found."}
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
                style={{ width: '100px' }}
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>Show {size}</option>
                ))}
              </select>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {pageIndex + 1} of {pageOptions.length}
                </span>
                <span className="hidden sm:inline"> ({data.length} total records)</span>
              </span>
            </div>
            <ul className="flex items-center space-x-2 rtl:space-x-reverse">
              <li><button className={`pagination-link ${!canPreviousPage && "opacity-50 cursor-not-allowed"}`} onClick={() => gotoPage(0)} disabled={!canPreviousPage}><Icon icon="heroicons:chevron-double-left-20-solid" /></button></li>
              <li><button className={`pagination-link ${!canPreviousPage && "opacity-50 cursor-not-allowed"}`} onClick={() => previousPage()} disabled={!canPreviousPage}><Icon icon="heroicons-outline:chevron-left" /></button></li>
              <li><input type="number" className="form-control py-2 w-[60px] text-center" value={pageIndex + 1} onChange={(e) => { const p = e.target.value ? Number(e.target.value) - 1 : 0; if (p < pageOptions.length && p >= 0) gotoPage(p); }} min="1" max={pageOptions.length}/></li>
              <li><button className={`pagination-link ${!canNextPage && "opacity-50 cursor-not-allowed"}`} onClick={() => nextPage()} disabled={!canNextPage}><Icon icon="heroicons-outline:chevron-right" /></button></li>
              <li><button className={`pagination-link ${!canNextPage && "opacity-50 cursor-not-allowed"}`} onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}><Icon icon="heroicons:chevron-double-right-20-solid" /></button></li>
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