import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import GridLoading from "@/components/skeleton/Grid";
import { getApiPrefix, getEmployeeType } from "@/pages/utility/apiHelper";

const VITE_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

const getAuthToken = () => Cookies.get("token");

const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return `/api/${role}${cleanBasePath}`;
};

// --- Status colors ---
const statusConfig = {
  "On Hold": {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-700",
    dot: "bg-orange-500",
  },
  Backlog: {
    bg: "bg-slate-100 dark:bg-slate-700/50",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-600",
    dot: "bg-slate-500",
  },
  "Awaiting Info": {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-300",
    border: "border-yellow-200 dark:border-yellow-700",
    dot: "bg-yellow-500",
  },
  "In Progress": {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700",
    dot: "bg-blue-500",
  },
  "In-house review": {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700",
    dot: "bg-indigo-500",
  },
  "Client Review": {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700",
    dot: "bg-purple-500",
  },
  Completed: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-700",
    dot: "bg-green-500",
  },
  Default: {
    bg: "bg-gray-100 dark:bg-gray-700/50",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-600",
    dot: "bg-gray-500",
  },
};

const getStatusConfig = (status) =>
  statusConfig[status] || statusConfig["Default"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// --- Helper: Get all days in a month ---
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// --- Helper: Format date as YYYY-MM-DD ---
const formatDate = (year, month, day) => {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

// --- Helper: Format display date ---
const formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr + "T00:00:00");
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${day} ${month}`;
};

// --- Helper: Get day name ---
const getDayName = (dateStr) => {
  const date = new Date(dateStr + "T00:00:00");
  return DAY_NAMES[date.getDay()];
};

// --- Assignee Avatar ---
const AssigneeAvatar = ({ user }) => {
  if (!user) return null;
  const avatarUrl = user.profile_pic
    ? `${VITE_BASE_URL}/storage/${user.profile_pic}`
    : null;
  const initials = user.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div
      title={user.name}
      className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[10px] font-semibold shadow-sm flex-shrink-0"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-blue-700">{initials}</span>
      )}
    </div>
  );
};

// --- Task Card ---
const TaskCard = ({ item, onClick }) => {
  const task = item.sub_task || item.task;
  const project = item.project;
  const status = task?.task_status || "Unknown";
  const config = getStatusConfig(status);
  const assignees = task?.assignees || [];
  const priority = task?.priority;

  const priorityColors = {
    High: "text-red-600 dark:text-red-400",
    Medium: "text-yellow-600 dark:text-yellow-400",
    Low: "text-green-600 dark:text-green-400",
  };

  return (
    <div
      onClick={() => onClick(task, project)}
      className={`group p-3 rounded-lg border ${config.border} ${config.bg} hover:shadow-md transition-all duration-200 cursor-pointer`}
    >
      {/* Project name */}
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 truncate">
        {project?.project_name || "N/A"}
      </p>

      {/* Task title */}
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {task?.task_title || "Untitled Task"}
      </p>

      {/* Bottom row: status + priority + assignees */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.text} ${config.bg} border ${config.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
            {status}
          </span>

          {/* Priority */}
          {priority && (
            <span
              className={`text-[10px] font-semibold ${
                priorityColors[priority] || "text-slate-500"
              }`}
            >
              {priority}
            </span>
          )}
        </div>

        {/* Assignees */}
        <div className="flex items-center -space-x-1.5">
          {assignees.slice(0, 3).map((a) => (
            <AssigneeAvatar key={a.id} user={a.user} />
          ))}
          {assignees.length > 3 && (
            <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-600 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
              +{assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Date Section ---
const DateSection = React.forwardRef(({ dateStr, data, isToday, isExpanded, isLoading, onToggle, onTaskClick }, ref) => {
  const displayDate = formatDisplayDate(dateStr);
  const dayName = getDayName(dateStr);
  const totalTasks = data?.summary?.total_rows || 0;
  const tasks = data?.data || [];

  return (
    <div
      ref={ref}
      className={`rounded-xl overflow-hidden border transition-all duration-300 ${
        isToday
          ? "border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-100 dark:shadow-blue-900/20"
          : "border-slate-200 dark:border-slate-700 shadow-sm"
      }`}
    >
      {/* Date header */}
      <div
        onClick={onToggle}
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors duration-200 ${
          isToday
            ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40"
            : "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
        }`}
      >
        <div className="flex items-center space-x-3">
          <Icon
            icon={
              isExpanded
                ? "heroicons:chevron-down"
                : "heroicons:chevron-right"
            }
            className={`w-5 h-5 transition-transform duration-200 ${
              isToday
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          />

          <div className="flex items-center gap-3">
            {/* Calendar icon date block */}
            <div
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                isToday
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/50"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
              }`}
            >
              <span className="text-[10px] font-semibold uppercase leading-none mt-0.5">
                {dayName}
              </span>
              <span className="text-lg font-bold leading-none">
                {new Date(dateStr + "T00:00:00").getDate()}
              </span>
            </div>

            <div>
              <h3
                className={`text-base font-semibold ${
                  isToday
                    ? "text-blue-800 dark:text-blue-300"
                    : "text-slate-800 dark:text-slate-200"
                }`}
              >
                {displayDate}
                {isToday && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-600 text-white animate-pulse">
                    Today
                  </span>
                )}
              </h3>
              {data && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {totalTasks} {totalTasks === 1 ? "task" : "tasks"} due
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Summary badges */}
        {totalTasks > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            {data?.summary?.total_projects > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                <Icon icon="heroicons-outline:briefcase" className="w-3 h-3" />
                {data.summary.total_projects} {data.summary.total_projects === 1 ? "project" : "projects"}
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              <Icon icon="heroicons-outline:clipboard-list" className="w-3 h-3" />
              {totalTasks}
            </span>
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-slate-500">Loading tasks...</span>
            </div>
          ) : tasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {tasks.map((item, idx) => {
                const task = item.sub_task || item.task;
                return (
                  <TaskCard
                    key={`${task?.id || idx}-${idx}`}
                    item={item}
                    onClick={onTaskClick}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
              <Icon
                icon="heroicons-outline:calendar"
                className="w-8 h-8 mx-auto mb-2"
              />
              <p className="text-sm">No tasks due on this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// --- Main CalendarView Component ---
const CalendarView = () => {
  const navigate = useNavigate();
  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [calendarData, setCalendarData] = useState({});  // cached API responses
  const [loadingDates, setLoadingDates] = useState({});   // per-date loading state
  const [expandedDates, setExpandedDates] = useState({});
  const todayRef = useRef(null);
  const hasScrolledRef = useRef(false);

  // Generate all dates for current month
  const monthDates = useMemo(() => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const dates = [];
    for (let d = 1; d <= days; d++) {
      dates.push(formatDate(currentYear, currentMonth, d));
    }
    return dates;
  }, [currentYear, currentMonth]);

  // Reset when month changes
  useEffect(() => {
    setCalendarData({});
    setLoadingDates({});
    setExpandedDates({});
    hasScrolledRef.current = false;

    // Auto-expand today if it's in the current month
    const todayIsInMonth =
      today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    if (todayIsInMonth) {
      setExpandedDates({ [todayStr]: true });
    }
  }, [currentYear, currentMonth]);

  // Smooth scroll to today's date after initial render
  useEffect(() => {
    if (!hasScrolledRef.current && todayRef.current) {
      const timer = setTimeout(() => {
        todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        hasScrolledRef.current = true;
      }, 300);
      return () => clearTimeout(timer);
    }
  });

  // Fetch data for a single date (on-demand)
  const fetchDateData = useCallback(async (dateStr) => {
    // Already cached? skip
    if (calendarData[dateStr]) return;

    const token = getAuthToken();
    if (!token) return;

    setLoadingDates((prev) => ({ ...prev, [dateStr]: true }));

    try {
      const apiPath = getApiBasePathForRole("/project-tasks-by-dates");
      const apiUrl = `${VITE_BASE_URL}${apiPath}`;
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        params: { date: dateStr },
      });

      setCalendarData((prev) => ({ ...prev, [dateStr]: response.data }));
    } catch (err) {
      // Store empty data on error so we don't retry infinitely
      setCalendarData((prev) => ({
        ...prev,
        [dateStr]: { summary: { total_rows: 0 }, data: [] },
      }));
    } finally {
      setLoadingDates((prev) => ({ ...prev, [dateStr]: false }));
    }
  }, [calendarData]);

  // When a date is expanded, fetch its data
  useEffect(() => {
    Object.entries(expandedDates).forEach(([dateStr, isExpanded]) => {
      if (isExpanded && !calendarData[dateStr] && !loadingDates[dateStr]) {
        fetchDateData(dateStr);
      }
    });
  }, [expandedDates, calendarData, loadingDates, fetchDateData]);

  const toggleDate = (dateStr) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const handleTaskClick = useCallback(
    (task, project) => {
      if (task) {
        navigate(`/project/${task.id}`, {
          state: { jobId: project?.id },
        });
      }
    },
    [navigate]
  );

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setExpandedDates({ [todayStr]: true });
    // Scroll to today after state update renders
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const expandAll = () => {
    const allExpanded = {};
    monthDates.forEach((d) => (allExpanded[d] = true));
    setExpandedDates(allExpanded);
  };

  const collapseAll = () => {
    setExpandedDates({});
  };

  return (
    <div>
      {/* Month navigation + controls */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPrevMonth}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Previous Month"
            >
              <Icon icon="heroicons:chevron-left" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 min-w-[180px] text-center">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Next Month"
            >
              <Icon icon="heroicons:chevron-right" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
            >
              <Icon icon="heroicons-outline:calendar" className="w-4 h-4 inline mr-1" />
              Today
            </button>
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>
      </Card>

      {/* Date sections - show ALL dates of the month */}
      <div className="space-y-3">
        {monthDates.map((dateStr) => {
          const data = calendarData[dateStr];
          const isToday = dateStr === todayStr;
          const isDateLoading = !!loadingDates[dateStr];

          return (
            <DateSection
              key={dateStr}
              ref={isToday ? todayRef : null}
              dateStr={dateStr}
              data={data}
              isToday={isToday}
              isExpanded={!!expandedDates[dateStr]}
              isLoading={isDateLoading}
              onToggle={() => toggleDate(dateStr)}
              onTaskClick={handleTaskClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
