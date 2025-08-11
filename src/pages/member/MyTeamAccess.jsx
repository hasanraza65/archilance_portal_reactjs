import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useTable, useSortBy, useGlobalFilter } from "react-table";
import GlobalFilter from "@/pages/table/react-table/GlobalFilter";
import Tooltip from "@/components/ui/Tooltip";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const MyTeamAccess = () => {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [updatingRowId, setUpdatingRowId] = useState(null);

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
    }/api/member/customer-team`;

    try {
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      const data = response.data.data || response.data;
      if (Array.isArray(data)) {
        setTeamData(data);
      } else {
        setFetchError("Received unexpected data format from server.");
        setTeamData([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to fetch team members.";
      setFetchError(errorMessage);
      toast.error(errorMessage);
      setTeamData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleUpdateStatus = useCallback(async (teamId, newStatus) => {
    setUpdatingRowId(teamId);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication token is missing.");
      setUpdatingRowId(null);
      return;
    }

    const apiUrl = `${
      import.meta.env.VITE_BACKEND_BASE_URL
    }/api/member/update-team-status`;
    const formData = new FormData();
    formData.append("team_id", teamId);
    formData.append("status", newStatus);

    try {
      await axios.post(apiUrl, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setTeamData((currentData) =>
        currentData.map((member) =>
          member.id === teamId ? { ...member, status: newStatus } : member
        )
      );
      toast.success(`Member status successfully updated to ${newStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status.");
    } finally {
      setUpdatingRowId(null);
    }
  }, []);

  const columns = useMemo(() => {
    // Ye base columns hamesha rahenge
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
                : value === "Approved"
                ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
                : value === "Rejected"
                ? "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
                : "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-400"
            }`}
          >
            {value}
          </span>
        ),
      },
    ];

    // Check karein agar data mein koi 'Pending' item hai
    const showActionColumn = teamData.some(
      (member) => member.status === "Pending"
    );

    // Agar hai, to 'Action' column add karein
    if (showActionColumn) {
      baseColumns.push({
        Header: "Action",
        accessor: "action",
        Cell: ({ row }) => {
          const member = row.original;
          const isUpdating = updatingRowId === member.id;
          if (member.status !== "Pending") {
            return null; // Doosre status ke liye cell khali rakhein
          }
          return (
            <div className="flex space-x-2 rtl:space-x-reverse items-center">
              {isUpdating ? (
                <span className="text-xs text-slate-500 italic">
                  Updating...
                </span>
              ) : (
                <>
                  <Tooltip content="Approve" placement="top" arrow>
                    <button
                      onClick={() => handleUpdateStatus(member.id, "Approved")}
                      className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/50 rounded-md transition-all duration-200"
                    >
                      <Icon
                        icon="heroicons-outline:check-circle"
                        className="w-5 h-5"
                      />
                    </button>
                  </Tooltip>
                  <Tooltip content="Reject" placement="top" arrow>
                    <button
                      onClick={() => handleUpdateStatus(member.id, "Rejected")}
                      className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-md transition-all duration-200"
                    >
                      <Icon
                        icon="heroicons-outline:x-circle"
                        className="w-5 h-5"
                      />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [teamData, handleUpdateStatus, updatingRowId]);

  const data = useMemo(() => teamData, [teamData]);

  const tableInstance = useTable({ columns, data }, useGlobalFilter, useSortBy);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    state,
    setGlobalFilter,
    prepareRow,
  } = tableInstance;
  const { globalFilter } = state;

  if (loading) {
    return (
      <Card>
        <div className="p-4 text-center">Loading team member data...</div>
      </Card>
    );
  }

  if (fetchError && !teamData.length) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError} <br />{" "}
          <button onClick={fetchTeamMembers} className="mt-2 btn btn-primary">
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <Card noBorder>
        <div className="md:flex justify-between items-end mb-6">
          <h4 className="card-title">My Team Access</h4>
          <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 mt-4 md:mt-0">
            <GlobalFilter
              filter={globalFilter || ""}
              setFilter={setGlobalFilter}
              className="flex-grow"
            />
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
                  {rows.length > 0 ? (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
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

export default MyTeamAccess;
