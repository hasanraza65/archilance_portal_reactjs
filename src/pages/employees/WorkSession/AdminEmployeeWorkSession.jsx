import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import Card from "@/components/ui/Card";
import axios from "axios";

// --- Add Manual Time Modal Component ---
const AddManualTimeModal = ({
  isOpen,
  onClose,
  projects,
  employeeId,
  token,
  onSuccess,
  apiPrefix,
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
  const API_URL = `${API_BASE}/api/${apiPrefix}/other-manual-time`;

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
          `${API_BASE}/api/${apiPrefix}/project/${selectedProject}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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
  }, [selectedProject, token, API_BASE, apiPrefix]);

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
      toast.error("Please fill all fields.");
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
      user_id: employeeId,
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
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border dark:border-slate-700 transform transition-all">
        <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-slate-200">
          Add Manual Time
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Job*</label>
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
                      ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Task*</label>
              <select
                value={selectedTask}
                onChange={(e) => setSelectedTask(e.target.value)}
                disabled={!selectedProject || isTasksLoading}
                className="form-select w-full disabled:bg-slate-100 dark:disabled:bg-slate-700"
              >
                <option value="" disabled>
                  Select a task
                </option>
                {isTasksLoading ? (
                  <option disabled>Loading tasks...</option>
                ) : (
                  renderTaskOptions(tasks)
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date*</label>
              <Flatpickr
                className="form-input w-full"
                value={startDate}
                options={{ dateFormat: "Y-m-d" }}
                onChange={([date]) => setStartDate(date)}
              />
            </div>
            <div>
              <label className="form-label">Start Time*</label>
              <Flatpickr
                className="form-input w-full"
                value={startTime}
                options={{
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: "H:i",
                  time_24hr: true,
                }}
                onChange={([date]) =>
                  setStartTime(
                    `${String(date.getHours()).padStart(2, "0")}:${String(
                      date.getMinutes()
                    ).padStart(2, "0")}`
                  )
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="form-label">End Date*</label>
              <Flatpickr
                className="form-input w-full"
                value={endDate}
                options={{ dateFormat: "Y-m-d" }}
                onChange={([date]) => setEndDate(date)}
              />
            </div>
            <div>
              <label className="form-label">End Time*</label>
              <Flatpickr
                className="form-input w-full"
                value={endTime}
                options={{
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: "H:i",
                  time_24hr: true,
                }}
                onChange={([date]) =>
                  setEndTime(
                    `${String(date.getHours()).padStart(2, "0")}:${String(
                      date.getMinutes()
                    ).padStart(2, "0")}`
                  )
                }
              />
            </div>
          </div>
          <div>
            <label className="form-label">Memo / Reason*</label>
            <textarea
              rows="3"
              className="form-textarea"
              placeholder="What did you work on?"
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
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

// --- HELPER FUNCTIONS ---

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
const formatScreenshotTime = (isoString) => {
  if (!isoString) return "";
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
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

// --- MAIN COMPONENT ---
const AdminEmployeeWorkSession = () => {
  const { employeeId } = useParams();
  const { token, logout, isAuthenticated, user } = useAuth();

  const [employeeName, setEmployeeName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [dateRange, setDateRange] = useState(getTodayDateRange());
  const [overallTotalTime, setOverallTotalTime] = useState("0h 0m");
  const [manualTotalTime, setManualTotalTime] = useState("0h 0m");
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("Today");
  const presetDropdownRef = useRef(null);
  const [isIdleTimeModalOpen, setIsIdleTimeModalOpen] = useState(false);
  const [selectedSessionIdleTimes, setSelectedSessionIdleTimes] = useState([]);
  const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);

  const [allTasks, setAllTasks] = useState([]);
  const [taskFilters, setTaskFilters] = useState([]);

  const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL;

  const getApiPrefix = () => {
    const role = user?.role?.toLowerCase();
    if (role === "admin") {
      return "admin";
    }
    const employeeRoles = ["employee", "manager", "supervisor", "executive", "outsource"];
    if (employeeRoles.includes(role)) {
      return "employee";
    }
    return "admin";
  };

  const endpointPrefix = getApiPrefix();
  const API_BASE_URL = `${API_BASE}/api/${endpointPrefix}`;
  const workSessionPath = ["manager", "supervisor", "executive", "outsource", "employee"].includes(user?.role)
    ? "/other-work-session"
    : "/work-session";

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
    if (!isAuthenticated || !employeeId || !user) return;
    const fetchEmployeeDetails = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employee-user/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not fetch employee details.");
        const data = await res.json();
        setEmployeeName(data.name || "Employee");
      } catch (error) {
        toast.error(error.message);
        setEmployeeName("Unknown Employee");
      }
    };
    fetchEmployeeDetails();
  }, [isAuthenticated, token, employeeId, API_BASE_URL, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not fetch projects.");
        const data = await res.json();
        if (typeof data === "object" && data !== null && !Array.isArray(data)) {
          setProjects(data);
        } else {
          setProjects({ "All Projects": Array.isArray(data) ? data : [] });
        }
      } catch (error) {
        toast.error(error.message);
        setProjects({});
      }
    };
    fetchProjects();
  }, [isAuthenticated, token, API_BASE_URL, user]);

  useEffect(() => {
    if (!selectedProject || !user) {
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
            `Could not fetch tasks for project ID ${selectedProject}.`
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
  }, [selectedProject, token, API_BASE_URL, user]);

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
    if (!employeeId || !token || !user) return;
    setLoading(true);
    window.scrollTo(0, 0);

    const finalTaskId =
      taskFilters.map((f) => f.selected).filter(Boolean).pop() || "";

    const params = new URLSearchParams({
      page: currentPage.toString(),
      employee_id: employeeId,
    });
    if (selectedProject) params.append("project_id", selectedProject);
    if (finalTaskId) params.append("task_id", finalTaskId);
    if (dateRange && dateRange[0])
      params.append("start_date", formatDateForAPI(dateRange[0]));
    if (dateRange && dateRange.length > 1 && dateRange[1])
      params.append("end_date", formatDateForAPI(dateRange[1]));

    try {
      const response = await fetch(
        `${API_BASE_URL}${workSessionPath}?${params.toString()}`,
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
      const sessionsData = result.data;
      const fetchedSessions = Array.isArray(sessionsData)
        ? sessionsData.slice().reverse()
        : [];
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
      setSessions([]);
      setOverallTotalTime("0h 0m");
      setManualTotalTime("0h 0m");
    } finally {
      setLoading(false);
    }
  }, [
    employeeId,
    currentPage,
    selectedProject,
    dateRange,
    token,
    logout,
    API_BASE_URL,
    workSessionPath,
    user,
    taskFilters,
  ]);

  useEffect(() => {
    if (isAuthenticated && user) fetchWorkSessions();
    else if (!isAuthenticated) setLoading(false);
  }, [fetchWorkSessions, isAuthenticated, user]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
    else if (isAuthenticated && user) fetchWorkSessions();
  }, [dateRange, selectedProject, isAuthenticated, user]);

  const handleResetFilters = () => {
    setSelectedProject("");
    setAllTasks([]);
    setTaskFilters([]);
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

  const handleDeleteIdleTime = (idleTimeId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to delete this idle time entry?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const adminApiBaseUrl = `${API_BASE}/api/admin`;
          const url = `${adminApiBaseUrl}/delete-idle-time?idle_time_id=${idleTimeId}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const errorData = await res
              .json()
              .catch(() => ({ message: "Failed to delete idle time." }));
            throw new Error(errorData.message);
          }
          Swal.fire(
            "Deleted!",
            "The idle time entry has been deleted.",
            "success"
          );
          setSelectedSessionIdleTimes((currentIdleTimes) => {
            const updatedIdleTimes = currentIdleTimes.filter(
              (idle) => idle.id !== idleTimeId
            );
            if (updatedIdleTimes.length === 0) {
              setIsIdleTimeModalOpen(false);
            }
            return updatedIdleTimes;
          });
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

  const handleShowIdleTime = (idleTimes) => {
    setSelectedSessionIdleTimes(idleTimes);
    setIsIdleTimeModalOpen(true);
  };

  const calculateIdleDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = (end.getTime() - start.getTime()) / 1000;
    const minutes = Math.floor(diff / 60);
    const seconds = Math.floor(diff % 60);
    return `${minutes}m ${seconds}s`;
  };

  if (!isAuthenticated || !user)
    return (
      <div className="p-8 text-center">
        <p>Loading user data or please log in...</p>
      </div>
    );

  const taskLabels = ["Task", "Sub-Task", "Sub-Sub-Task"];

  return (
    <Card>
      <AddManualTimeModal
        isOpen={isManualTimeModalOpen}
        onClose={() => setIsManualTimeModalOpen(false)}
        projects={projects}
        employeeId={employeeId}
        token={token}
        onSuccess={fetchWorkSessions}
        apiPrefix={endpointPrefix}
      />
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
                  Manual:{" "}
                  <span className="font-semibold text-sky-700 dark:text-sky-400">
                    ({manualTotalTime})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualTimeModalOpen(true)}
            className="btn btn-sm btn-dark whitespace-nowrap"
          >
            Add Manual Time
          </button>
          <Link
            to="/employees"
            className="btn btn-sm btn-outline-dark whitespace-nowrap"
          >
            ← Back to Employee List
          </Link>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-8 border border-slate-200 dark:border-slate-700">
        {/* --- MODIFICATION: Grid changed to lg:grid-cols-4 --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col justify-end">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Job
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setTaskFilters([]);
                setAllTasks([]);
              }}
              className="form-select w-full"
            >
              <option value="">All Jobs</option>
              {Object.entries(projects).map(([status, projectList]) => (
                <optgroup key={status} label={status}>
                  {Array.isArray(projectList) &&
                    projectList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          
          {taskFilters.map((filter, index) => (
            <div key={index} className="flex flex-col justify-end">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                {taskLabels[index] || `Level ${index + 1} Task`}
              </label>
              <select
                value={filter.selected}
                onChange={(e) => handleTaskChange(index, e.target.value)}
                disabled={
                  tasksLoading ||
                  !selectedProject ||
                  (index > 0 && !taskFilters[index - 1]?.selected)
                }
                className="form-select w-full disabled:bg-slate-100"
              >
                <option value="">{`All ${taskLabels[index] || 'Tasks'}`}</option>
                {filter.options.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.task_title}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* --- MODIFICATION: Date section restored and col-span adjusted for 4-column grid --- */}
          <div className="flex flex-col justify-end lg:col-span-2">
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

              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {session.idle_times && session.idle_times.length > 0 && (
                        <button
                          onClick={() => handleShowIdleTime(session.idle_times)}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 rounded-full text-xs font-medium"
                        >
                          Show Idle Time
                        </button>
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

                  {(user?.role === "admin" ||
                    user?.employee_type === "Executive") && (
                    <div className="mt-4">
                      {Array.isArray(session.screenshots) &&
                      session.screenshots.length > 0 ? (
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
                                {formatScreenshotTime(ss.created_at)}
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
                  )}
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

      {isIdleTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(15,23,42,0.8)] backdrop-blur-[2px]">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border dark:border-slate-700">
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
                    <th scope="col" className="px-6 py-3 text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSessionIdleTimes.length > 0 ? (
                    selectedSessionIdleTimes.map((idle) => (
                      <tr
                        key={idle.id}
                        className="bg-white border-b dark:bg-slate-800 dark:border-slate-700"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {idle.start_time
                            ? formatScreenshotTime(idle.start_time)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {idle.end_time
                            ? formatScreenshotTime(idle.end_time)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                          {idle.start_time && idle.end_time
                            ? calculateIdleDuration(
                                idle.start_time,
                                idle.end_time
                              )
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteIdleTime(idle.id)}
                            className="text-slate-400 hover:text-red-500"
                            title="Delete Idle Time"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No idle time entries for this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsIdleTimeModalOpen(false)}
                className="btn bg-slate-800 hover:bg-slate-900 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default AdminEmployeeWorkSession;