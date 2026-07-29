// --- COLORS PALETTE ---
export const APP_COLORS = [
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
export const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// --- Date/time formatting shared between the on-screen session list and the
// exported PDF report ---
export const formatDateForAPI = (date) => {
  if (!date || !(date instanceof Date) || isNaN(date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date(0, 0, 0, h, m);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// Format a "YYYY-MM-DD" date into "Jun 22, 2026"
export const formatSessionDate = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// The start → end time portion shown at the front of the main line.
export const formatSessionTimeRange = (session) =>
  `${formatTime(session.start_time)} – ${formatTime(session.end_time)}`;

// The date shown at the END of the main line. A single date when the session
// stays within one day, or a "start – end" range when it crosses into another.
export const formatSessionEndDateLabel = (session) => {
  const startDate = formatSessionDate(session.start_date);
  const endDate = formatSessionDate(session.end_date);
  if (endDate && session.end_date !== session.start_date) {
    return `${startDate} – ${endDate}`;
  }
  return startDate;
};

export const formatScreenshotTime = (isoString) => {
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

// --- Helper to get raw seconds for Idle Time ---
export const getIdleSeconds = (startTime, endTime) => {
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
export const parseDurationString = (str) => {
  if (!str) return 0;
  let totalSeconds = 0;

  const hMatch = str.match(/(\d+)h/);
  if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;

  const mMatch = str.match(/(\d+)m/);
  if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;

  const sMatch = str.match(/(\d+)s/);
  if (sMatch) totalSeconds += parseInt(sMatch[1]);

  return totalSeconds;
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
export const determineCategory = (appName, windowTitle) => {
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

// --- Aggregate raw activity logs + totals into the same dashboard numbers shown
// on-screen (stats cards, Top Apps list, Activity Breakdown donut). Shared so the
// PDF export can reuse the exact same figures instead of recomputing them.
export const computeDashboardStats = (
  rootActivityList,
  totalIdleSeconds = 0,
  totalWorkSeconds = 0
) => {
  let appMap = {};
  let categoryStats = { Productive: 0, Social: 0, Neutral: 0, Idle: 0 };
  let totalActivitySeconds = 0;

  if (Array.isArray(rootActivityList)) {
    rootActivityList.forEach((activity) => {
      if (activity?.app_name && activity?.duration_seconds) {
        const dur = parseFloat(activity.duration_seconds);
        if (!isNaN(dur) && dur > 0) {
          const cleanAppName = activity.app_name.trim();
          const category = determineCategory(cleanAppName, activity.window_title);

          if (!appMap[cleanAppName]) {
            appMap[cleanAppName] = { duration: 0, category, count: 0 };
          }
          appMap[cleanAppName].duration += dur;
          appMap[cleanAppName].count += 1;

          if (categoryStats[category] !== undefined) categoryStats[category] += dur;
          totalActivitySeconds += dur;
        }
      }
    });
  }

  const grandTotal =
    totalWorkSeconds > 0 ? totalWorkSeconds : totalActivitySeconds + totalIdleSeconds;

  const sortedApps = Object.entries(appMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.duration - a.duration);

  const topAppsCount = 5;
  const topApps = sortedApps.slice(0, topAppsCount);
  const otherApps = sortedApps.slice(topAppsCount);
  const otherDuration = otherApps.reduce((acc, curr) => acc + curr.duration, 0);

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

  if (totalIdleSeconds > 0) {
    finalPieData.push({
      name: "Idle Time",
      value: totalIdleSeconds,
      total: grandTotal,
      category: "Idle",
      color: "#fbbf24",
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
    totalActivitySeconds > 0 ? categoryStats.Productive / totalActivitySeconds : 0;
  const productiveSeconds = Math.round(productiveRatio * grandTotal);
  const productivePercent = Math.round(productiveRatio * 100);

  return {
    pieData: finalPieData,
    aggregatedApps: sortedApps.slice(0, 10),
    stats: {
      totalSeconds: grandTotal,
      productiveSeconds,
      productivePercent,
      idleSeconds: totalIdleSeconds,
    },
  };
};
