import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import Card from "@/components/ui/Card";

// --- START: Helper functions and presets configuration ---

const getTodayDateRange = () => {
  const today = new Date();
  return [today, today];
};

const getWeekDateRange = (date = new Date()) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
  return [monday, sunday];
};
const getLastWeekDateRange = () => {
  const today = new Date();
  const lastWeekDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7
  );
  return getWeekDateRange(lastWeekDate);
};
const getCurrentMonthDateRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [firstDay, lastDay];
};
const getLastMonthDateRange = () => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
  return [firstDay, lastDay];
};

const PRESETS = [
  { label: "Today", func: getTodayDateRange },
  { label: "Current week", func: getWeekDateRange },
  { label: "Last week", func: getLastWeekDateRange },
  { label: "Current month", func: getCurrentMonthDateRange },
  { label: "Last month", func: getLastMonthDateRange },
];

const ChevronDownIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date(0, 0, 0, h, m);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatSecondsToHoursMinutes = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "0h 0m";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AdminEmployeeWorkSession = () => {
  const { employeeId } = useParams();
  const { token, logout, isAuthenticated } = useAuth();

  // States
  const [employeeName, setEmployeeName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [dateRange, setDateRange] = useState(getTodayDateRange());
  const [overallTotalTime, setOverallTotalTime] = useState("0h 0m");
  const [manualTotalTime, setManualTotalTime] = useState("0h 0m");

  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("Today");
  const presetDropdownRef = useRef(null);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin`;
  const STORAGE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage`;

  // useEffect hooks remain the same
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(event.target)
      ) {
        setIsPresetDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !employeeId) return;
    const fetchEmployeeDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employee-user/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not fetch employee details.");
        const data = await res.json();
        setEmployeeName(data.data?.name || "Employee");
      } catch (error) {
        toast.error(error.message);
        setEmployeeName("Unknown Employee");
      }
    };
    fetchEmployeeDetails();
  }, [isAuthenticated, token, employeeId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not fetch projects.");
        const data = await res.json();
        setProjects(data || []);
      } catch (error) {
        toast.error(error.message);
      }
    };
    fetchProjects();
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (!selectedProject) {
      setTasks([]);
      setSelectedTask("");
      return;
    }
    const fetchTasksForProject = async () => {
      setTasksLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/project/${selectedProject}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
          throw new Error(
            `Could not fetch tasks for project ID ${selectedProject}.`
          );
        const projectDetails = await res.json();
        setTasks(projectDetails.tasks || []);
      } catch (error) {
        toast.error(error.message);
        setTasks([]);
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasksForProject();
  }, [selectedProject, token]);

  const fetchWorkSessions = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    window.scrollTo(0, 0);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      employee_id: employeeId,
    });
    if (selectedTask) params.append("task_id", selectedTask);
    
    if (dateRange && dateRange[0])
      params.append("start_date", formatDateForAPI(dateRange[0]));
    if (dateRange && dateRange.length > 1 && dateRange[1])
      params.append("end_date", formatDateForAPI(dateRange[1]));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/work-session?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        toast.error("Session expired.");
        logout();
        return;
      }
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch data");

      const fetchedSessions = result.data?.reverse() || [];
      setSessions(fetchedSessions);
      setOverallTotalTime(result.overall_total_time || "0h 0m");

      const totalManualSeconds = fetchedSessions
        .filter(session => session.type === 'Manual')
        .reduce((acc, session) => acc + Math.abs(session.raw_calculation?.net_seconds || 0), 0);
      setManualTotalTime(formatSecondsToHoursMinutes(totalManualSeconds));

      setPaginationInfo({
        currentPage: result.current_page,
        lastPage: result.last_page,
      });
    } catch (err) {
      toast.error(err.message);
      setOverallTotalTime("0h 0m");
      setManualTotalTime("0h 0m");
    } finally {
      setLoading(false);
    }
  }, [employeeId, currentPage, selectedTask, dateRange, token, logout]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkSessions();
    else setLoading(false);
  }, [fetchWorkSessions, isAuthenticated]);
  
  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    else if (isAuthenticated) fetchWorkSessions();
  }, [selectedTask, dateRange, selectedProject]);
  
  // Handlers remain the same
  const handleResetFilters = () => {
    setSelectedProject("");
    setSelectedTask("");
    setTasks([]);
    setDateRange(getTodayDateRange());
    setActivePreset("Today");
    setOverallTotalTime("0h 0m");
    setManualTotalTime("0h 0m");
  };

  const handleDelete = (sessionId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This is irreversible!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${API_BASE_URL}/work-session/${sessionId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error("Failed to delete.");
          Swal.fire("Deleted!", "Session deleted.", "success");
          fetchWorkSessions();
        } catch (e) {
          Swal.fire("Error!", e.message, "error");
        }
      }
    });
  };

  const handleNextPage = () => {
    if (paginationInfo?.currentPage < paginationInfo?.lastPage)
      setCurrentPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (paginationInfo?.currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handlePresetSelect = (preset) => {
    setDateRange(preset.func());
    setActivePreset(preset.label);
    setIsPresetDropdownOpen(false);
  };

  if (!isAuthenticated)
    return (
      <div className="p-8 text-center">
        <p>Please log in.</p>
      </div>
    );

  return (
    <Card>
      {/* --- MODIFIED FOR RESPONSIVENESS --- */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <h4 className="card-title">
            Work Diary for{" "}
            <span className="text-slate-800 dark:text-slate-200">
              {employeeName || "Loading..."}
            </span>
          </h4>
          {!loading && (
            <div className="flex items-baseline gap-4 mt-2">
              <div className="text-slate-800 dark:text-slate-200 font-bold text-lg">
                Total Time: {overallTotalTime}
              </div>
              {manualTotalTime !== "0h 0m" && (
                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                   Manual: <span className="font-semibold text-sky-700 dark:text-sky-400">({manualTotalTime})</span>
                </div>
              )}
            </div>
          )}
        </div>
        <Link
          to="/employees"
          className="btn btn-sm btn-outline-dark whitespace-nowrap"
        >
          ← Back to Employee List
        </Link>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-8 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex flex-col justify-end">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Job
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTask("");
              }}
              className="form-select w-full"
            >
              <option value="">All Jobs</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Project
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={!selectedProject || tasksLoading}
              className="form-select w-full disabled:bg-slate-100"
            >
              <option value="">All Projects</option>
              {tasksLoading ? (
                <option>Loading...</option>
              ) : (
                tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.task_title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col justify-end lg:col-span-3">
            {/* --- MODIFIED FOR RESPONSIVENESS --- */}
            <div className="flex flex-col lg:flex-row lg:items-end gap-2">
              <div className="flex-shrink-0 w-full lg:w-auto">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Period
                </label>
                <div className="relative" ref={presetDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsPresetDropdownOpen(!isPresetDropdownOpen)
                    }
                    // --- MODIFIED FOR RESPONSIVENESS ---
                    className="form-input w-full lg:w-48 flex items-center justify-between text-left"
                  >
                    <span className="text-slate-800 dark:text-slate-300 truncate">
                      {activePreset}
                    </span>
                    <ChevronDownIcon />
                  </button>
                  {isPresetDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-full lg:w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-1">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => handlePresetSelect(preset)}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-grow">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Custom Date Range
                </label>
                <Flatpickr
                  className="form-input w-full"
                  value={dateRange}
                  options={{ mode: "range", dateFormat: "M j, Y" }}
                  onChange={(dates) => {
                    if (dates.length === 2) {
                      setDateRange(dates);
                      setActivePreset("Custom");
                    }
                  }}
                />
              </div>

              <div className="flex-shrink-0 w-full lg:w-auto">
                <button
                  onClick={handleResetFilters}
                  // --- MODIFIED FOR RESPONSIVENESS ---
                  className="btn bg-slate-800 hover:bg-slate-900 text-white font-bold whitespace-nowrap h-10 w-full lg:w-auto"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6">
        {loading ? (
          <div className="text-center py-16">
            <p>Loading diary entries...</p>
          </div>
        ) : sessions.length > 0 ? (
          <div>
            {sessions.map((session, index) => (
              <div
                key={session.id}
                className="relative group flex items-start space-x-4 py-8"
              >
                <div className="flex flex-col items-center h-full">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                  {index < sessions.length - 1 && (
                    <div className="w-px flex-grow bg-slate-200 dark:bg-slate-700 mt-2"></div>
                  )}
                </div>
                <div
                  className={`flex-1 ${
                    index < sessions.length - 1
                      ? "border-b border-slate-200 dark:border-slate-700 pb-8"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatTime(session.start_time)} –{" "}
                        {formatTime(session.end_time)}
                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                          ({session.total_time})
                        </span>
                      </p>
                      {session.type === 'Manual' && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 rounded-full text-xs font-medium">
                          Manual
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(session.id)}
                      title="Delete Session"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-400 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  {session.memo_content && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {session.memo_content}
                    </p>
                  )}
                  <div className="mt-4">
                    {session.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {session.screenshots.map((ss) => (
                          <div key={ss.id} className="text-center">
                            <a
                              href={`${STORAGE_URL}/${ss.screenshot_file}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={`${STORAGE_URL}/${ss.screenshot_file}`}
                                alt={`Screenshot`}
                                className="w-full rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500"
                              />
                            </a>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                              {formatTime(ss.created_at.split("T")[1])}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No screenshots for this session.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500">
              No work sessions found matching your criteria.
            </p>
          </div>
        )}
        {paginationInfo && paginationInfo.lastPage > 1 && (
          <div className="flex justify-center items-center mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 space-x-4">
            <button
              onClick={handlePrevPage}
              disabled={paginationInfo.currentPage === 1}
              className="px-4 py-2 bg-slate-800 text-white rounded-md disabled:bg-slate-400"
            >
              Prev
            </button>
            <span className="text-slate-600 dark:text-slate-400">
              Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={paginationInfo.currentPage === paginationInfo.lastPage}
              className="px-4 py-2 bg-slate-800 text-white rounded-md disabled:bg-slate-400"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdminEmployeeWorkSession;