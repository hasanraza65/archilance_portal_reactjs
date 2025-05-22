import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card"; 
import Icon from "@/components/ui/Icon"; 
import Dropdown from "@/components/ui/Dropdown"; 
import { MenuItem } from "@headlessui/react";
import {
  useTable,
  useRowSelect,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";
import GlobalFilter from "../table/react-table/GlobalFilter";



const API_COLUMNS = [
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
      
      const PFP_BASE_URL = "https://demo.aentora.com/backend/public/storage/"; 

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
  {
    Header: "Email",
    accessor: "email",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
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
    Cell: ({ cell: { value } }) => {
     
      return <span>{value}</span>;
    },
  },
  {
    Header: "Action",
    accessor: "action", 
    Cell: ({ row }) => {
     
      const handleAction = (actionName, employeeId) => {
        console.log(`Action: ${actionName} on employee ID: ${employeeId}`);
        
      };

      return (
        <div>
          <Dropdown
            classMenuItems="right-0 w-[140px] top-[110%] "
            label={
              <span className="text-xl text-center block w-full">
                <Icon icon="heroicons-outline:dots-vertical" />
              </span>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {actions.map((item, i) => (
                <MenuItem key={i}>
                  {({ active }) => (
                    <div
                      onClick={() => handleAction(item.name, row.original.id)}
                      className={`
                        ${
                          item.name === "delete"
                            ? "text-danger-500 hover:bg-danger-500 hover:text-white"
                            : active 
                              ? "bg-slate-900 text-white dark:bg-slate-600/50" 
                              : "hover:bg-slate-100 dark:hover:bg-slate-700/50"
                        }
                        w-full border-b border-b-gray-500/10 px-4 py-2 text-sm last:mb-0 cursor-pointer
                        first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse
                      `}
                    >
                      <span className="text-base">
                        <Icon icon={item.icon} />
                      </span>
                      <span>{item.name}</span>
                    </div>
                  )}
                </MenuItem>
              ))}
            </div>
          </Dropdown>
        </div>
      );
    },
  },
];

const actions = [
  {
    name: "view",
    icon: "heroicons-outline:eye",
  },
  {
    name: "edit",
    icon: "heroicons:pencil-square",
  },
  {
    name: "delete",
    icon: "heroicons-outline:trash",
  },
];

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

const Allemployees = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    const token = Cookies.get("token");

    console.log("Retrieved token for fetching employees:", token);

    if (!token) {
      setError("Authentication token not found. Please log in.");
      setLoading(false);
     
      return;
    }

    try {
      const response = await axios.get(
        "https://demo.aentora.com/backend/public/api/admin/employee-user",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Full API Response (Get Employees):", response);
      if (response.data && Array.isArray(response.data.data)) {
          setEmployeeData(response.data.data);
          console.log("Fetched Employee Data:", response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
          setEmployeeData(response.data);
          console.log("Fetched Employee Data (direct array):", response.data);
      } else {
          console.error("API response.data.data is not an array or undefined:", response.data);
          setError("Received unexpected data format from server.");
          setEmployeeData([]);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      if (err.response) {
        console.error("Error response data (Get Employees):", err.response.data);
        console.error("Error response status (Get Employees):", err.response.status);
        setError(
          `Failed to fetch employees: ${err.response.data.message || err.response.statusText || 'Server error'}`
        );
      } else if (err.request) {
        console.error("Error request (Get Employees):", err.request);
        setError("Failed to fetch employees: No response from server.");
      } else {
        console.error("Error message (Get Employees):", err.message);
        setError(`Failed to fetch employees: ${err.message}`);
      }
      setEmployeeData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const columns = useMemo(() => API_COLUMNS, []);
  const data = useMemo(() => employeeData, [employeeData]);

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowSelect,
 
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

  if (loading) {
    return (
      <Card>
        <div className="p-4 text-center">Loading employee data...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {error}
          <br />
          <button 
            onClick={fetchEmployees} 
            className="mt-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 btn"
          >
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
          <h4 className="card-title">Employee List</h4>
          <div className="flex space-x-3 items-center">
            <GlobalFilter filter={globalFilter || ""} setFilter={setGlobalFilter} />
            <button
              className="btn btn-dark flex items-center" 
              onClick={() => navigate('/employees/add')}
            >
              <Icon icon="heroicons-outline:plus" className="w-5 h-5 mr-2" />
              Add Employee
            </button>
          </div>
        </div>


        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="border-t border-slate-100 dark:border-slate-800">
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
                          );
                        })}
                      </tr>
                    );
                  })}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      const { key, ...restRowProps } = row.getRowProps();
                      return (
                        <tr key={key} {...restRowProps}>
                          {row.cells.map((cell) => {
                            const { key: cellKey, ...restCellProps } = cell.getCellProps();
                            return (
                              <td
                                key={cellKey}
                                {...restCellProps}
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
                        <td colSpan={columns.length + 1} className="text-center p-4 table-td">
                            No employees found.
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
                <span className=" flex space-x-2  rtl:space-x-reverse items-center">
                <span className=" text-sm font-medium text-slate-600 dark:text-slate-300">
                    Go to page:
                </span>
                <span>
                    <input
                    type="number"
                    className="form-control py-2"
                    defaultValue={pageIndex + 1}
                    onChange={(e) => {
                        const pageNumber = e.target.value
                        ? Number(e.target.value) - 1
                        : 0;
                        gotoPage(pageNumber);
                    }}
                    style={{ width: "60px" }}
                    min="1"
                    max={pageOptions.length}
                    />
                </span>
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page{" "}
                <span>
                    {pageIndex + 1} of {pageOptions.length}
                </span>
                </span>
            </div>
            <ul className="flex items-center  space-x-3  rtl:space-x-reverse">
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                    className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => gotoPage(0)}
                    disabled={!canPreviousPage}
                >
                    <Icon icon="heroicons-outline:chevron-double-left" />
                </button>
                </li>
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                    className={` ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                >
                    <Icon icon="heroicons-outline:chevron-left" />
                </button>
                </li>
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                    className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                >
                    <Icon icon="heroicons-outline:chevron-right" />
                </button>
                </li>
                <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                    className={` ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => gotoPage(pageCount - 1)}
                    disabled={!canNextPage}
                >
                    <Icon icon="heroicons-outline:chevron-double-right" />
                </button>
                </li>
            </ul>
            </div>
        )}
      </Card>
    </>
  );
};

export default Allemployees;