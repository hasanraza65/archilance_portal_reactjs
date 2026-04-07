import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/light.css";
import { Loader2, AlertCircle, ArrowLeft, BookOpenCheck } from "lucide-react";

// --- START: Helper Functions ---

// Helper to get start/end dates for Today
const getTodayDateRange = () => {
  const today = new Date();
  return [today, today];
};

// Helper to get start/end dates for the Current Week (Mon-Sun)
const getCurrentWeekRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon,...
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust so Monday is the first day
  const start = new Date(now.setDate(diff));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return [start, end];
};

// Helper to get start/end dates for Last Week (Mon-Sun)
const getLastWeekRange = () => {
    const [start] = getCurrentWeekRange();
    const lastWeekStart = new Date(start);
    lastWeekStart.setDate(start.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
    return [lastWeekStart, lastWeekEnd];
}

// Helper to get start/end dates for the Current Month
const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return [start, end];
}

// Helper to get start/end dates for the Last Month
const getLastMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return [start, end];
}


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

const FilterIcon = () => (
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

const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// --- END: Helper Functions ---


const WorkDiaryPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const token = Cookies.get("token");

  const [sessions, setSessions] = useState([]);
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // MODIFIED: State management for period and date range
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [dateRange, setDateRange] = useState(getTodayDateRange());
  const [hasSearched, setHasSearched] = useState(true);

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/customer`;
  const STORAGE_URL = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage`;

  useEffect(() => {
    const performFetch = async () => {
      if (!token || !projectId || !hasSearched) {
        setLoading(false);
        setSessions([]);
        return;
      }

      setLoading(true);
      window.scrollTo(0, 0);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        project_id: projectId,
      });

      if (dateRange && dateRange[0])
        params.append("start_date", formatDateForAPI(dateRange[0]));
      // For single-day selections, dateRange[1] might be undefined. Handle that.
      const endDate = dateRange.length > 1 ? dateRange[1] : dateRange[0];
      if (endDate)
        params.append("end_date", formatDateForAPI(endDate));

      try {
        const response = await fetch(
          `${API_BASE_URL}/work-session?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Request failed");

        setSessions(result.data || []);
        setPaginationInfo({
          currentPage: result.current_page,
          lastPage: result.last_page,
          total: result.total,
        });
      } catch (err) {
        toast.error(err.message);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    performFetch();
  }, [fetchTrigger, currentPage, token, projectId, dateRange, hasSearched, API_BASE_URL]);

  const handleSearch = () => {
    setHasSearched(true);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      setFetchTrigger((t) => t + 1);
    }
  };

  const handleResetFilters = () => {
    setSelectedPeriod('today');
    setDateRange(getTodayDateRange());
    setHasSearched(true);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      setFetchTrigger((t) => t + 1);
    }
  };

  // NEW: Handler for the Period dropdown
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    let newRange = [];
    switch (period) {
        case 'today':
            newRange = getTodayDateRange();
            break;
        case 'current_week':
            newRange = getCurrentWeekRange();
            break;
        case 'last_week':
            newRange = getLastWeekRange();
            break;
        case 'current_month':
            newRange = getCurrentMonthRange();
            break;
        case 'last_month':
            newRange = getLastMonthRange();
            break;
        case 'custom':
            // Don't change the date range, let the user pick
            return;
        default:
            newRange = getTodayDateRange();
    }
    setDateRange(newRange);
  }

  // NEW: Handler for when the Flatpickr date is changed manually
  const handleDateChange = (dates) => {
    if (dates.length > 0) {
        setDateRange(dates);
        setSelectedPeriod('custom'); // Set period to custom when user picks dates
    }
  }


  const handleDelete = (sessionId) => {
    Swal.fire({
      title: "Action Not Allowed",
      text: "Customers cannot delete work sessions.",
      icon: "info",
    });
  };

  const handleNextPage = () => {
    if (paginationInfo?.currentPage < paginationInfo?.lastPage)
      setCurrentPage((p) => p + 1);
  };
  const handlePrevPage = () => {
    if (paginationInfo?.currentPage > 1) setCurrentPage((p) => p - 1);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700">
            Authentication Error
          </h2>
          <p className="text-gray-600 mt-2">
            Could not find authentication token. Please log in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to={`/project/${projectId}`}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ArrowLeft size={18} />
            Back to Project Details
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-3">
          <BookOpenCheck className="w-8 h-8 text-cyan-600" />
          Work Diary for Project #{projectId}
        </h1>

        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/30 backdrop-blur-sm p-6 rounded-xl mb-8 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <FilterIcon />
            Filter Work Sessions
          </h3>
          {/* MODIFIED: Filter layout updated to 3 columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Period
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="form-select w-full"
              >
                <option value="today">Today</option>
                <option value="current_week">Current Week</option>
                <option value="last_week">Last Week</option>
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Custom Date Range
              </label>
              <Flatpickr
                value={dateRange}
                onChange={handleDateChange}
                className="form-input w-full"
                options={{
                  mode: dateRange.length > 1 || selectedPeriod !== 'today' ? "range" : "single",
                  dateFormat: "M j, Y"
                }}
                placeholder="Select date range"
              />
            </div>
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
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
          {loading ? (
            <div className="text-center py-16 flex justify-center items-center">
              <Loader2 className="w-8 h-8 mr-3 text-blue-500 animate-spin" />
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
                        title="Delete action is disabled for customers"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-slate-300 cursor-not-allowed"
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
                      {session.screenshots && session.screenshots.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {session.screenshots.map((ss) => {
                            const screenshotPath = user?.role === "admin" ? ss.screenshot_file : ss.emp_screenshot_file;
                            return (
                              <div key={ss.id} className="text-center">
                                <a
                                  href={`${STORAGE_URL}/${screenshotPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={`${STORAGE_URL}/${screenshotPath}`}
                                    alt={`Screenshot`}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500"
                                  />
                                </a>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                                  {formatTime(ss.created_at.split("T")[1])}
                                </p>
                              </div>
                            );
                          })}
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
          ) : (
            <div className="text-center py-16">
              <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-200">
                No Work Sessions Found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                No diary entries match the selected criteria for this
                project.
              </p>
            </div>
          )}
          {paginationInfo && paginationInfo.lastPage > 1 && (
            <div className="flex justify-center items-center mt-12 pt-6 border-t border-slate-200 dark:border-slate-700 space-x-4">
              <button
                onClick={handlePrevPage}
                disabled={paginationInfo.currentPage === 1}
                className="btn btn-secondary disabled:opacity-50"
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
                className="btn btn-secondary disabled:opacity-50"
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

export default WorkDiaryPage;