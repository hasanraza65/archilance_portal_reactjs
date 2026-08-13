import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import Select from "react-select";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
} from "react-table";
import GlobalFilter from "../table/react-table/GlobalFilter";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import Alert from "@/components/ui/Alert";
import Tooltip from "@/components/ui/Tooltip";
import { useAuth } from "@/context/AuthContext";
import { canManageEmployees, getApiPrefix, getMediaUrl } from "@/pages/utility/apiHelper";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "extra-time", label: "Extra Time" },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "Manager", label: "Manager" },
  { value: "Executive", label: "Executive" },
  { value: "Supervisor", label: "Coordinator" },
  { value: "Employee", label: "Employee" },
  { value: "Internee", label: "Internee" },
  { value: "Outsource", label: "Outsource" },
  { value: "none", label: "Unassigned" },
];

// Mirrors the role-based visibility rules used when filtering the fetched list,
// so the type dropdown never offers a type a given role isn't allowed to see.
const getAllowedEmployeeTypeValues = (user) => {
  const role = user?.role?.toLowerCase();
  const type = user?.employee_type?.toLowerCase();

  if (role === "admin") {
    return EMPLOYEE_TYPE_OPTIONS.map((o) => o.value);
  }
  if (type === "manager" || type === "executive") {
    const values = ["Supervisor", "Employee", "Internee", "none"];
    if (type === "executive") values.unshift("Manager");
    return values;
  }
  if (type === "supervisor") {
    return ["Employee", "Internee", "none"];
  }
  if (type === "employee") {
    return ["Employee"];
  }
  return EMPLOYEE_TYPE_OPTIONS.map((o) => o.value);
};

