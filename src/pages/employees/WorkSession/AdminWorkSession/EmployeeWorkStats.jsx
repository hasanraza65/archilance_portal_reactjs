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
// Classifies each tracked window/app as "Productive", "Social" (non-productive:
// entertainment / streaming / gaming) or "Neutral" (unknown — neither rewarded nor
// penalised). Matching is a case-insensitive substring test against BOTH the app name
// and the window title, so browser tabs are classified by the SITE in their title
// (e.g. "... - Matterport - Google Chrome" counts as productive).
//
// Tuned for an architecture / design studio: CAD, BIM, rendering, PDF markup, Adobe,
// site-analysis and the web tools the team actually works in. Non-productive apps are
// checked FIRST, so streaming/gaming can never be counted as productive even if the
// page title happens to contain a work word.
//
// YouTube is deliberately in NEITHER list: a "Revit tutorial - YouTube" tab is caught
// as productive by the keywords below, while a generic YouTube video falls through to
// "Neutral" — we can't tell a tutorial from entertainment, so we neither count it as
// productive nor punish it.
const determineCategory = (appName, windowTitle) => {
  if (!appName) return "Neutral";
  const name = appName.toLowerCase();
  const title = windowTitle ? windowTitle.toLowerCase() : "";
  const haystack = `${name} ${title}`;
  const matches = (list) => list.some((k) => haystack.includes(k));

  // 1) Clearly NON-productive — streaming, social, gaming. Checked first.
  const nonProductiveKeywords = [
    // social
    "facebook", "instagram", "tiktok", "twitter", "x.com", "reddit", "snapchat", "9gag",
    // streaming / music / OTT
    "netflix", "prime video", "hulu", "disney+", "hotstar", "hbo", "twitch",
    "spotify", "soundcloud", "apple music", "gaana", "jiosaavn",
    // chat not used for work here
    "discord",
    // gaming
    "steam", "epic games", "valorant", "league of legends", "dota",
    "counter-strike", "call of duty", "minecraft", "roblox", "fortnite", "pubg",
  ];
  if (matches(nonProductiveKeywords)) return "Social";

  // 2) Productive — desktop tools AND the web apps/sites the studio works in.
  const productiveKeywords = [
    // Communication & collaboration
    "slack", "microsoft teams", "teams", "zoom", "google meet", "meet",
    "webex", "skype", "whatsapp", "google chat",
    // Email
    "outlook", "gmail", "thunderbird", "webmail", "roundcube", "zoho mail", "proton mail",
    // Docs / project management / storage
    "notion", "trello", "asana", "jira", "clickup", "monday.com",
    "confluence", "miro", "figjam", "loom", "archilance",
    "google docs", "google sheets", "google slides", "google drive", "dropbox",
    // Microsoft Office
    "excel", "word", "powerpoint", "onenote", "visio", "sharepoint",
    "onedrive", "microsoft office", "office 365", "microsoft 365",
    // Architecture / CAD / BIM
    "autocad", "revit", "archicad", "sketchup", "sketch up", "3ds max", "3dsmax",
    "rhino", "rhinoceros", "grasshopper", "vectorworks", "civil 3d",
    "navisworks", "autodesk", "recap", "infraworks", "formit", "microstation",
    "allplan", "chief architect", "solidworks", "fusion 360", "inventor",
    // Rendering / visualisation
    "lumion", "d5 render", "d5render", "enscape", "twinmotion", "v-ray", "vray",
    "corona render", "keyshot", "blender", "cinema 4d", "c4d",
    // PDF / markup / documents
    "bluebeam", "revu", "pdf", "acrobat", "adobe reader", "foxit", "nitro pro", "sumatra",
    // Adobe creative
    "adobe", "photoshop", "illustrator", "indesign", "lightroom",
    "after effects", "premiere", "adobe xd",
    // Design / boards
    "figma", "canva", "invision",
    // Site analysis / scanning / measurement (mostly web)
    "matterport", "docusketch", "cubicasa", "magicplan", "regrid",
    "google earth", "google maps", "mapbox", "arcgis", "qgis",
    // Work / hiring platforms
    "upwork", "fiverr", "freelancer",
    // AI assistants
    "chatgpt", "openai", "claude", "ai studio", "gemini", "copilot", "perplexity",
    // Learning (tutorials / courses count as productive)
    "tutorial", "how to", "training", "webinar", "lecture",
    "udemy", "coursera", "skillshare", "pluralsight", "khan academy", "linkedin learning",
    // Dev tools (internal tech team)
    "visual studio", "vs code", "vscode", "pycharm", "intellij", "android studio",
    "sublime text", "github", "gitlab", "bitbucket", "gitkraken", "sourcetree",
    "docker", "postman",
  ];
  if (matches(productiveKeywords)) return "Productive";

  // 3) A browser with no recognised site → Neutral, unless the title clearly points at
  //    an internal work tool.
  const isBrowser = ["chrome", "edge", "firefox", "brave", "opera", "safari"].some(
    (b) => name.includes(b)
  );
  if (isBrowser) {
    const workHints = ["admin", "crm", "archilance", "docs", "dashboard", "portal"];
    if (workHints.some((k) => title.includes(k))) return "Productive";
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
  totalWorkSeconds = 0,
  totalManualSeconds = 0,
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
    const grandTotal = totalWorkSeconds > 0 ? totalWorkSeconds : (totalActivitySeconds + totalIdleSeconds);

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

    // "Productive" and "Total" come from two INDEPENDENT measurement systems: the
    // productive number is a sum of app-usage buckets from activity_logs (which
    // over-counts and still includes idle time), while grandTotal is the trustworthy
    // worked time (session duration minus idle). Summing the raw buckets can therefore
    // EXCEED the worked time and push productivity past 100%. So we don't use the raw
    // bucket seconds directly — we treat them as a PROPORTION (the share of tracked app
    // time that was spent in productive apps) and apply that share to the worked time.
    // This is always bounded: productive <= worked, and productivity <= 100%.
    const productiveRatio =
      totalActivitySeconds > 0
        ? categoryStats.Productive / totalActivitySeconds
        : 0;
    const productiveSeconds = Math.round(productiveRatio * grandTotal);
    const productivePercent = Math.round(productiveRatio * 100);

    return {
      pieData: finalPieData,
      aggregatedApps: sortedApps.slice(0, 10),
      stats: {
        totalSeconds: grandTotal,
        productiveSeconds: productiveSeconds,
        productivePercent: productivePercent,
        idleSeconds: totalIdleSeconds, // <--- Using the Prop Here directly
      },
    };
  }, [sessions, rootActivityList, totalIdleSeconds, totalWorkSeconds]);

  return (
    <div className="font-sans">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
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
            {dashboardData.stats.productivePercent}%
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm border border-slate-100 dark:border-slate-700">
          <p className="text-xs text-sky-500 dark:text-sky-400 mb-1 font-semibold uppercase tracking-wider">
            Manual Time
          </p>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatDuration(totalManualSeconds)}
          </h2>
        </div>
      </div>

      {/* Charts Grid — Top Apps & Activity Breakdown */}
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
