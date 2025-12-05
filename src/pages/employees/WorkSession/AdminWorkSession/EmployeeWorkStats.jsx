import React, { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// --- COLORS PALETTE ---
const APP_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#84cc16", // Lime
  "#d946ef", // Fuchsia
];

// --- HELPER: Seconds to Readable String ---
const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// --- HELPER: Categorize Apps ---
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
    "ai studio",
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
      lowerTitle.includes("archilance") ||
      lowerTitle.includes("docs")
    )
      return "Productive";
    return "Neutral";
  }
  return "Neutral";
};

// --- HELPER: Calculate Tooltip Position ---
const calculateTooltipPos = (data) => {
  const RADIAN = Math.PI / 180;
  const radius = data.outerRadius + 15;
  const x = data.cx + radius * Math.cos(-data.midAngle * RADIAN);
  const y = data.cy + radius * Math.sin(-data.midAngle * RADIAN);
  return { x, y };
};

// --- MAIN COMPONENT ---
// Added 'totalIdleSeconds' to props
const EmployeeWorkStats = ({
  sessions,
  rootActivityList,
  totalIdleSeconds = 0,
}) => {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const onPieEnter = (data) => setHoveredSlice(data);
  const onPieLeave = () => setHoveredSlice(null);

  const dashboardData = useMemo(() => {
    let appMap = {};
    let categoryStats = { Productive: 0, Social: 0, Neutral: 0, Idle: 0 };
    let totalActivitySeconds = 0;

    // 1. Process Windows Activity (For Productive/App Time)
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

            if (!appMap[cleanAppName]) {
              appMap[cleanAppName] = {
                duration: 0,
                category: category,
                count: 0,
              };
            }
            appMap[cleanAppName].duration += dur;
            appMap[cleanAppName].count += 1;

            if (categoryStats[category] !== undefined)
              categoryStats[category] += dur;
            totalActivitySeconds += dur;
          }
        }
      });
    }

    // NOTE: We are NOT recalculating idle time here anymore.
    // We rely on the 'totalIdleSeconds' prop passed from the parent.
    const grandTotal = totalActivitySeconds + totalIdleSeconds;

    // 3. Sort Apps by Duration
    const sortedApps = Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.duration - a.duration);

    // 4. Create Pie Data
    const topAppsCount = 5;
    const topApps = sortedApps.slice(0, topAppsCount);
    const otherApps = sortedApps.slice(topAppsCount);
    const otherDuration = otherApps.reduce(
      (acc, curr) => acc + curr.duration,
      0
    );

    const finalPieData = topApps.map((app, index) => ({
      name: app.name,
      value: app.duration,
      total: grandTotal,
      category: app.category,
      color: APP_COLORS[index % APP_COLORS.length],
    }));

    if (otherDuration > 0) {
      finalPieData.push({
        name: "Others",
        value: otherDuration,
        total: grandTotal,
        category: "Multiple",
        color: "#94a3b8",
      });
    }

    // Add Idle Time Slice if exists
    if (totalIdleSeconds > 0) {
      finalPieData.push({
        name: "Idle Time",
        value: totalIdleSeconds,
        total: grandTotal,
        category: "Idle",
        color: "#fbbf24", // Amber/Yellow
      });
    }

    return {
      pieData: finalPieData,
      aggregatedApps: sortedApps.slice(0, 10),
      stats: {
        totalSeconds: grandTotal,
        productiveSeconds: categoryStats.Productive,
        idleSeconds: totalIdleSeconds, // <--- Using the Prop Here directly
      },
    };
  }, [sessions, rootActivityList, totalIdleSeconds]);

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Detailed List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-slate-700 dark:text-slate-200 font-medium text-sm mb-5 uppercase tracking-wide border-b border-slate-100 dark:border-slate-700 pb-2">
            Top Apps
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {dashboardData.aggregatedApps.length > 0 ? (
              dashboardData.aggregatedApps.map((app, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            i < 5
                              ? APP_COLORS[i % APP_COLORS.length]
                              : "#94a3b8",
                        }}
                      ></div>
                      <span
                        className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[150px]"
                        title={app.name}
                      >
                        {app.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {formatDuration(app.duration)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${
                          (app.duration / dashboardData.stats.totalSeconds) *
                          100
                        }%`,
                        backgroundColor:
                          i < 5 ? APP_COLORS[i % APP_COLORS.length] : "#94a3b8",
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">
                No activity data.
              </p>
            )}
          </div>
        </div>

        {/* RIGHT: Donut Chart with Tooltip */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <h3 className="text-slate-700 dark:text-slate-200 font-medium text-sm mb-6 uppercase tracking-wide">
            Activity Breakdown
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-full min-h-[300px]">
            {/* Chart Area */}
            <div className="relative w-[240px] h-[240px] flex-shrink-0">
              {dashboardData.pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={3}
                        cornerRadius={4}
                        onMouseEnter={onPieEnter}
                        onMouseLeave={onPieLeave}
                      >
                        {dashboardData.pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            strokeWidth={0}
                            opacity={
                              hoveredSlice && hoveredSlice.name !== entry.name
                                ? 0.6
                                : 1
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* CUSTOM ABSOLUTE TOOLTIP */}
                  {hoveredSlice && (
                    <div
                      className="absolute z-50 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 pointer-events-none transition-all duration-75 ease-out"
                      style={{
                        left: calculateTooltipPos(hoveredSlice).x,
                        top: calculateTooltipPos(hoveredSlice).y,
                        transform: `translate(${
                          hoveredSlice.midAngle < 180 ? "10px" : "-110%"
                        }, -50%)`,
                        minWidth: "140px",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1 border-b border-slate-700 pb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: hoveredSlice.payload.color,
                          }}
                        ></div>
                        <span className="font-bold text-xs truncate max-w-[120px]">
                          {hoveredSlice.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-mono">
                          {formatDuration(hoveredSlice.value)}
                        </span>
                        <span className="font-bold text-emerald-400">
                          {(
                            (hoveredSlice.value / hoveredSlice.payload.total) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  No data
                </div>
              )}

              {/* Center Text */}
              {dashboardData.pieData.length > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                  <span className="text-2xl font-bold text-slate-800 dark:text-white">
                    {
                      formatDuration(dashboardData.stats.totalSeconds).split(
                        " "
                      )[0]
                    }
                  </span>
                  <span className="text-[10px] uppercase text-slate-400 tracking-wider">
                    Total Time
                  </span>
                </div>
              )}
            </div>

            {/* Side Legend */}
            <div className="flex-1 w-full max-w-sm">
              <div className="grid grid-cols-1 gap-3">
                {dashboardData.pieData.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded transition-all duration-200
                                ${
                                  hoveredSlice &&
                                  hoveredSlice.name === entry.name
                                    ? "bg-slate-100 dark:bg-slate-700 scale-[1.02]"
                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                }
                            `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span
                        className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px] sm:max-w-[150px]"
                        title={entry.name}
                      >
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 w-10 text-right">
                        {(
                          (entry.value / dashboardData.stats.totalSeconds) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="text-xs text-slate-500 font-mono w-16 text-right">
                        {formatDuration(entry.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeWorkStats;
