// src/pages/admin/AdminEmployeeWorkSession.js

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import Card from "@/components/ui/Card";

// Helper Icons and Functions
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
const calculateDuration = (start, end) => {
  if (!start || !end) return "(N/A)";
  const sT = new Date(`1970-01-01T${start}Z`),
    eT = new Date(`1970-01-01T${end}Z`);
  if (isNaN(sT) || isNaN(eT) || eT < sT) return "(N/A)";
  let d = (eT - sT) / 1000;
  const h = Math.floor(d / 3600);
  d %= 3600;
  const m = Math.floor(d / 60);
  return `(${h > 0 ? `${h}h ` : ""}${m}m)`;
};
const formatDateForAPI = (date) => date.toISOString().split("T")[0];

const AdminEmployeeWorkSession = () => {
  const { employeeId } = useParams();
  const { token, logout, isAuthenticated } = useAuth();

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
  const [dateRange, setDateRange] = useState([]);

  const API_BASE_URL = "https://demo.aentora.com/backend/public/api/admin";
  const STORAGE_URL = "https://demo.aentora.com/backend/public/storage";

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

  // *** FIX: Fetch projects using ADMIN API endpoint ***
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/project`, {
          // Changed to admin endpoint
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Could not fetch projects.");
        const data = await res.json();
        setProjects(data.data || []);
      } catch (error) {
        toast.error(error.message);
      }
    };
    fetchProjects();
  }, [isAuthenticated, token]);

  // *** FIX: Fetch tasks using ADMIN API endpoint ***
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
          // Changed to admin endpoint
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

  // Fetch work sessions for the specific employee (This was already correct)
  const fetchWorkSessions = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    window.scrollTo(0, 0);

    const params = new URLSearchParams({
      page: currentPage.toString(),
      employee_id: employeeId,
    });

    if (selectedTask) params.append("task_id", selectedTask);
    if (dateRange[0])
      params.append("start_date", formatDateForAPI(dateRange[0]));
    if (dateRange[1]) params.append("end_date", formatDateForAPI(dateRange[1]));

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
      setSessions(result.data?.reverse() || []);
      setPaginationInfo({
        currentPage: result.current_page,
        lastPage: result.last_page,
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    employeeId,
    currentPage,
    selectedTask,
    dateRange,
    token,
    isAuthenticated,
    logout,
  ]);

  useEffect(() => {
    if (isAuthenticated) fetchWorkSessions();
    else setLoading(false);
  }, [fetchWorkSessions, isAuthenticated]);

  useEffect(() => {
    if (currentPage !== 1) setCurrentPage(1);
  }, [selectedTask, dateRange, selectedProject]);

  const handleResetFilters = () => {
    setSelectedProject("");
    setSelectedTask("");
    setTasks([]);
    setDateRange([]);
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
          setSessions((p) => p.filter((s) => s.id !== sessionId));
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

  if (!isAuthenticated)
    return (
      <div className="p-8 text-center">
        <p>Please log in.</p>
      </div>
    );

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h4 className="card-title">
          Work Diary for{" "}
          <span className="text-slate-800 dark:text-slate-200">
            {employeeName || "Loading..."}
          </span>
        </h4>
        <Link to="/employees" className="btn btn-sm btn-outline-dark">
          ← Back to Employee List
        </Link>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mb-8 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                setSelectedTask("");
              }}
              className="form-select w-full"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Task
            </label>
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={!selectedProject || tasksLoading}
              className="form-select w-full disabled:bg-slate-100"
            >
              <option value="">All Tasks</option>
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
          <div className="flex flex-col md:col-span-1">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Date Range
            </label>
            <Flatpickr
              value={dateRange}
              onChange={setDateRange}
              className="form-input w-full"
              options={{ mode: "range", dateFormat: "Y-m-d" }}
              placeholder="Select date range"
            />
          </div>
          <div className="flex flex-col">
            <button
              onClick={handleResetFilters}
              className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded"
            >
              Reset Filters
            </button>
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
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatTime(session.start_time)} –{" "}
                      {formatTime(session.end_time)}
                      <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                        {calculateDuration(
                          session.start_time,
                          session.end_time
                        )}
                      </span>
                    </p>
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
