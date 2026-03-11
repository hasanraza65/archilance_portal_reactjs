  import React, { useState, useEffect, useCallback } from "react";
  import { toast } from "react-toastify";
  import { useAuth } from "@/context/AuthContext";
  import Swal from "sweetalert2";
  import Flatpickr from "react-flatpickr";
  import "flatpickr/dist/themes/light.css";
  import axios from "axios";

  // --- START: HELPER FUNCTIONS ---

  const renderTaskOptions = (tasks, parentId = null, depth = 0) => {
    const prefix = depth > 0 ? "↳ ".repeat(depth) : "";
    return tasks
      .filter((task) => task.parent_task_id === parentId)
      .flatMap((task) => [
        <option key={task.id} value={task.id}>
          {prefix + task.task_title}
        </option>,
        ...renderTaskOptions(tasks, task.id, depth + 1),
      ]);
  };
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
    const parts = timeStr.split(":");
    if (parts.length < 2) return "";
    const h = parts[0];
    const m = parts[1];
    const d = new Date(0, 0, 0, h, m);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  const formatDateTime = (isoString) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date-time:", isoString, error);
      return "Invalid Time";
    }
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
  const calculateIdleDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = Math.abs(end - start) / 1000;
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    return `${minutes}m ${seconds}s`;
  };
  // --- END: HELPER FUNCTIONS ---

  // --- START: MODAL COMPONENT ---
  const AddManualTimeModal = ({
    isOpen,
    onClose,
    projects,
    token,
    onSuccess,
  }) => {
    const [selectedProject, setSelectedProject] = useState("");
    const [tasks, setTasks] = useState([]);
    const [isTasksLoading, setIsTasksLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState(new Date());
    const [endTime, setEndTime] = useState("");
    const [memoContent, setMemoContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL;
    const API_URL = `${API_BASE}/api/employee/manual-time`;

    useEffect(() => {
      if (!selectedProject || !token) {
        setTasks([]);
        setSelectedTask("");
        return;
      }
      const fetchTasksForProject = async () => {
        setIsTasksLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE}/api/employee/project/${selectedProject}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setTasks(res.data?.all_tasks || []);
        } catch (error) {
          toast.error("Could not fetch tasks for the selected project.");
          setTasks([]);
        } finally {
          setIsTasksLoading(false);
        }
      };
      fetchTasksForProject();
    }, [selectedProject, token, API_BASE]);

    const resetForm = () => {
      setSelectedProject("");
      setSelectedTask("");
      setTasks([]);
      setStartDate(new Date());
      setStartTime("");
      setEndDate(new Date());
      setEndTime("");
      setMemoContent("");
    };
    const handleClose = () => {
      resetForm();
      onClose();
    };
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (
        !selectedTask ||
        !startDate ||
        !startTime ||
        !endDate ||
        !endTime ||
        !memoContent.trim()
      ) {
        toast.error("Please fill all required fields.");
        return;
      }
      const startDateTime = new Date(startDate);
      const [startH, startM] = startTime.split(":");
      startDateTime.setHours(startH, startM);
      const endDateTime = new Date(endDate);
      const [endH, endM] = endTime.split(":");
      endDateTime.setHours(endH, endM);
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time.");
        return;
      }
      setIsSubmitting(true);
      const payload = {
        task_id: selectedTask,
        start_date: formatDateForAPI(startDate),
        start_time: startTime,
        end_date: formatDateForAPI(endDate),
        end_time: endTime,
        memo_content: memoContent.trim(),
      };
      try {
        await axios.post(API_URL, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        toast.success("Manual time added successfully!");
        onSuccess();
        handleClose();
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || "Failed to add manual time.";
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.8)] backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border dark:border-slate-700">
          <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Add Manual Time
            </h3>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1">Job*</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="form-select w-full"
                >
                  <option value="" disabled>
                    Select a job
                  </option>
                  {Object.entries(projects).map(([status, projectList]) => (
                    <optgroup key={status} label={status}>
                      {Array.isArray(projectList) &&
                        projectList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.project_name}
                          </option>
                        ))}{" "}
                    </optgroup>
                  ))}
                </select>
              </div>
              {selectedProject && (
                <div>
                  <label className="form-label mb-1">Task*</label>
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    disabled={!selectedProject || isTasksLoading}
                    className="form-select w-full"
                  >
                    <option value="" disabled>
                      Select a Task
                    </option>
                    {isTasksLoading ? (
                      <option disabled>Loading...</option>
                    ) : (
                      renderTaskOptions(tasks)
                    )}
                  </select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1">Start Date*</label>
                <Flatpickr
                  className="form-input w-full"
                  value={startDate}
                  options={{ dateFormat: "Y-m-d" }}
                  onChange={([date]) => setStartDate(date)}
                />
              </div>
              <div>
                <label className="form-label mb-1">Start Time*</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input w-full"
                  step="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label mb-1">End Date*</label>
                <Flatpickr
                  className="form-input w-full"
                  value={endDate}
                  options={{ dateFormat: "Y-m-d" }}
                  onChange={([date]) => setEndDate(date)}
                />
              </div>
              <div>
                <label className="form-label mb-1">End Time*</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input w-full"
                  step="1"
                />
              </div>
            </div>
            <div>
              <label className="form-label mb-1">Memo / Reason*</label>
              <textarea
                rows="3"
                className="form-textarea"
                placeholder="What did you work on?"
                value={memoContent}
                onChange={(e) => setMemoContent(e.target.value)}
              ></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-5">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-light"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Time"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // --- END: MODAL COMPONENT ---

  // --- START: MAIN WORK SESSION COMPONENT ---
  const WorkSession = () => {
    const { token, isAuthenticated, user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState({});
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [allTasks, setAllTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [taskFilters, setTaskFilters] = useState([]); // Start with an empty array
    const [selectedProject, setSelectedProject] = useState("");
    const [dateRange, setDateRange] = useState(getTodayDateRange());
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [overallTotalTime, setOverallTotalTime] = useState("0h 0m");
    const [manualTotalTime, setManualTotalTime] = useState("0h 0m");
    const [isIdleTimeModalOpen, setIsIdleTimeModalOpen] = useState(false);
    const [selectedSessionIdleTimes, setSelectedSessionIdleTimes] = useState([]);
    const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);

    const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/employee`;
    const STORAGE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage`;

    useEffect(() => {
      if (isIdleTimeModalOpen || isManualTimeModalOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isIdleTimeModalOpen, isManualTimeModalOpen]);

    useEffect(() => {
      if (!isAuthenticated || !user) return;
      const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
          let url = `${API_BASE_URL}/project`;
          if (user.role === "manager") {
            url += "?assigned_me=1";
          }
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok)
            throw new Error(`Could not fetch jobs. Status: ${res.status}`);
          const data = await res.json();
          if (typeof data === "object" && data !== null && !Array.isArray(data)) {
            setProjects(data);
          } else {
            setProjects({ "All Projects": Array.isArray(data) ? data : [] });
          }
        } catch (error) {
          toast.error(error.message);
          setProjects({});
        } finally {
          setProjectsLoading(false);
        }
      };
      fetchProjects();
    }, [isAuthenticated, token, API_BASE_URL, user]);

    useEffect(() => {
      if (!selectedProject) {
        setAllTasks([]);
        setTaskFilters([]);
        return;
      }
      const fetchTasksForProject = async () => {
        setTasksLoading(true);
        setAllTasks([]);
        try {
          const res = await fetch(`${API_BASE_URL}/project/${selectedProject}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok)
            throw new Error(
              `Could not fetch details for project ID ${selectedProject}.`
            );
          const projectDetails = await res.json();
          const tasksFromServer = projectDetails.all_tasks || [];
          setAllTasks(tasksFromServer);
          const parentTasks = tasksFromServer.filter(
            (t) => t.parent_task_id === null
          );
          setTaskFilters([{ selected: "", options: parentTasks }]);
        } catch (error) {
          toast.error(error.message);
          setTaskFilters([]);
        } finally {
          setTasksLoading(false);
        }
      };
      fetchTasksForProject();
    }, [selectedProject, token, API_BASE_URL]);

    const handleTaskChange = (level, value) => {
      const newTaskFilters = taskFilters.slice(0, level + 1);
      newTaskFilters[level] = { ...newTaskFilters[level], selected: value };
      if (!value) {
        setTaskFilters(newTaskFilters);
        return;
      }
      const children = allTasks.filter(
        (task) => task.parent_task_id === parseInt(value)
      );
      if (children.length > 0) {
        newTaskFilters.push({ selected: "", options: children });
      }
      setTaskFilters(newTaskFilters);
    };

    const fetchWorkSessions = useCallback(async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      setLoading(true);
      window.scrollTo(0, 0);
      const finalTaskId =
        taskFilters
          .map((f) => f.selected)
          .filter(Boolean)
          .pop() || "";
      const params = new URLSearchParams({ page: currentPage.toString() });
      if (selectedProject) params.append("project_id", selectedProject);
      if (finalTaskId) params.append("task_id", finalTaskId);
      if (dateRange && dateRange[0])
        params.append("start_date", formatDateForAPI(dateRange[0]));
      if (dateRange && dateRange.length > 1 && dateRange[1])
        params.append("end_date", formatDateForAPI(dateRange[1]));
      try {
        const response = await fetch(
          `${API_BASE_URL}/work-session?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || `Request failed`);
        const fetchedSessions = result.data?.reverse() || [];
        setSessions(fetchedSessions);
        setOverallTotalTime(result.overall_total_time || "0h 0m");
        const totalManualSeconds = fetchedSessions
          .filter((session) => session.type === "Manual")
          .reduce(
            (acc, session) =>
              acc + Math.abs(session.raw_calculation?.net_seconds || 0),
            0
          );
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
        setIsInitialLoad(false);
      }
    }, [
      currentPage,
      isAuthenticated,
      token,
      API_BASE_URL,
      dateRange,
      selectedProject,
      taskFilters,
    ]);

    useEffect(() => {
      fetchWorkSessions();
    }, [fetchTrigger, currentPage, fetchWorkSessions]);

    const handleSearch = () => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        setFetchTrigger((t) => t + 1);
      }
    };
    const handleResetFilters = () => {
      setSelectedProject("");
      setAllTasks([]);
      setTaskFilters([]);
      setDateRange(getTodayDateRange());
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        setFetchTrigger((t) => t + 1);
      }
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
            setFetchTrigger((t) => t + 1);
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
            const res = await fetch(
              `${API_BASE_URL}/screenshot/${screenshotId}`,
              { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(
                errorData.message || "Failed to delete the screenshot."
              );
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
    const handleShowIdleTime = (idleTimes) => {
      setSelectedSessionIdleTimes(idleTimes);
      setIsIdleTimeModalOpen(true);
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

    const taskLabels = [
      "Task",
      "Sub-Task",
      "Sub-Sub-Task",
      "Level 4 Task",
      "Level 5 Task",
    ];

    // --- [NEW LOGIC START] ---
    // Define how many levels of task dropdowns to show by default
    const MAX_VISIBLE_TASK_LEVELS = 2; // Show "Task" and "Sub-Task"

    // Create a new array for rendering. It will be padded with empty
    // filter objects to ensure MAX_VISIBLE_TASK_LEVELS are always shown.
    const renderableFilters = [...taskFilters];
    // If no project is selected, we still need placeholders
    if (!selectedProject && renderableFilters.length === 0) {
      renderableFilters.push({ selected: "", options: [] });
    }
    while (renderableFilters.length < MAX_VISIBLE_TASK_LEVELS) {
      renderableFilters.push({ selected: "", options: [] });
    }
    // --- [NEW LOGIC END] ---

    return (
      <div className="bg-white dark:bg-slate-900 min-h-screen">
        <AddManualTimeModal
          isOpen={isManualTimeModalOpen}
          onClose={() => setIsManualTimeModalOpen(false)}
          projects={projects}
          token={token}
          onSuccess={handleSearch}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                Work Diary
              </h1>
              {(!isInitialLoad || sessions.length > 0) && (
                <div className="flex items-baseline gap-4 mt-1">
                  <div className="text-slate-600 dark:text-slate-300 font-medium">
                    Total Time:{" "}
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {overallTotalTime}
                    </span>
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
            </div>
            <button
              onClick={() => setIsManualTimeModalOpen(true)}
              className="btn btn-dark whitespace-nowrap"
            >
              Add Manual Time
            </button>
          </div>

          {/* --- UI UPDATED START --- */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-8 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col justify-end">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Job
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  disabled={projectsLoading}
                  className="form-select w-full"
                >
                  <option value="">All Jobs</option>
                  {projectsLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    Object.entries(projects).map(([status, projectList]) => (
                      <optgroup key={status} label={status}>
                        {Array.isArray(projectList) &&
                          projectList.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.project_name}
                            </option>
                          ))}{" "}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              {/* [MODIFIED] We now map over the padded `renderableFilters` array */}
              {renderableFilters.map((filter, index) => (
                <div key={index} className="flex flex-col justify-end">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {taskLabels[index] || `Sub-Task Level ${index + 1}`}
                  </label>
                  <select
                    value={filter.selected}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    // [MODIFIED] New disabling logic
                    disabled={
                      tasksLoading ||
                      (index === 0 && !selectedProject) || // First dropdown needs a project
                      (index > 0 && !taskFilters[index - 1]?.selected) // Subsequent dropdowns need the previous one to be selected
                    }
                    className="form-select w-full"
                  >
                    <option value="">{`All ${
                      taskLabels[index] || `Tasks`
                    }`}</option>

                    {/* [MODIFIED] New placeholder logic */}
                    {index === 0 && !selectedProject && (
                      <option disabled>Select a job first</option>
                    )}
                    {index > 0 && !taskFilters[index - 1]?.selected && (
                      <option disabled>Select parent task first</option>
                    )}

                    {tasksLoading && selectedProject && index === 0 && (
                      <option disabled>Loading...</option>
                    )}

                    {filter.options.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.task_title}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* [MODIFIED] Adjusted column span to accommodate the new always-visible dropdowns */}
              <div className="flex flex-col justify-end lg:col-span-2">
                <div className="flex flex-col lg:flex-row lg:items-end gap-2">
                  <div className="flex-grow">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Date Range
                    </label>
                    <Flatpickr
                      value={dateRange}
                      onChange={setDateRange}
                      className="form-input w-full"
                      options={{ mode: "range", dateFormat: "M j, Y" }}
                    />
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button
                      onClick={handleResetFilters}
                      className="btn btn-outline-secondary h-10 w-full lg:w-auto"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSearch}
                      disabled={loading}
                      className="btn btn-dark h-10 w-full lg:w-auto"
                    >
                      {loading && !isInitialLoad ? "..." : "Search"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* --- UI UPDATED END --- */}

          <div className="border-t border-slate-200 dark:border-slate-700">
            {loading && isInitialLoad ? (
              <div className="text-center py-20">
                <p>Loading diary entries...</p>
              </div>
            ) : sessions.length > 0 ? (
              <div className="space-y-8">
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="relative group flex items-start space-x-4 pt-8"
                  >
                    <div className="flex-shrink-0 flex flex-col items-center h-full">
                      <div className="w-3 h-3 bg-green-500 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
                      {index < sessions.length - 1 && (
                        <div
                          className="w-px flex-grow bg-slate-200 dark:bg-slate-700"
                          style={{ minHeight: "100%" }}
                        ></div>
                      )}
                    </div>
                    <div
                      className={`flex-1 ${
                        index < sessions.length - 1
                          ? "pb-8 border-b border-slate-200 dark:border-slate-700"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center flex-wrap gap-x-4 gap-y-2">
                          <p className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatTime(session.start_time)} –{" "}
                            {formatTime(session.end_time)}
                            <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                              ({session.total_time})
                            </span>
                          </p>
                          <div className="flex items-center gap-2">
                            {session.type === "Manual" && (
                              <span className="px-2.5 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 rounded-full text-xs font-semibold">
                                Manual
                              </span>
                            )}
                            {session.idle_times &&
                              session.idle_times.length > 0 && (
                                <button
                                  onClick={() =>
                                    handleShowIdleTime(session.idle_times)
                                  }
                                  className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full text-xs font-semibold hover:bg-amber-200"
                                >
                                  Idle Time
                                </button>
                              )}
                          </div>
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
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                          {session.memo_content}
                        </p>
                      )}
                      <div className="mt-4">
                        {session.screenshots.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {session.screenshots.map((ss) => {
                              const screenshotPath = user?.role === "admin" ? ss.screenshot_file : ss.emp_screenshot_file;
                              return (
                                <div
                                  key={ss.id}
                                  className="text-center group/ss relative"
                                >
                                  <a
                                    href={`${STORAGE_URL}/${screenshotPath}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={`${STORAGE_URL}/${screenshotPath}`}
                                      alt={`Screenshot`}
                                      className="w-full rounded-lg border-2 border-transparent group-hover/ss:border-blue-500 transition"
                                    />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteScreenshot(session.id, ss.id)
                                    }
                                    title="Delete Screenshot"
                                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/80 text-white rounded-full opacity-0 group-hover/ss:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                                  >
                                    <TrashIcon />
                                  </button>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                    {formatDateTime(ss.created_at)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          session.type !== "Manual" && (
                            <p className="text-sm text-slate-400 italic">
                              No screenshots were taken for this session.
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              !isInitialLoad && (
                <div className="text-center py-20">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      vectorEffect="non-scaling-stroke"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-200">
                    No work sessions
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No work sessions found for the selected criteria.
                  </p>
                </div>
              )
            )}
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
        {isIdleTimeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-lg border dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">
                Idle Time Details
              </h3>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">
                        Start Time
                      </th>
                      <th scope="col" className="px-6 py-3">
                        End Time
                      </th>
                      <th scope="col" className="px-6 py-3">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSessionIdleTimes.map((idle) => (
                      <tr
                        key={idle.id}
                        className="bg-white border-b dark:bg-slate-800 dark:border-slate-700"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {formatDateTime(idle.start_time)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {formatDateTime(idle.end_time)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {calculateIdleDuration(idle.start_time, idle.end_time)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsIdleTimeModalOpen(false)}
                  className="btn btn-dark"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default WorkSession;
