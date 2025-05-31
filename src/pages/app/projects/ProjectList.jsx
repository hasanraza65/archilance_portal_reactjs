import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Dropdown from "@/components/ui/Dropdown";
import { MenuItem } from "@headlessui/react"; // Ensure this is the correct import
import { deleteProjectAPI, setEditModalAndItem } from "./store";
import { useNavigate } from "react-router-dom";
import { useTable, useRowSelect, useSortBy, useGlobalFilter, usePagination } from "react-table";
import Swal from 'sweetalert2';

const ProjectList = ({ projects }) => {
  // console.log("DEBUG: ProjectList rendering with projects count:", projects?.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isDeleting, isUpdating } = useSelector(state => state.project);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return "Invalid Date";
    }
  };
  const handleRowNavigation = (projectId) => projectId && navigate(`/projects/${projectId}`);

  const actionsList = useMemo(() => [
    { name: "view", icon: "heroicons-outline:eye", doit: (item) => navigate(`/projects/${item.id}`) },
    { name: "edit", icon: "heroicons:pencil-square", doit: (item) => {
        // console.log("DEBUG: ProjectList handleEdit: Dispatching setEditModalAndItem for:", item?.id);
        dispatch(setEditModalAndItem({ open: true, project: item }));
      }
    },
    { name: "delete", icon: "heroicons-outline:trash", doit: (item) => {
        // console.log("DEBUG: ProjectList handleDelete: Initiating delete for:", item?.id);
        Swal.fire({
          title: 'Are you sure?',
          text: `You are about to delete the project "${item.name || 'this project'}". This action cannot be undone!`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!',
          cancelButtonText: 'Cancel',
        }).then((result) => {
          if (result.isConfirmed) {
            dispatch(deleteProjectAPI(item.id)).unwrap()
              .then(() => Swal.fire('Deleted!', `Project "${item.name || 'this project'}" has been deleted.`, 'success'))
              .catch(error => Swal.fire('Failed!', `Could not delete project. ${error || 'Please try again.'}`, 'error'));
          }
        });
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [dispatch, navigate]); // dispatch and navigate are stable, fine for deps

  const COLUMNS = useMemo(() => [
    { Header: "Name", accessor: "name", Cell: ({ cell: { value } }) => {
        const initials = value ? (value.charAt(0) + (value.charAt(1) || "")).toUpperCase() : "NA";
        return (
          <div className="flex space-x-3 items-center text-left rtl:space-x-reverse">
            <div className="flex-none">
              <div className="h-10 w-10 rounded-full text-sm bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center font-medium -tracking-[1px]">
                {initials}
              </div>
            </div>
            <div className="flex-1 font-medium text-sm leading-4 whitespace-nowrap">
              {value && value.length > 25 ? value.substring(0, 25) + "..." : value || "N/A"}
            </div>
          </div>
        );
    }},
    { Header: "Start Date", accessor: "startDate", Cell: ({ cell: { value } }) => (<span>{formatDate(value)}</span>) },
    { Header: "End Date", accessor: "endDate", Cell: ({ cell: { value } }) => (<div>{formatDate(value)}</div>) },
    { Header: "Action", accessor: "action", Cell: ({ row }) => {
        const projectItem = row.original;
        const actionsDisabled = isDeleting || isUpdating;
        return (
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              classMenuItems="right-0 w-[140px] top-[110%] "
              label={
                <span className="text-xl text-slate-900 dark:text-slate-300">
                  <Icon icon="heroicons-outline:dots-vertical" />
                </span>
              }
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {actionsList.map((item, i) => (
                  // Updated MenuItem with as="div"
                  <MenuItem
                    as="div"
                    key={i}
                    disabled={actionsDisabled && (item.name === 'edit' || item.name === 'delete')}
                  >
                    {({ active }) => (
                        <div
                          onClick={(e) => { e.stopPropagation(); item.doit(projectItem); }}
                          className={`
                              ${active ? (item.name === "delete" ? "bg-red-500 bg-opacity-20 text-red-500" : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200")
                                      : (item.name === "delete" ? "text-red-500" : "text-slate-600 dark:text-slate-300")}
                              ${(actionsDisabled && (item.name === 'edit' || item.name === 'delete')) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center rtl:space-x-reverse`}
                        >
                          <span className="text-base"><Icon icon={item.icon} /></span>
                          <span>{item.name}</span>
                        </div>
                    )}
                  </MenuItem>
                ))}
              </div>
            </Dropdown>
          </div>
        );
    }},
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [isDeleting, isUpdating, actionsList]); // actionsList is memoized, so this is fine

  const data = useMemo(() => projects || [], [projects]);
  const tableInstance = useTable({ columns: COLUMNS, data, initialState: { pageSize: 10 } }, useGlobalFilter, useSortBy, usePagination, useRowSelect);
  const { getTableProps, getTableBodyProps, headerGroups, page, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state, gotoPage, setPageSize, prepareRow } = tableInstance;
  const { pageIndex, pageSize } = state;

  if (!projects || projects.length === 0) {
    // This can be handled by the parent component (ProjectPostPage)
    return null;
  }

  return (
    <>
      <Card noBorder>
        <div className="md:flex justify-between items-center mb-6">
          <h4 className="card-title">Project List</h4>
        </div>
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table
                className="min-w-full divide-y divide-slate-100 table-fixed dark:divide-slate-700"
                {...getTableProps()}
              >
                <thead className="bg-slate-50 dark:bg-slate-700">
                  {headerGroups.map((headerGroup) => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map((column) => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          scope="col"
                          className="table-th"
                        >
                          {column.render("Header")}
                          <span>
                            {column.isSorted ? (column.isSortedDesc ? " 🔽" : " 🔼") : ""}
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody
                  className="bg-white divide-y divide-slate-100 dark:bg-slate-800 dark:divide-slate-700"
                  {...getTableBodyProps()}
                >
                  {page.map((row) => {
                    prepareRow(row);
                    const projectItem = row.original;
                    return (
                      <tr
                        {...row.getRowProps()}
                        className="even:bg-slate-50 dark:even:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer"
                        onClick={() => handleRowNavigation(projectItem.id)}
                      >
                        {row.cells.map(cell => (
                          <td {...cell.getCellProps()} className="table-td">
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
        {projects && projects.length > pageSize && (
          <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <select
                className="form-control py-2 w-max dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
              >
                {[10, 25, 50].map(size => (
                  <option key={size} value={size}>Show {size}</option>
                ))}
              </select>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Page{" "}<span>{pageIndex + 1} of {pageOptions.length}</span>
              </span>
            </div>
            <ul className="flex items-center space-x-3 rtl:space-x-reverse">
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={`p-1 flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${!canPreviousPage ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              {pageOptions.map((p, pageIdx) => (
                <li key={pageIdx}>
                  <button
                    aria-current="page"
                    className={`text-sm flex h-8 w-8 items-center justify-center rounded transition-all duration-150
                      ${pageIdx === pageIndex
                        ? "bg-slate-900 dark:bg-slate-600 text-white font-medium"
                        : "bg-slate-100 dark:bg-slate-700 dark:text-slate-400 text-slate-900 font-normal hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                    onClick={() => gotoPage(pageIdx)}
                  >
                    {pageIdx + 1}
                  </button>
                </li>
              ))}
              <li className="text-xl leading-4 text-slate-900 dark:text-white rtl:rotate-180">
                <button
                  className={`p-1 flex items-center justify-center h-8 w-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${!canNextPage ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
              </li>
            </ul>
          </div>
        )}
      </Card>
    </>
  );
};

export default ProjectList;