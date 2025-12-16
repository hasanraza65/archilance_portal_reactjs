import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import Card from "@/components/ui/Card";
import axios from "axios";
// Ensure correct import path
import EmployeeWorkStats from "./EmployeeWorkStats";

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
const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- FIX: Robust Idle Time Calculation ---
const calculateIdleDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "N/A";

  const parseToDate = (timeStr) => {
    let d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01 ${timeStr}`);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const start = parseToDate(startTime);
  const end = parseToDate(endTime);

  if (!start || !end) return "N/A";

  let diff = (end.getTime() - start.getTime()) / 1000;
  if (diff < 0) diff += 86400;

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.floor(diff % 60);

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

// --- Helper to get raw seconds for Idle Time ---
const getIdleSeconds = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  
  const parseToDate = (timeStr) => {
    let d = new Date(timeStr);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01 ${timeStr}`);
    if (!isNaN(d.getTime())) return d;
    d = new Date(`1970-01-01T${timeStr}`);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const start = parseToDate(startTime);
  const end = parseToDate(endTime);

  if (!start || !end) return 0;

  let diff = (end.getTime() - start.getTime()) / 1000;
  if (diff < 0) diff += 86400; // Handle midnight crossover
  return diff;
};

// --- Helper to parse "2h 29m" or "29m" or "29s" to seconds ---
const parseDurationString = (str) => {
  if (!str) return 0;
  let totalSeconds = 0;
  
  // Match hours
  const hMatch = str.match(/(\d+)h/);
  if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
  
  // Match minutes
  const mMatch = str.match(/(\d+)m/);
  if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
  
  // Match seconds (if backend sends seconds like 30s)
  const sMatch = str.match(/(\d+)s/);
  if (sMatch) totalSeconds += parseInt(sMatch[1]);
  
  return totalSeconds;
};