const statusFilterSelectStyles = {
  control: (base, state) => ({
    ...base,
    borderColor: state.isFocused ? "#94a3b8" : "#cbd5e1",
    borderRadius: "0.375rem",
    minHeight: "40px",
    boxShadow: "none",
    "&:hover": { borderColor: "#94a3b8" },
  }),
  valueContainer: (base) => ({ ...base, padding: "2px 8px" }),
  input: (base) => ({ ...base, margin: "0px", padding: "0px" }),
  indicatorSeparator: () => ({ display: "none" }),
  clearIndicator: (base) => ({ ...base, color: "#94a3b8", ":hover": { color: "#64748b" } }),
  dropdownIndicator: (base) => ({ ...base, color: "#94a3b8", ":hover": { color: "#64748b" } }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "14px",
    backgroundColor: state.isSelected ? "#0f172a" : state.isFocused ? "#f1f5f9" : null,
    color: state.isSelected ? "white" : "#0f172a",
    ":active": { backgroundColor: "#e2e8f0" },
  }),
  // Global CSS only whitens multi-value chip text for the "select" classNamePrefix,
  // not "react-select" (used here), which left chips dark-on-dark. Set explicitly.
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#0f172a",
    borderRadius: "4px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#ffffff",
    fontSize: "12px",
    padding: "4px 6px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#cbd5e1",
    ":hover": { backgroundColor: "transparent", color: "#ffffff" },
  }),
};

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
      const { name, profile_pic, id, employee_type, employee_team, email, phone } = row.original;
      const lowerCaseEmployeeType = employee_type?.toLowerCase();

      // --- UPDATED CODE ---
      const isSupervisor = lowerCaseEmployeeType === "supervisor";
      const displayType = isSupervisor ? "Coordinators" : employee_type;

      // Logic to determine if a badge should be shown
      const showBadge =
        lowerCaseEmployeeType === "manager" ||
        lowerCaseEmployeeType === "executive" || // Added executive
        lowerCaseEmployeeType === "outsource" ||
        lowerCaseEmployeeType === "internee" || // Added internee
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
      } else if (lowerCaseEmployeeType === "internee") {
        // New badge class for Internee
        badgeClass =
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-200";
      } else {
        // Fallback for Outsource
        badgeClass =
          "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-200";
      }
      // --- END OF UPDATE ---

      // Team badge — admin-only, deliberately distinct hues from the
      // employee_type badge above so the two rows of badges read apart.
      const TEAM_BADGE_CLASS = {
        "BIM Team": "bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-200",
        "3D Team": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-700 dark:text-fuchsia-200",
        "Outsource Department": "bg-amber-100 text-amber-800 dark:bg-amber-700 dark:text-amber-200",
        "Business Team": "bg-lime-100 text-lime-800 dark:bg-lime-700 dark:text-lime-200",
      };
      const teamBadgeClass = TEAM_BADGE_CLASS[employee_team] || "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200";

      return (
        <div className="flex items-center space-x-3 rtl:space-x-reverse group" title={`View details for ${name}`}>
          {/* Use a real anchor so browser shows "Open link in new tab" in context menu.
              Left-click still navigates via router (preventDefault + navigate) */}
          <a
            href={`/employees/view/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              // keep SPA navigation on left click
              e.preventDefault();
              navigate(`/employees/view/${id}`);
            }}
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <EmployeeAvatar profilePic={profile_pic} name={name} />
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
                {isAdmin && employee_team && (
                  <span className={`px-2 py-0.5 text-[10px] leading-tight font-semibold rounded-full ${teamBadgeClass}`}>
                    {employee_team}
                  </span>
                )}
              </div>
              <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                {email && <span className="lowercase truncate max-w-[150px]" title={email}>{email}</span>}
                {phone && <span>{phone}</span>}
              </div>
            </div>
          </a>
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
            onClick={() => navigate(`/employees/work-sessions/${row.original.id}`)}
            className="p-1.5 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700 rounded-md transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
            title="View Work Sessions"
          >
            <Icon icon="heroicons-outline:calendar-days" className="w-4 h-4" />
          </button>
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

// Avatar with a React-SAFE image fallback. The previous onError handler assigned
// img.outerHTML directly, which pulled the React-managed <img> out of the DOM; the
// next re-render (e.g. changing pages) then crashed with
// "Failed to execute 'removeChild' on 'Node'". Tracking the failure in state and
// letting React swap the element keeps the node under React's control.
const EmployeeAvatar = ({ profilePic, name }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false); // this row slot got reused for a different employee — retry theirs
  }, [profilePic]);

  const src = profilePic && !failed ? getMediaUrl(profilePic) : null;
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <span className="w-7 h-7 rounded-full flex-none bg-slate-600">
      {src ? (
        <img
          src={src}
          alt={name || "Profile"}
          className="object-cover w-full h-full rounded-full"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex items-center justify-center w-full h-full text-xs text-white bg-slate-500 rounded-full">
          {initial}
        </span>
      )}
    </span>
  );
};

// Compact page-number window: always show first & last, plus the current page and its
// neighbours, collapsing the rest into "..." gaps.
const buildPageList = (current, last) => {
  const total = Math.max(1, Number(last) || 1);
  const cur = Math.min(Math.max(1, Number(current) || 1), total);
  const wanted = new Set([1, total, cur, cur - 1, cur + 1]);
  const sorted = [...wanted]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("...");
    out.push(n);
    prev = n;
  }
  return out;
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
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [pageMeta, setPageMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 });
  const fetchSeqRef = useRef(0); // guards against out-of-order page/search fetches
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce the search box so the SERVER filters across ALL rows (not just the
  // current page). Reset to page 1 whenever the term changes.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const handleSearchChange = useCallback((val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  }, []);
  const hasManagementPermission = useMemo(() => canManageEmployees(), []);

  const isIndividualEmployee = useMemo(
    () =>
      user?.role?.toLowerCase() !== "admin" &&
      user?.employee_type?.toLowerCase() === "employee",
    [user]
  );

  const allowedEmployeeTypes = useMemo(
    () => getAllowedEmployeeTypeValues(user),
    [user]
  );

  const employeeTypeOptions = useMemo(
    () => EMPLOYEE_TYPE_OPTIONS.filter((o) => allowedEmployeeTypes.includes(o.value)),
    [allowedEmployeeTypes]
  );

  const fetchEmployees = useCallback(async () => {
    if (!user) return;
    const reqId = ++fetchSeqRef.current;
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

      // A single employee only ever sees their own record, so there's nothing
      // to paginate or filter by type for that role.
      const params = isIndividualEmployee
        ? { page: 1, per_page: 500, employee_type: "Employee" }
        : (() => {
            const selectedTypes = employeeTypeFilter.length
              ? employeeTypeFilter.filter((v) => allowedEmployeeTypes.includes(v))
              : allowedEmployeeTypes;
            const base = { page: currentPage, per_page: perPage };
            if (debouncedSearch) base.search = debouncedSearch;
            // Admin with no explicit type filter selected sees everyone; skip the param.
            const isAdmin = user.role?.toLowerCase() === "admin";
            if (isAdmin && employeeTypeFilter.length === 0) {
              return base;
            }
            return { ...base, employee_type: selectedTypes.join(",") };
          })();

      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          params,
        }
      );

      // Ignore a response that a newer page/search request has already superseded.
      if (reqId !== fetchSeqRef.current) return;

      const responseData = response.data;
      let rawData = [];
      if (responseData && Array.isArray(responseData.data)) {
        rawData = responseData.data;
        setPageMeta({
          currentPage: responseData.current_page ?? params.page,
          lastPage: responseData.last_page ?? 1,
          total: responseData.total ?? rawData.length,
        });
      } else if (Array.isArray(responseData)) {
        rawData = responseData;
        setPageMeta({ currentPage: 1, lastPage: 1, total: rawData.length });
      } else {
        setFetchError("Received unexpected data format from server.");
        setEmployeeData([]);
        return;
      }

      setEmployeeData(rawData);
    } catch (err) {
      if (reqId !== fetchSeqRef.current) return;
      setFetchError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch employees."
      );
      setEmployeeData([]);
    } finally {
      if (reqId === fetchSeqRef.current) setLoading(false);
    }
  }, [user, isIndividualEmployee, employeeTypeFilter, allowedEmployeeTypes, currentPage, perPage, debouncedSearch]);

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

    // The server already scopes results by role/type (see fetchEmployees); this
    // stays as a defense-in-depth guard against unexpected backend data.
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
          empType === "internee" ||
          !emp.employee_type;
      } else if (currentUserType === "supervisor") {
        keep = empType === "employee" || empType === "internee" || !emp.employee_type;
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
      setDeleteSuccess(
        `Employee "${employeeToDelete.name}" deleted successfully!`
      );
      handleCloseDeleteModal();
      await fetchEmployees();
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
  }, [employeeToDelete, handleCloseDeleteModal, fetchEmployees]);

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
    { columns, data },
    useGlobalFilter,
    useSortBy
  );

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

  const goToPage = (p) => {
    const target = Math.min(Math.max(1, p), Math.max(1, pageMeta.lastPage));
    if (target !== currentPage) setCurrentPage(target);
  };

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
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search employees..."
              />
            </div>
            {!isIndividualEmployee && employeeTypeOptions.length > 0 && (
              <div className="w-auto min-w-[220px]">
                <Select
                  inputId="employee-type-filter"
                  isMulti
                  options={employeeTypeOptions}
                  styles={statusFilterSelectStyles}
                  classNamePrefix="react-select"
                  value={employeeTypeOptions.filter((o) =>
                    employeeTypeFilter.includes(o.value)
                  )}
                  onChange={(selected) => {
                    setEmployeeTypeFilter(selected ? selected.map((s) => s.value) : []);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by type"
                />
              </div>
            )}
            {isAdmin && (
              <div className="w-auto min-w-[150px]">
                <Select
                  inputId="employee-status-filter"
                  options={STATUS_FILTER_OPTIONS}
                  styles={statusFilterSelectStyles}
                  classNamePrefix="react-select"
                  value={STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter) || null}
                  onChange={(opt) => setStatusFilter(opt ? opt.value : "")}
                  placeholder="Filter"
                  isClearable
                />
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
        <div
          className={`overflow-x-auto -mx-6 transition-opacity duration-200 ${
            loading && employeeData.length
              ? "opacity-60 pointer-events-none"
              : "opacity-100"
          }`}
        >
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
                  {rows.length > 0 ? (
                    rows.map((row) => {
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
        {!isIndividualEmployee && rows.length > 0 && (
          <div className="md:flex md:space-y-0 space-y-5 justify-between mt-6 items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <select
                className="form-select py-2"
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
                  {pageMeta.currentPage} of {pageMeta.lastPage}
                </span>
                <span className="hidden sm:inline">
                  {" "}
                  ({pageMeta.total} total records)
                </span>
              </span>
            </div>
            <ul className="flex items-center space-x-2 rtl:space-x-reverse">
              <li>
                <button
                  className={`pagination-link ${
                    currentPage <= 1 && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <Icon icon="heroicons:chevron-double-left-20-solid" />
                </button>
              </li>
              <li>
                <button
                  className={`pagination-link ${
                    currentPage <= 1 && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <Icon icon="heroicons-outline:chevron-left" />
                </button>
              </li>
              {buildPageList(currentPage, pageMeta.lastPage).map((p, i) =>
                p === "..." ? (
                  <li
                    key={`gap-${i}`}
                    className="px-1 text-slate-400 select-none"
                  >
                    &hellip;
                  </li>
                ) : (
                  <li key={p}>
                    <button
                      type="button"
                      onClick={() => goToPage(p)}
                      aria-current={p === currentPage ? "page" : undefined}
                      className={`min-w-[2rem] h-8 px-2 flex items-center justify-center rounded-md text-sm font-medium transition-colors duration-150 ${
                        p === currentPage
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  </li>
                )
              )}
              <li>
                <button
                  className={`pagination-link ${
                    currentPage >= pageMeta.lastPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => setCurrentPage((p) => Math.min(pageMeta.lastPage, p + 1))}
                  disabled={currentPage >= pageMeta.lastPage}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </button>
              </li>
              <li>
                <button
                  className={`pagination-link ${
                    currentPage >= pageMeta.lastPage && "opacity-50 cursor-not-allowed"
                  }`}
                  onClick={() => setCurrentPage(pageMeta.lastPage)}
                  disabled={currentPage >= pageMeta.lastPage}
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
