import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  usePagination,
} from "react-table";

import GlobalFilter from "@/pages/table/react-table/GlobalFilter";

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

// Column configuration (Actions ke saath)
const CUSTOMER_TEAM_COLUMNS_CONFIG = (navigate, handleDeleteClick) => [
  {
    Header: "Id",
    accessor: "id",
    Cell: ({ cell: { value } }) => <span>{value}</span>,
  },
  {
    Header: "Name",
    accessor: "name",
    Cell: ({ row }) => {
      const { name } = row.original;
      const profile_pic = row.original.team_user?.profile_pic;
      return (
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
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
          <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
            {name}
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
    Header: "Phone",
    accessor: "phone",
    Cell: ({ cell: { value } }) => <span>{value || "N/A"}</span>,
  },
  {
    Header: "Status",
    accessor: "status",
    Cell: ({ cell: { value } }) => (
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
          value === "Pending"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
            : value === "Active"
            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            : "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400"
        }`}
      >
        {value}
      </span>
    ),
  },
  {
    Header: "Action",
    accessor: "action",
    Cell: ({ row }) => {
      const handleEdit = () => navigate(`/team/edit/${row.original.id}`);
      const onDelete = () => handleDeleteClick(row.original);

      return (
        <div className="flex space-x-1 items-center rtl:space-x-reverse">
          <button
            onClick={handleEdit}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/50 rounded-md transition-all duration-200"
            title="Edit"
          >
            <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-all duration-200"
            title="Delete"
          >
            <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
          </button>
        </div>
      );
    },
  },
];

const CustomerTeam = () => {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    const token = Cookies.get("token");
    if (!token) {
      setFetchError("Authentication token not found. Please log in.");
      setLoading(false);
      return;
    }

    const apiUrl = `${
      import.meta.env.VITE_BACKEND_BASE_URL
    }/api/customer/customer-team`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data && Array.isArray(response.data.data)) {
        setTeamData(response.data.data);
      } else {
        setFetchError("Received unexpected data format from server.");
        setTeamData([]);
      }
    } catch (err) {
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch team members."
      );
      setTeamData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleDeleteClick = useCallback(
    (member) => {
      Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete "${member.name}"? You won't be able to revert this!`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          const token = Cookies.get("token");
          const apiUrl = `${
            import.meta.env.VITE_BACKEND_BASE_URL
          }/api/customer/customer-team/${member.id}`;

          const toastId = toast.loading("Deleting team member...");

          try {
            await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${token}` },
            });

            toast.update(toastId, {
              render: `Team member "${member.name}" has been deleted.`,
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });

            fetchTeamMembers();
          } catch (err) {
            const errorMessage =
              err.response?.data?.message || "Failed to delete team member.";

            toast.update(toastId, {
              render: errorMessage,
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          }
        }
      });
    },
    [fetchTeamMembers]
  );

  const columns = useMemo(
    () => CUSTOMER_TEAM_COLUMNS_CONFIG(navigate, handleDeleteClick),
    [navigate, handleDeleteClick]
  );

  const data = useMemo(() => teamData, [teamData]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state,
    setGlobalFilter,
  } = useTable(
    {
      columns,
      data,
      initialState: {
        pageSize: 10,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const { globalFilter, pageIndex, pageSize } = state;

  if (loading) {
    return (
      <Card>
        <div className="p-4 text-center">Loading team member data...</div>
      </Card>
    );
  }

  if (fetchError) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError} <br />
          <button onClick={fetchTeamMembers} className="mt-2 btn btn-primary">
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card noBorder>
        <div className="md:flex justify-between items-end mb-6">
          <h4 className="card-title">Customer Team</h4>
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 mt-4 md:mt-0">
            <GlobalFilter
              filter={globalFilter || ""}
              setFilter={setGlobalFilter}
              className="flex-grow"
            />
            <button
              className="btn btn-dark flex items-center justify-center"
              onClick={() => navigate("/team/add")}
            >
              <Icon icon="heroicons-outline:plus" className="w-5 h-5 mr-2" />
              Add Team Member
            </button>
          </div>
        </div>

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
                        <th
                          {...column.getHeaderProps(
                            column.getSortByToggleProps()
                          )}
                          className="table-th"
                        >
                          {column.render("Header")}
                          <span className="ltr:ml-1 rtl:mr-1">
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
                  {...getTableBodyProps()}
                  className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700"
                >
                  {page.length > 0 ? (
                    page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell) => {
                            const { key, ...restCellProps } =
                              cell.getCellProps();
                            return (
                              <td
                                key={key}
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
                      <td
                        colSpan={columns.length}
                        className="text-center p-6 text-slate-500 dark:text-slate-400 table-td"
                      >
                        No team members found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default CustomerTeam;