// --- Manual Time Modal ---
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
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks(res.data?.all_tasks || []);
      } catch (error) {
        toast.error("Could not fetch tasks.");
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
      toast.success("Manual time added!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.8)] backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border dark:border-slate-700">
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
                {Object.entries(projects).map(([status, pList]) => (
                  <optgroup key={status} label={status}>
                    {Array.isArray(pList) &&
                      pList.map((p) => (
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
                disabled={!selectedProject}
                className="form-select w-full disabled:bg-slate-100"
              >
                <option value="" disabled>
                  Select a task
                </option>
                {isTasksLoading ? (
                  <option disabled>Loading...</option>
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
                onChange={([d]) => setStartDate(d)}
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
                onChange={([d]) =>
                  setStartTime(
                    `${String(d.getHours()).padStart(2, "0")}:${String(
                      d.getMinutes()
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
                onChange={([d]) => setEndDate(d)}
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
                onChange={([d]) =>
                  setEndTime(
                    `${String(d.getHours()).padStart(2, "0")}:${String(
                      d.getMinutes()
                    ).padStart(2, "0")}`
                  )
                }
              />
            </div>
          </div>
          <div>
            <label className="form-label">Memo*</label>
            <textarea
              rows="3"
              className="form-textarea"
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
            ></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-light">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-dark"
              disabled={isSubmitting}
            >
              Save Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const AdminEmployeeWorkSession = () => {
  const { employeeId } = useParams();
  const { token, logout, isAuthenticated, user } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [windowsActivity, setWindowsActivity] = useState([]); // Store root activity here
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState({});
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [dateRange, setDateRange] = useState(getTodayDateRange());
  const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
  const [activePreset, setActivePreset] = useState("Today");
  const presetDropdownRef = useRef(null);
  const [isIdleTimeModalOpen, setIsIdleTimeModalOpen] = useState(false);
  const [selectedSessionIdleTimes, setSelectedSessionIdleTimes] = useState([]);
  const [isManualTimeModalOpen, setIsManualTimeModalOpen] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [taskFilters, setTaskFilters] = useState([]);

  // STATS STATES
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsWindowsActivity, setStatsWindowsActivity] = useState([]);


  // Store total Idle Seconds calculated from sessions
  const [totalIdleSeconds, setTotalIdleSeconds] = useState(0);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0);
  const [statsSessionsList, setStatsSessionsList] = useState([]);



  const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL;
  const getApiPrefix = () => {
    const role = user?.role?.toLowerCase();
    if (role === "admin") return "admin";
    if (
      ["employee", "manager", "supervisor", "executive", "outsource"].includes(
        role
      )
    )
      return "employee";
    return "admin";
  };
  const endpointPrefix = getApiPrefix();
  const API_BASE_URL = `${API_BASE}/api/${endpointPrefix}`;
  const workSessionPath = [
    "manager",
    "supervisor",
    "executive",
    "outsource",
    "employee",
  ].includes(user?.role)
    ? "/other-work-session"
    : "/work-session";
  const STORAGE_URL = `${API_BASE}/storage`;

  useEffect(() => {
    if (isIdleTimeModalOpen || isManualTimeModalOpen)
      document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isIdleTimeModalOpen, isManualTimeModalOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        presetDropdownRef.current &&
        !presetDropdownRef.current.contains(e.target)
      )
        setIsPresetDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Employee Details & Projects
  useEffect(() => {
    if (!isAuthenticated || !employeeId || !user) return;
    const fetchBaseData = async () => {
      try {
        const empRes = await fetch(
          `${API_BASE_URL}/employee-user/${employeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (empRes.ok) setEmployeeDetails(await empRes.json());
        const projRes = await fetch(`${API_BASE_URL}/project`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (projRes.ok) {
          const data = await projRes.json();
          setProjects(
            typeof data === "object" && data !== null && !Array.isArray(data)
              ? data
              : { "All Projects": Array.isArray(data) ? data : [] }
          );
        }
      } catch (e) {
        toast.error("Error fetching initial data");
      }
    };
    fetchBaseData();
  }, [isAuthenticated, token, employeeId]);

  // Fetch Tasks
  useEffect(() => {
    if (!selectedProject || !user) {
      setAllTasks([]);
      setTaskFilters([]);
      return;
    }
    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/project/${selectedProject}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const tasks = data.all_tasks || [];
          setAllTasks(tasks);
          setTaskFilters([
            {
              selected: "",
              options: tasks.filter((t) => t.parent_task_id === null),
            },
          ]);
        }
      } catch (e) {
        toast.error("Error fetching tasks");
      } finally {
        setTasksLoading(false);
      }
    };
    fetchTasks();
  }, [selectedProject]);

  const handleTaskChange = (level, value) => {
    const newFilters = taskFilters.slice(0, level + 1);
    newFilters[level] = { ...newFilters[level], selected: value };
    if (value) {
      const children = allTasks.filter(
        (t) => t.parent_task_id === parseInt(value)
      );
      if (children.length > 0)
        newFilters.push({ selected: "", options: children });
    }
    setTaskFilters(newFilters);
  };

  const fetchWorkSessions = useCallback(async () => {
    if (!employeeId || !token || !user) return;
    setLoading(true);
    setStatsLoading(true);

    const finalTaskId =
      taskFilters
        .map((f) => f.selected)
        .filter(Boolean)
        .pop() || "";
        
    // Base params for the PAGINATED list
    const params = new URLSearchParams({
      page: currentPage.toString(),
      employee_id: employeeId,
      per_page: "100", // Keep page size 100 for listing
    });
    if (selectedProject) params.append("project_id", selectedProject);
    if (finalTaskId) params.append("task_id", finalTaskId);
    if (dateRange[0])
      params.append("start_date", formatDateForAPI(dateRange[0]));
    if (dateRange[1]) params.append("end_date", formatDateForAPI(dateRange[1]));

    try {
      // 1. Fetch Paginated Data for the LIST
      const response = await fetch(
        `${API_BASE_URL}${workSessionPath}?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) {
        logout();
        return;
      }
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      const sessionsData = Array.isArray(result.data)
        ? result.data.slice().reverse()
        : [];
      
      setSessions(sessionsData);
      setPaginationInfo({
        currentPage: result.current_page,
        lastPage: result.last_page,
        total: result.total, 
      });

      // 2. Fetch ALL Data for STATS (if needed)
      // If we have more than 1 page, we MUST fetch everything to get correct totals.
      // If we only have 1 page, we can just use 'result' from above.
      let statsSessions = [];
      let statsActivity = [];

      if (result.last_page > 1) {
        // Fetch ALL for stats
        const allParams = new URLSearchParams({
          page: "1",
          employee_id: employeeId,
          per_page: "10000", // Fetch a large number to get ALL
        });
        if (selectedProject) allParams.append("project_id", selectedProject);
        if (finalTaskId) allParams.append("task_id", finalTaskId);
        if (dateRange[0])
          allParams.append("start_date", formatDateForAPI(dateRange[0]));
        if (dateRange[1]) allParams.append("end_date", formatDateForAPI(dateRange[1]));
        
        const allRes = await fetch(
          `${API_BASE_URL}${workSessionPath}?${allParams.toString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (allRes.ok) {
          const allResult = await allRes.json();
          statsSessions = Array.isArray(allResult.data) ? allResult.data : [];
          statsActivity = allResult.windows_activity || [];
        }
      } else {
        // Single page, reuse data
        statsSessions = sessionsData; // Already reversed? No, backend sends them. 
        // Note: result.data usually comes sorted desc or asc. 
        // For stats calculation, order doesn't matter.
        statsSessions = Array.isArray(result.data) ? result.data : [];
        statsActivity = result.windows_activity || [];
      }

      // 3. Calculate Stats
      let totalIdleSec = 0;
      let totalWorkSec = 0;

      // Use overall_total_time directly from backend response
      if (result.overall_total_time) {
        totalWorkSec = parseDurationString(result.overall_total_time);
      }

      statsSessions.forEach((session) => {
        // Only calculate Idle Time (Manual sum needed?)
        // Assuming we still need to calculate idle time manually if backend doesn't provide a total idle time.
        if (session.idle_times && Array.isArray(session.idle_times)) {
          session.idle_times.forEach((idle) => {
            totalIdleSec += getIdleSeconds(idle.start_time, idle.end_time);
          });
        }
      });
      
      setTotalIdleSeconds(totalIdleSec);
      setTotalWorkSeconds(totalWorkSec);
      setStatsWindowsActivity(statsActivity);


      // setWindowsActivity is used for the LIST? No, likely for the stats. 
      // The original code used 'windowsActivity' passed to EmployeeWorkStats.
      // So we should update 'windowsActivity' with the FULL list.
      setWindowsActivity(statsActivity); 

    } catch (err) {
      toast.error(err.message);
      setSessions([]);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [
    employeeId,
    currentPage,
    selectedProject,
    dateRange,
    token,
    user,
    taskFilters,
  ]);

  useEffect(() => {
    if (isAuthenticated && user) fetchWorkSessions();
  }, [fetchWorkSessions, isAuthenticated, user]);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${API_BASE_URL}/work-session/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          Swal.fire("Deleted!", "", "success");
          fetchWorkSessions();
        } catch (e) {
          Swal.fire("Error!", e.message, "error");
        }
      }
    });
  };

  const handleDeleteIdleTime = (id) => {
    Swal.fire({
      title: "Delete Idle Time?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(
            `${API_BASE}/api/admin/delete-idle-time?idle_time_id=${id}`,
            { method: "POST", headers: { Authorization: `Bearer ${token}` } }
          );
          if (!res.ok) throw new Error("Failed");
          Swal.fire("Deleted!", "", "success");
          setSelectedSessionIdleTimes((prev) => {
            const updated = prev.filter((i) => i.id !== id);
            if (updated.length === 0) setIsIdleTimeModalOpen(false);
            return updated;
          });
          fetchWorkSessions();
        } catch (e) {
          Swal.fire("Error!", e.message, "error");
        }
      }
    });
  };

  if (!isAuthenticated || !user)
    return (
      <div className="p-8 text-center">
        <p>Loading...</p>
      </div>
    );

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

      {/* 1. Header (User Info) */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm bg-slate-200">
          <img
            src={
              employeeDetails?.profile_pic
                ? `${STORAGE_URL}/${employeeDetails.profile_pic}`
                : "https://api.dicebear.com/7.x/avataaars/svg?seed=Archilance"
            }
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {employeeDetails?.name || "Employee"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {employeeDetails?.email}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setIsManualTimeModalOpen(true)}
            className="btn btn-sm btn-dark"
          >
            Add Manual Time
          </button>
          <Link to="/employees" className="btn btn-sm btn-outline-dark">
            ← Back
          </Link>
        </div>
      </div>

      {/* 2. FILTERS (Moved ABOVE Dashboard) */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-8 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">Job</label>
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
              {Object.entries(projects).map(([s, l]) => (
                <optgroup key={s} label={s}>
                  {Array.isArray(l) &&
                    l.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.project_name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
          {taskFilters.map((f, i) => (
            <div key={i}>
              <label className="text-sm font-medium">Level {i + 1} Task</label>
              <select
                value={f.selected}
                onChange={(e) => handleTaskChange(i, e.target.value)}
                disabled={
                  tasksLoading ||
                  !selectedProject ||
                  (i > 0 && !taskFilters[i - 1]?.selected)
                }
                className="form-select w-full disabled:bg-slate-100"
              >
                <option value="">All</option>
                {f.options.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.task_title}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="lg:col-span-2 flex flex-col lg:flex-row gap-2 items-end">
            <div className="w-full relative" ref={presetDropdownRef}>
              <label className="text-sm font-medium">Period</label>
              <button
                type="button"
                onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                className="form-input w-full flex justify-between items-center"
              >
                <span>{activePreset}</span>
                <ChevronDownIcon />
              </button>
              {isPresetDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-slate-800 border rounded shadow-lg z-10">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => {
                        setDateRange(p.func());
                        setActivePreset(p.label);
                        setIsPresetDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full">
              <label className="text-sm font-medium">Custom Range</label>
              <Flatpickr
                className="form-input w-full"
                value={dateRange}
                options={{ mode: "range", dateFormat: "M j, Y" }}
                onChange={(d) => {
                  if (d.length === 2) {
                    setDateRange(d);
                    setActivePreset("Custom");
                  }
                }}
              />
            </div>
            <button
              onClick={() => {
                setSelectedProject("");
                setTaskFilters([]);
                setDateRange(getTodayDateRange());
                setActivePreset("Today");
              }}
              className="btn bg-slate-800 text-white h-10"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD STATS (Below Filters) */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 font-sans">
        {statsLoading ? (
           <div className="h-40 flex items-center justify-center text-slate-500">Calculating stats...</div>
        ) : (
          <EmployeeWorkStats
            sessions={statsSessionsList} // Pass the FULL list for stats
            rootActivityList={statsWindowsActivity} // Pass the FULL activity list
            totalIdleSeconds={totalIdleSeconds} // Values calculated from FULL list
            totalWorkSeconds={totalWorkSeconds}
          />
        )}

      </div>

      {/* 4. SESSIONS LIST */}
      <div className="pt-6">
        {loading ? (
          <div className="text-center py-16">
            <p>Loading...</p>
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
                        {formatTime(session.end_time)}{" "}
                        <span className="ml-2 font-normal text-slate-500">
                          ({session.total_time})
                        </span>
                      </p>
                      {session.type === "Manual" && (
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs">
                          Manual
                        </span>
                      )}
                      {session.idle_times?.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedSessionIdleTimes(session.idle_times);
                            setIsIdleTimeModalOpen(true);
                          }}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs"
                        >
                          Show Idle Time
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  {session.memo_content && (
                    <p className="text-sm text-slate-600 mt-1">
                      {session.memo_content}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {session.screenshots?.map((ss) => (
                      <div key={ss.id} className="text-center">
                        <a
                          href={`${STORAGE_URL}/${ss.screenshot_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={`${STORAGE_URL}/${ss.screenshot_file}`}
                            className="w-full rounded border hover:border-blue-500"
                            alt="Screen"
                          />
                        </a>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatScreenshotTime(ss.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-slate-500">No work sessions found.</p>
          </div>
        )}

        {/* PAGINATION */}
        {paginationInfo?.lastPage > 1 && (
          <div className="flex justify-center items-center mt-12 pt-6 border-t space-x-4">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={paginationInfo.currentPage === 1}
              className="px-4 py-2 bg-slate-800 text-white rounded disabled:bg-slate-400"
            >
              Prev
            </button>
            <span>
              Page {paginationInfo.currentPage} of {paginationInfo.lastPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={paginationInfo.currentPage === paginationInfo.lastPage}
              className="px-4 py-2 bg-slate-800 text-white rounded disabled:bg-slate-400"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* IDLE TIME MODAL */}
      {isIdleTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(255,255,255,0.8)] dark:bg-[rgba(15,23,42,0.8)] backdrop-blur">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border dark:border-slate-700">
            <h3 className="text-lg font-bold mb-4">Idle Time Details</h3>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-slate-50">
                  <tr>
                    <th className="px-6 py-3">Start</th>
                    <th className="px-6 py-3">End</th>
                    <th className="px-6 py-3">Duration</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSessionIdleTimes.map((idle) => (
                    <tr key={idle.id} className="border-b">
                      <td className="px-6 py-4">
                        {idle.start_time
                          ? formatScreenshotTime(idle.start_time)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {idle.end_time
                          ? formatScreenshotTime(idle.end_time)
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {calculateIdleDuration(idle.start_time, idle.end_time)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteIdleTime(idle.id)}
                          className="text-red-500"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsIdleTimeModalOpen(false)}
                className="btn bg-slate-800 text-white"
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