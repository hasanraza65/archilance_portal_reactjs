import React, { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useTable, useSortBy, useGlobalFilter, usePagination } from "react-table"; // Pagination hooks add kar diye
import GlobalFilter from "@/pages/table/react-table/GlobalFilter";
import Tooltip from "@/components/ui/Tooltip";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2'; // SweetAlert2 ko import karein

const PFP_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const AllCustomerTeam = () => {
  const [teamData, setTeamData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [apiMetadata, setApiMetadata] = useState({
    last_page: 1,
    from: 0,
    to: 0,
    total: 0,
  });

  const fetchAllCustomerTeams = useCallback(async (currentPage) => {
    setLoading(true);
    setFetchError(null);

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication token not found.");
      setLoading(false);
      return;
    }

    const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/customer-team?page=${currentPage}`;

    try {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
      });

      // API response paginated hai, isliye data `response.data.data` se nikalein
      if (response.data && Array.isArray(response.data.data)) {
        setTeamData(response.data.data);
        // Pagination ki maloomat bhi state mein save karein
        setApiMetadata({
          last_page: response.data.last_page,
          from: response.data.from,
          to: response.data.to,
          total: response.data.total,
        });
      } else {
        toast.error("Received unexpected data format from server.");
        setTeamData([]);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to fetch customer teams.";
      setFetchError(errorMessage);
      toast.error(errorMessage);
      setTeamData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCustomerTeams(page);
  }, [page, fetchAllCustomerTeams]);

  const handleDelete = useCallback((teamMember) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the team member: "${teamMember.name}". You won't be able to revert this!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = Cookies.get("token");
        const deleteUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/customer-team/${teamMember.id}`;

        const promise = axios.delete(deleteUrl, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.promise(promise, {
          pending: 'Deleting team member...',
          success: {
            render() {
              // Row hatane ke baad data dobara fetch karein taake list aor pagination update ho
              fetchAllCustomerTeams(page); 
              return `Member "${teamMember.name}" has been deleted.`;
            }
          },
          error: 'Could not delete the member.'
        });
      }
    });
  }, [page, fetchAllCustomerTeams]);


  const columns = useMemo(() => [
    { Header: "ID", accessor: "id", Cell: ({ cell: { value } }) => <span>{value}</span> },
    { Header: "Customer", accessor: "customer_user.name",
      Cell: ({ row }) => (
        <span className="text-slate-600 dark:text-slate-300">
          {row.original.customer_user?.name || "N/A"}
        </span>
      )
    },
    { Header: "Team Member", accessor: "name",
      Cell: ({ row }) => {
        const { name } = row.original;
        const profile_pic = row.original.team_user?.profile_pic;
        return (
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="w-7 h-7 rounded-full flex-none bg-slate-600">
              {profile_pic ? (<img src={`${PFP_BASE_URL}${profile_pic}`} alt={name} className="object-cover w-full h-full rounded-full" />) : (<span className="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">{name ? name.charAt(0).toUpperCase() : "?"}</span>)}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{name}</span>
          </div>
        );
      },
    },
    { Header: "Email", accessor: "email" },
    { Header: "Phone", accessor: "phone", Cell: ({ cell: { value } }) => <span>{value || "N/A"}</span> },
    { Header: "Status", accessor: "status",
      Cell: ({ cell: { value } }) => (
        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${value === "Pending" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400" : value === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"}`}>{value}</span>
      ),
    },
    { Header: "Action", accessor: "action",
      Cell: ({ row }) => (
        <div className="flex space-x-3 rtl:space-x-reverse">
          <Tooltip content="Delete" placement="top" arrow>
            <button className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/50 rounded-md" onClick={() => handleDelete(row.original)}>
              <Icon icon="heroicons-outline:trash" className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      )
    }
  ], [handleDelete]);


  const data = useMemo(() => teamData, [teamData]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, state, setGlobalFilter } = useTable({ columns, data, manualPagination: true }, useGlobalFilter, useSortBy);
  const { globalFilter } = state;


  if (loading && !teamData.length) {
    return <Card><div className="p-4 text-center">Loading data...</div></Card>;
  }

  if (fetchError && !teamData.length) {
    return (
      <Card>
        <div className="p-4 text-center text-danger-500">
          Error: {fetchError} <br />
          <button onClick={() => fetchAllCustomerTeams(1)} className="mt-2 btn btn-primary">Try Again</button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Card noBorder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">All Customer Teams</h4>
          <GlobalFilter filter={globalFilter} setFilter={setGlobalFilter} />
        </div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...getTableProps()}>
                <thead className="bg-slate-100 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th {...column.getHeaderProps(column.getSortByToggleProps())} className="table-th">{column.render("Header")}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()} className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {rows.length > 0 ? (
                    rows.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell) => (<td {...cell.getCellProps()} className="table-td">{cell.render("Cell")}</td>))}
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={columns.length} className="table-td text-center">No team members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Showing {apiMetadata.from || 0} to {apiMetadata.to || 0} of {apiMetadata.total || 0} entries
          </div>
          <ul className="flex items-center space-x-2 rtl:space-x-reverse">
            <li>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded">
                <Icon icon="heroicons-outline:chevron-left" />
              </button>
            </li>
            {Array.from({ length: apiMetadata.last_page }, (_, i) => i + 1).map(pageNum => (
              <li key={pageNum}>
                <button
                  className={`p-2 leading-tight ${pageNum === page ? 'bg-slate-900 text-white dark:bg-slate-600' : 'bg-white text-slate-600 dark:bg-slate-700 dark:text-slate-300'} hover:bg-slate-200 dark:hover:bg-slate-600 rounded`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => setPage(p => Math.min(apiMetadata.last_page, p + 1))} disabled={page === apiMetadata.last_page} className="text-slate-600 dark:text-slate-300 p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded">
                <Icon icon="heroicons-outline:chevron-right" />
              </button>
            </li>
          </ul>
        </div>
      </Card>
    </>
  );
};

export default AllCustomerTeam;