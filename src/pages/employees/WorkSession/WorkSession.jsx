import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";

// --- START: Helper functions (These seem correct) ---

const getTodayDateRange = () => {
  const today = new Date();
  return [today, today];
};

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
// --- END: Helper functions ---

const WorkSession = () => {
  const { token, isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedTask, setSelectedTask] = useState("");
  const [dateRange, setDateRange] = useState(getTodayDateRange());
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // --- FIX: Replaced `hasSearched` with a more reliable state ---
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [overallTotalTime, setOverallTotalTime] = useState("0h 0m");
  const [manualTotalTime, setManualTotalTime] = useState("0h 0m");

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/employee`;
  const STORAGE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage`;

  // Fetching projects (jobs) - no changes here
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Could not fetch jobs. Status: ${res.status}`);
        const data = await res.json();
        setProjects(data || []);
      } catch (error) {
        toast.error(error.message);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, [isAuthenticated, token, API_BASE_URL]);

  // Fetching tasks for a selected project - no changes here
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
        if (!res.ok) throw new Error(`Could not fetch details for project ID ${selectedProject}.`);
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
  }, [selectedProject, token, API_BASE_URL]);

  // --- FIX: Major change in the data fetching logic ---
  const fetchWorkSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    window.scrollTo(0, 0);

    const params = new URLSearchParams({ page: currentPage.toString() });
    if (selectedProject) params.append("project_id", selectedProject);
    if (selectedTask) params.append("task_id", selectedTask);
    if (dateRange && dateRange[0]) params.append("start_date", formatDateForAPI(dateRange[0]));
    if (dateRange && dateRange.length > 1 && dateRange[1]) params.append("end_date", formatDateForAPI(dateRange[1]));

    try {
      const response = await fetch(`${API_BASE_URL}/work-session?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || `Request failed`);

      const fetchedSessions = result.data?.reverse() || [];
      setSessions(fetchedSessions);
      setOverallTotalTime(result.overall_total_time || "0h 0m");

      const totalManualSeconds = fetchedSessions
        .filter((session) => session.type === "Manual")
        .reduce((acc, session) => acc + Math.abs(session.raw_calculation.net_seconds || 0), 0);

      setManualTotalTime(formatSecondsToHoursMinutes(totalManualSeconds));

      setPaginationInfo({
        currentPage: result.current_page,
        lastPage: result.last_page,
      });
    } catch (err) {
      toast.error(err.message);
      setOverallTotalTime("0h 0m");
      setManualTotalTime("0h 0m");
      setSessions([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false); // Mark that the initial load has completed
    }
  }, [
    currentPage,
    isAuthenticated,
    token,
    API_BASE_URL,
    dateRange,
    selectedProject,
    selectedTask,
  ]);

  useEffect(() => {
    fetchWorkSessions();
  }, [fetchTrigger, fetchWorkSessions]);


  const handleSearch = () => {
    setCurrentPage(1); // Reset to the first page for a new search
    setFetchTrigger((t) => t + 1); // Trigger the fetch
  };

  const handleResetFilters = () => {
    setSelectedProject("");
    setSelectedTask("");
    setTasks([]);
    setDateRange(getTodayDateRange());
    setCurrentPage(1); // Also reset page on reset
    setFetchTrigger((t) => t + 1); // And trigger a fetch
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
          setFetchTrigger((t) => t + 1); // Refresh data
        } catch (e) {
          Swal.fire("Error!", e.message, "error");
        }
      }
    });
  };

  const handleDeleteScreenshot = (sessionId, screenshotId) => {
    Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`${API_BASE_URL}/screenshot/${screenshotId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Failed to delete the screenshot.");
                }
                Swal.fire("Deleted!", "The screenshot has been deleted.", "success");
                setSessions((currentSessions) =>
                    currentSessions.map((session) => {
                        if (session.id === sessionId) {
                            const updatedScreenshots = session.screenshots.filter(
                                (ss) => ss.id !== screenshotId
                            );
                            return { ...session, screenshots: updatedScreenshots };
                        }
                        return session;
                    })
                );
            } catch (e) {
                Swal.fire("Error!", e.message, "error");
            }
        }
    });
  };

  const handleNextPage = () => {
    if (paginationInfo?.currentPage < paginationInfo?.lastPage) {
      setCurrentPage((p) => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (paginationInfo?.currentPage > 1) {
      setCurrentPage((p) => p - 1);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div className="p-8 text-center">
        <p>Please log in.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 ">
          Work Diary
        </h1>
        {(!isInitialLoad || sessions.length > 0) && ( // Show totals if not initial load or if there's data
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mt-2 mb-6">
            <div className="text-slate-800 dark:text-slate-200 font-bold text-lg">
              Total Time: {overallTotalTime}
            </div>
            {manualTotalTime !== "0h 0m" && (
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Manual:{" "}
                <span className="font-semibold text-sky-700 dark:text-sky-400">
                  ({manualTotalTime})
                </span>
              </div>
            )}
          </div>
        )}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 backdrop-blur-sm p-6 rounded-xl mb-8 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          {/* ... Filter UI ... */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
                />
              </svg>
              Filter Work Sessions
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Job
              </label>
              <select
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedTask("");
                }}
                disabled={projectsLoading}
                className="form-select w-full disabled:bg-slate-100"
              >
                <option value="">All Jobs</option>
                {projectsLoading ? (
                  <option disabled>Loading jobs...</option>
                ) : projects.length > 0 ? (
                  projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.project_name}
                    </option>
                  ))
                ) : (
                  <option disabled>No jobs available</option>
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Project
              </label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                disabled={!selectedProject || tasksLoading || projectsLoading}
                className="form-select w-full disabled:bg-slate-100"
              >
                <option value="">
                  {!selectedProject ? "Select job first" : "All Projects"}
                </option>
                {tasksLoading ? (
                  <option disabled>Loading projects...</option>
                ) : (
                  tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.task_title}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Date Range
              </label>
              <Flatpickr
                value={dateRange}
                onChange={setDateRange}
                className="form-input w-full"
                options={{ mode: "range", dateFormat: "M j, Y" }}
                placeholder="Select date range"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-transparent">
                Actions
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline-secondary w-full"
                >
                  Reset
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="btn btn-dark w-full"
                >
                  {loading ? "Loading..." : "Search"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
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
                      <div className="flex items-center flex-wrap gap-2">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {formatTime(session.start_time)} –{" "}
                          {formatTime(session.end_time)}
                          <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                            ({session.total_time})
                          </span>
                        </p>
                        {session.type === "Manual" && (
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
                            <div
                              key={ss.id}
                              className="text-center group relative"
                            >
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
                              <button
                                onClick={() =>
                                  handleDeleteScreenshot(session.id, ss.id)
                                }
                                title="Delete Screenshot"
                                className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                              >
                                <TrashIcon />
                              </button>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                {formatTime(ss.created_at.split("T")[1])}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                          No screenshots were taken for this session.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            ) : !isInitialLoad ? ( // Show "no results" only after the first search
            <div className="text-center py-16">
              <p className="text-slate-500">
                No work sessions found for the selected criteria.
              </p>
            </div>
          ) : null} 
          {paginationInfo && paginationInfo.lastPage > 1 && (
             <div className="flex flex-wrap justify-center items-center mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 gap-4">
              <button
                onClick={handlePrevPage}
                disabled={paginationInfo.currentPage === 1}
                className="btn btn-dark"
              >
                Prev
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
              </span>
              <button
                onClick={handleNextPage}
                disabled={
                  paginationInfo.currentPage === paginationInfo.lastPage
                }
                className="btn btn-dark"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSession;