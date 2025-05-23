import React, { useState, useMemo, useEffect } from "react";
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

// CUSTOMER_API_COLUMNS_CONFIG needs to be passed the openDeleteModal handler
const CUSTOMER_API_COLUMNS_CONFIG = (navigate, openDeleteModalHandler) => [
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
  {
    Header: "Phone",
    accessor: "phone",
    Cell: ({ cell: { value } }) => {
      const cleanedPhone = value ? String(value).replace(/[\r\n]+/g, '') : "N/A";
      return <span>{cleanedPhone}</span>;
    }
  },
  { Header: "Role ID", accessor: "user_role", Cell: ({ cell: { value } }) => <span>{value}</span> },
  {
    Header: "Action",
    accessor: "action",
    Cell: ({ row }) => {
      const handleView = () => {
        navigate(`/customers/view/${row.original.id}`);
      };

      const handleEdit = () => {
        navigate(`/customers/edit/${row.original.id}`);
      };

      const handleDeleteClick = () => {
        // Call the handler passed from AllCustomers component
        openDeleteModalHandler(row.original); // Pass the customer object
      };

      return (
        <div className="flex items-center space-x-2 rtl:space-x-reverse"> {/* Added rtl:space-x-reverse for RTL support */}
          {/* View Button */}
          <button
            onClick={handleView}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors duration-150 group"
            title="View Customer"
          >
            <Icon 
              icon="heroicons-outline:eye" 
              className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white" 
            />
          </button>

          {/* Edit Button */}
          <button
            onClick={handleEdit}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors duration-150 group" // Using consistent styling
            title="Edit Customer"
          >
            <Icon 
              icon="heroicons:pencil-square" 
              className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" // Kept blue for edit icon
            />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDeleteClick} // Changed to handleDeleteClick
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors duration-150 group" // Using consistent styling
            title="Delete Customer"
          >
            <Icon 
              icon="heroicons-outline:trash" 
              className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300" // Kept red for delete icon
            />
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
        if (resolvedRef.current) {
          resolvedRef.current.indeterminate = indeterminate;
        }
      }, [resolvedRef, indeterminate]);
  
      return (
        <input
          type="checkbox"
          ref={resolvedRef}
          {...rest}
          className="table-checkbox"
        />
      );
    }
  );
IndeterminateCheckbox.displayName = "IndeterminateCheckbox";


const AllCustomers = () => {
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  // State for delete functionality
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);


  const fetchCustomers = async () => {
    setLoading(true);
    setFetchError(null); // Clear previous fetch errors
    setDeleteSuccess(null); // Clear delete messages on new fetch
    setDeleteError(null);   // Clear delete messages on new fetch
    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get("https://demo.aentora.com/backend/public/api/admin/customer-user", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (response.data && Array.isArray(response.data.data)) {
        setCustomerData(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setCustomerData(response.data);
      } else {
        setFetchError("Received unexpected data format from server for customers.");
        setCustomerData([]);
      }
    } catch (err) {
      setFetchError(err.response?.data?.message || err.message || "Failed to fetch customers.");
      setCustomerData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ---- Delete Functionality Handlers ----
  const handleOpenDeleteModal = (customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
    setDeleteError(null);
    setDeleteSuccess(null);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
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
        `https://demo.aentora.com/backend/public/api/admin/customer-user/${customerToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      setCustomerData((prevData) => prevData.filter((customer) => customer.id !== customerToDelete.id));
      setDeleteSuccess(`Customer "${customerToDelete.name}" deleted successfully!`);
      handleCloseDeleteModal();
      // Optional: Auto-dismiss success message after a few seconds
      setTimeout(() => setDeleteSuccess(null), 4000);
    } catch (err) {
      console.error("Error deleting customer:", err.response);
      setDeleteError(err.response?.data?.message || err.message || "Failed to delete customer.");
      // setTimeout(() => setDeleteError(null), 5000); // Optional: Auto-dismiss error
    } finally {
      setDeleteLoading(false);
    }
  };
  // ---- End Delete Functionality Handlers ----

  // Pass navigate and handleOpenDeleteModal to the column configuration
  const columns = useMemo(() => CUSTOMER_API_COLUMNS_CONFIG(navigate, handleOpenDeleteModal), [navigate]); // Added handleOpenDeleteModal dependency
  const data = useMemo(() => customerData, [customerData]);

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

  if (loading && !customerData.length) { // Show initial loading state
    return <Card><div className="p-4 text-center">Loading customer data...</div></Card>;
  }

  if (fetchError && !loading && !customerData.length) { // Show fetch error if no data loaded
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError}
          <br />
          <button onClick={fetchCustomers} className="mt-2 btn btn-primary">Try Again</button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card noBorder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Customer List</h4>
          <div className="flex flex-wrap space-x-3 items-center">
            <GlobalFilter filter={globalFilter || ""} setFilter={setGlobalFilter} />
            <button className="btn btn-dark flex items-center mt-2 md:mt-0" onClick={() => navigate('/customers/add')}>
              <Icon icon="heroicons-outline:plus" className="w-5 h-5 mr-2" />
              Add Customer
            </button>
          </div>
        </div>

        {/* Display Delete Success/Error Messages */}
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
            <div className="overflow-hidden shadow-sm dark:shadow-slate-700 rounded-md"> {/* Added shadow and rounded for table container */}
              <table
                className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" // Adjusted divide color
                {...getTableProps()}
              >
                <thead className="bg-slate-100 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => {
                    const { key, ...restHeaderGroupProps } = headerGroup.getHeaderGroupProps();
                    return (
                      <tr key={key} {...restHeaderGroupProps}>
                        {headerGroup.headers.map((column) => {
                          const { key: colKey, ...restColProps } = column.getHeaderProps(column.getSortByToggleProps());
                          return (
                            <th
                              key={colKey}
                              {...restColProps}
                              scope="col"
                              className="table-th" // Assumes table-th provides padding and text alignment
                            >
                              {column.render("Header")}
                              <span className="ltr:ml-1 rtl:mr-1"> {/* Adjusted margin for RTL */}
                                {column.isSorted
                                  ? column.isSortedDesc
                                    ? <Icon icon="heroicons-outline:chevron-down" className="inline-block w-4 h-4" />
                                    : <Icon icon="heroicons-outline:chevron-up" className="inline-block w-4 h-4" />
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
                  className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700" // Adjusted divide color
                  {...getTableBodyProps()}
                >
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      const { key, ...restRowProps } = row.getRowProps();
                      return (
                        <tr key={key} {...restRowProps} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                          {row.cells.map((cell) => {
                            const { key: cellKey, ...restCellProps } = cell.getCellProps();
                            return (
                              <td
                                key={cellKey}
                                {...restCellProps}
                                className="table-td" // Assumes table-td provides padding
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
                        <td colSpan={columns.length} className="text-center p-6 text-slate-500 dark:text-slate-400 table-td"> {/* Increased padding for empty state */}
                            {loading ? "Fetching customers..." : "No customers found."}
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
            <div className=" flex items-center space-x-3 rtl:space-x-reverse">
              <select
                className="form-select py-2" // Added py-2 for consistency
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                style={{ width: '100px'}} // Slightly wider for "Show X"
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
                <span className="hidden sm:inline"> ({data.length} total records)</span>
              </span>
            </div>
            <ul className="flex items-center space-x-2 rtl:space-x-reverse">
                <li>
                <button
                    className={`pagination-link ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => gotoPage(0)}
                    disabled={!canPreviousPage}
                >
                    <Icon icon="heroicons:chevron-double-left-20-solid" />
                </button>
                </li>
                <li>
                <button
                     className={`pagination-link ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                >
                    <Icon icon="heroicons-outline:chevron-left" />
                </button>
                </li>
                 <li className="text-sm text-slate-900 dark:text-white flex items-center">
                    <input
                        type="number"
                        className="form-control py-2 w-[60px] text-center" // py-2 for consistency
                        value={pageIndex + 1} // Controlled component for page input
                        onChange={(e) => {
                            const pageNumber = e.target.value ? Number(e.target.value) - 1 : 0;
                            if(pageNumber < pageOptions.length && pageNumber >=0){
                               gotoPage(pageNumber);
                            }
                        }}
                        min="1"
                        max={pageOptions.length}
                    />
                </li>
                <li>
                <button
                    className={`pagination-link ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                >
                    <Icon icon="heroicons-outline:chevron-right" />
                </button>
                </li>
                <li>
                <button
                    className={`pagination-link ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
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
        itemName={customerToDelete?.name}
        isLoading={deleteLoading}
        message={`Are you sure you want to delete the customer: `}
      />
    </>
  );
};

export default AllCustomers;