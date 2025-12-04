import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// --- UPDATED COLORS (More Distinct) ---
const PIE_COLORS = [
  "#3b82f6", // Blue (Tailwind Blue 500)
  "#10b981", // Emerald (Green)
  "#f59e0b", // Amber (Yellow)
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
];

// --- HELPERS ---
const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(totalSeconds % 60)}s`;
};

const determineCategory = (appName, windowTitle) => {
  if (!appName) return "Neutral";
  const lowerName = appName.toLowerCase();
  const lowerTitle = windowTitle ? windowTitle.toLowerCase() : "";

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
    "messenger",
    "snapchat",
    "reddit",
  ];
  if (
    socialKeywords.some((k) => lowerName.includes(k) || lowerTitle.includes(k))
  )
    return "Social";

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
  ];
  if (
    productiveKeywords.some(
      (k) => lowerName.includes(k) || lowerTitle.includes(k)
    )
  )
    return "Productive";

  if (
    lowerName.includes("chrome") ||
    lowerName.includes("edge") ||
    lowerName.includes("firefox")
  ) {
    if (
      lowerTitle.includes("admin") ||
      lowerTitle.includes("crm") ||
      lowerTitle.includes("archilance")
    )
      return "Productive";
    return "Neutral";
  }
  return "Neutral";
};

// --- CUSTOM TOOLTIP ---
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl border border-slate-700 z-50">
        <p className="font-bold text-sm mb-1">{data.name}</p>
        <div className="flex items-center gap-2 text-xs opacity-90">
          <span>{formatDuration(data.value)}</span>
          {data.category && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                data.category === "Productive"
                  ? "bg-green-500/20 text-green-300"
                  : data.category === "Social"
                  ? "bg-red-500/20 text-red-300"
                  : data.category === "Multiple"
                  ? "bg-slate-500/20 text-slate-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {data.category}
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// --- RECHARTS LABEL (UPDATED: Shows label for > 1% slices) ---
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  // FIX: Pehle ye 0.05 (5%) tha, ab 0.01 (1%) kar diya hai taaki sab numbering show ho
  if (percent < 0.01) return null;

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
  // --- PROCESS DATA ---
  const dashboardData = useMemo(() => {
    let appMap = {};
    let categoryStats = { Productive: 0, Social: 0, Neutral: 0, Idle: 0 };
    let totalActivitySeconds = 0;
    let totalIdleSeconds = 0;

    // 1. Process Activity
    if (Array.isArray(rootActivityList)) {
      rootActivityList.forEach((activity) => {
        if (activity?.app_name && activity?.duration_seconds) {
          const dur = parseFloat(activity.duration_seconds);
          if (!isNaN(dur) && dur > 0) {
            const cleanAppName = activity.app_name.trim();
            const category = determineCategory(
              cleanAppName,
              activity.window_title
            );

            if (!appMap[cleanAppName])
              appMap[cleanAppName] = {
                duration: 0,
                category: category,
                count: 0,
              };
            appMap[cleanAppName].duration += dur;
            appMap[cleanAppName].count += 1;
            if (categoryStats[category] !== undefined)
              categoryStats[category] += dur;
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
                if (diff < 0) diff += 86400;
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

    // 3. Sort & Prepare Pie Data
    const sortedApps = Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.duration - a.duration);

    // Increase limit to show more individual apps in chart if needed, standard is 5
    const topAppsLimit = 5;
    const topAppsData = sortedApps.slice(0, topAppsLimit).map((app, index) => ({
      name: app.name,
      value: app.duration,
      category: app.category,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }));

    // Calculate "Others"
    const otherAppsDuration = sortedApps
      .slice(topAppsLimit)
      .reduce((acc, app) => acc + app.duration, 0);

    const finalPieData = [...topAppsData];

    if (otherAppsDuration > 0) {
      finalPieData.push({
        name: "Others",
        value: otherAppsDuration,
        category: "Multiple",
        color: "#94a3b8", // Slate 400 (Grey) for Others
      });
    }

    if (totalIdleSeconds > 0) {
      finalPieData.push({
        name: "Idle Time",
        value: totalIdleSeconds,
        category: "Idle",
        color: "#fbbf24", // Amber 400 for Idle
      });
    }

    const grandTotal = totalActivitySeconds + totalIdleSeconds;

    return {
      pieData: finalPieData,
      aggregatedApps: sortedApps.slice(0, 10),
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
                          ? "bg-red-400"
                          : "bg-slate-400"
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
                    label={renderCustomizedLabel} // Updated label function
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
