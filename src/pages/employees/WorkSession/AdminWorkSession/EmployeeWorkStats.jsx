import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// --- COLORS ---
const PIE_COLORS = {
  Productive: "#10b981", // Emerald-500
  Social: "#ef4444", // Red-500
  Neutral: "#8b5cf6", // Violet-500
  Idle: "#f59e0b", // Amber-500
  Multiple: "#94a3b8", // Slate-400
};

// --- HELPER: Seconds to Readable String ---
const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(totalSeconds % 60)}s`;
};

// --- HELPER: Categorize Apps ---
const determineCategory = (appName, windowTitle) => {
  if (!appName) return "Neutral";
  const lowerName = appName.toLowerCase();
  const lowerTitle = windowTitle ? windowTitle.toLowerCase() : "";

  // 1. Social
  const socialKeywords = [
    "facebook",
    "instagram",
    "youtube",
    "whatsapp",
    "twitter",
    "tiktok",
    "netflix",
    "spotify",
    "discord",
    "telegram",
    "reddit",
  ];
  if (
    socialKeywords.some((k) => lowerName.includes(k) || lowerTitle.includes(k))
  )
    return "Social";

  // 2. Productive
  const productiveKeywords = [
    "visual studio",
    "vscode",
    "pycharm",
    "git",
    "github",
    "docker",
    "postman",
    "excel",
    "word",
    "powerpoint",
    "outlook",
    "teams",
    "slack",
    "zoom",
    "meet",
    "archilance",
    "autocad",
    "revit",
    "photoshop",
    "figma",
    "canva",
    "chatgpt",
    "claude",
    "ai studio",
  ];
  if (
    productiveKeywords.some(
      (k) => lowerName.includes(k) || lowerTitle.includes(k)
    )
  )
    return "Productive";

  // 3. Browsers (Context based)
  if (
    lowerName.includes("chrome") ||
    lowerName.includes("edge") ||
    lowerName.includes("firefox")
  ) {
    if (
      lowerTitle.includes("admin") ||
      lowerTitle.includes("crm") ||
      lowerTitle.includes("archilance") ||
      lowerTitle.includes("docs")
    )
      return "Productive";
    return "Neutral";
  }
  return "Neutral";
};

// --- CUSTOM TOOLTIP COMPONENT ---
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 z-50 max-w-[220px]">
        <p className="font-bold text-sm mb-2 border-b border-slate-600 pb-1">
          {data.name}: {formatDuration(data.value)}
        </p>

        {/* Show Apps contributing to this slice */}
        {data.topApps && data.topApps.length > 0 ? (
          <ul className="text-xs space-y-1">
            {data.topApps.slice(0, 5).map((app, idx) => (
              <li key={idx} className="flex justify-between items-center gap-2">
                <span className="truncate opacity-90 w-24" title={app.name}>
                  {app.name}
                </span>
                <span className="opacity-60 font-mono">
                  {formatDuration(app.duration)}
                </span>
              </li>
            ))}
            {data.topApps.length > 5 && (
              <li className="text-[10px] text-center opacity-50 pt-1">
                + {data.topApps.length - 5} more apps
              </li>
            )}
          </ul>
        ) : (
          <p className="text-xs opacity-50 italic">No specific apps</p>
        )}
      </div>
    );
  }
  return null;
};

// --- RECHARTS LABEL ---
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  if (percent < 0.02) return null; // Hide label if slice is less than 2%
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[10px] font-bold pointer-events-none"
      style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.8)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const EmployeeWorkStats = ({ sessions, rootActivityList }) => {
  // --- MAIN CALCULATION LOGIC ---
  const dashboardData = useMemo(() => {
    let appMap = {};
    let categoryStats = { Productive: 0, Social: 0, Neutral: 0, Idle: 0 };
    // Arrays to hold apps for tooltip grouping
    let appsByCategory = { Productive: [], Social: [], Neutral: [], Idle: [] };

    let totalActivitySeconds = 0;
    let totalIdleSeconds = 0;

    // 1. Process Windows Activity (Active Time)
    if (Array.isArray(rootActivityList)) {
      rootActivityList.forEach((activity) => {
        if (activity?.app_name && activity?.duration_seconds) {
          const dur = parseFloat(activity.duration_seconds);
          // Valid duration check
          if (!isNaN(dur) && dur > 0) {
            const cleanAppName = activity.app_name.trim();
            const category = determineCategory(
              cleanAppName,
              activity.window_title
            );

            if (!appMap[cleanAppName]) {
              appMap[cleanAppName] = {
                duration: 0,
                category: category,
                count: 0,
              };
            }
            appMap[cleanAppName].duration += dur;
            appMap[cleanAppName].count += 1;

            if (categoryStats[category] !== undefined) {
              categoryStats[category] += dur;
            }
            totalActivitySeconds += dur;
          }
        }
      });
    }

    // 2. Process Idle Time
    if (Array.isArray(sessions)) {
      sessions.forEach((session) => {
        if (session.idle_times && Array.isArray(session.idle_times)) {
          session.idle_times.forEach((idle) => {
            if (idle.start_time && idle.end_time) {
              const startParts = idle.start_time.split(":");
              const endParts = idle.end_time.split(":");
              if (startParts.length === 3 && endParts.length === 3) {
                const startSec =
                  +startParts[0] * 3600 + +startParts[1] * 60 + +startParts[2];
                const endSec =
                  +endParts[0] * 3600 + +endParts[1] * 60 + +endParts[2];
                let diff = endSec - startSec;
                if (diff < 0) diff += 86400; // Midnight crossover
                if (diff > 0) {
                  categoryStats.Idle += diff;
                  totalIdleSeconds += diff;
                }
              }
            }
          });
        }
      });
    }

    // 3. Sort Apps & Group for Tooltips
    const sortedApps = Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.duration - a.duration);

    sortedApps.forEach((app) => {
      if (appsByCategory[app.category]) {
        appsByCategory[app.category].push(app);
      }
    });

    // 4. Prepare Pie Data
    const finalPieData = [
      {
        name: "Productive",
        value: categoryStats.Productive,
        color: PIE_COLORS.Productive,
        topApps: appsByCategory.Productive,
      },
      {
        name: "Social",
        value: categoryStats.Social,
        color: PIE_COLORS.Social,
        topApps: appsByCategory.Social,
      },
      {
        name: "Neutral",
        value: categoryStats.Neutral,
        color: PIE_COLORS.Neutral,
        topApps: appsByCategory.Neutral,
      },
      {
        name: "Idle",
        value: categoryStats.Idle,
        color: PIE_COLORS.Idle,
        topApps: [],
      },
    ].filter((item) => item.value > 0);

    const grandTotal = totalActivitySeconds + totalIdleSeconds;

    return {
      pieData: finalPieData,
      aggregatedApps: sortedApps.slice(0, 10), // Top 10 list
      stats: {
        totalSeconds: grandTotal,
        productiveSeconds: categoryStats.Productive,
        idleSeconds: categoryStats.Idle,
      },
    };
  }, [sessions, rootActivityList]);

  return (
    <div className="font-sans">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold uppercase tracking-wider">
            Total Time
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatDuration(dashboardData.stats.totalSeconds)}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-green-500 dark:text-green-400 mb-1 font-semibold uppercase tracking-wider">
            Productive Time
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatDuration(dashboardData.stats.productiveSeconds)}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-amber-500 dark:text-amber-400 mb-1 font-semibold uppercase tracking-wider">
            Idle Time
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatDuration(dashboardData.stats.idleSeconds)}
          </h2>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-indigo-500 dark:text-indigo-400 mb-1 font-semibold uppercase tracking-wider">
            Productivity %
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {dashboardData.stats.totalSeconds > 0
              ? Math.round(
                  (dashboardData.stats.productiveSeconds /
                    dashboardData.stats.totalSeconds) *
                    100
                )
              : 0}
            %
          </h2>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Top Apps List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-slate-700 dark:text-slate-200 font-medium text-sm mb-5 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700 pb-2">
            Top Apps & Websites
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {dashboardData.aggregatedApps.length > 0 ? (
              dashboardData.aggregatedApps.map((app, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        app.category === "Productive"
                          ? "bg-green-500"
                          : app.category === "Social"
                          ? "bg-red-500"
                          : app.category === "Idle"
                          ? "bg-amber-500"
                          : "bg-violet-500"
                      }`}
                    ></div>
                    <span
                      className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate"
                      title={app.name}
                    >
                      {app.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatDuration(app.duration)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        app.category === "Productive"
                          ? "text-green-700 bg-green-100"
                          : app.category === "Social"
                          ? "text-red-700 bg-red-100"
                          : "text-slate-600 bg-slate-100"
                      }`}
                    >
                      {app.category}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No activity data available.
              </p>
            )}
          </div>
        </div>

        {/* Right: Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center min-h-[350px]">
          <h3 className="text-slate-700 dark:text-slate-200 font-medium text-sm mb-2 w-full text-left px-2 uppercase tracking-wide">
            Activity Breakdown
          </h3>
          <div className="w-full h-[300px]">
            {dashboardData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    innerRadius={70}
                    outerRadius={110}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    paddingAngle={2}
                  >
                    {dashboardData.pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>No data to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeWorkStats;
