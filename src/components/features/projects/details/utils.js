import { getApiPrefix, getMediaUrl } from "@/pages/utility/apiHelper";

export const getTodayDateRange = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return [today, today];
};

export const getWeekDateRange = (date = new Date()) => {
  const current = new Date(date);
  current.setHours(12, 0, 0, 0);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
  return [monday, sunday];
};

export const getLastWeekDateRange = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const lastWeekDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 7
  );
  return getWeekDateRange(lastWeekDate);
};

export const getCurrentMonthDateRange = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return [firstDay, lastDay];
};

export const getLastMonthDateRange = () => {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
  return [firstDay, lastDay];
};

export const PRESETS = [
  { label: "Today", func: getTodayDateRange },
  { label: "Current week", func: getWeekDateRange },
  { label: "Last week", func: getLastWeekDateRange },
  { label: "Current month", func: getCurrentMonthDateRange },
  { label: "Last month", func: getLastMonthDateRange },
];

export const mapApiAssigneeToLocal = (apiUser) => {
  if (!apiUser || typeof apiUser !== "object")
    return {
      id: null,
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
    };
  const user = apiUser.user || apiUser;
  const id = user.id || null;
  const name = user.name || "Unknown User";
  const avatarChar =
    name && name !== "Unknown User" && name.length > 0
      ? name.charAt(0).toUpperCase()
      : "U";
  let defaultColor = "bg-gray-500";
  if (name !== "Unknown User" && name.length > 0) {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500",
    ];
    const colorIndex = id
      ? (typeof id === "string" ? id.charCodeAt(0) : id) % colors.length
      : name.length % colors.length;
    defaultColor = colors[colorIndex];
  }
  const color = user.color || defaultColor;
  let profilePic = null;
  if (user.profile_picture_url) profilePic = user.profile_picture_url;
  else if (user.profile_pic) {
    profilePic = getMediaUrl(user.profile_pic);
  }
  return { id, name, avatar: avatarChar, color, profilePic };
};

export const getPriorityClass = (priority) => {
  if (!priority) return "text-gray-600";
  switch (String(priority).toLowerCase()) {
    case "high":
      return "text-red-600";
    case "urgent":
      return "text-orange-600 font-semibold";
    case "normal":
    case "medium":
      return "text-blue-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};

export const getAttachmentUrl = (filePath, createdAt = null) => {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (!backendBaseUrl || !filePath) return "#";
  const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
  const cleanFilePath = filePath.replace(/^\//, "");
  
  const cutoffDate = new Date("2026-01-10T00:00:00.000Z");
  const attachmentCreatedAt = createdAt ? new Date(createdAt) : null;
  
  if (attachmentCreatedAt && attachmentCreatedAt >= cutoffDate) {
    return `${cleanBaseUrl}/onedrive-image?path=${cleanFilePath}`;
  }
  
  return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};

export const getApiBasePathForRole = (basePath) => {
  const apiPrefix = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (apiPrefix) {
    return `/api/${apiPrefix}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

export const getStatusGradient = (status) => {
  const statusString = String(status || "unknown").toLowerCase();
  const statusGradients = {
    "on hold":
      "from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-900",
    backlog:
      "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900",
    "awaiting info":
      "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900",
    "in progress":
      "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900",
    "in-house review":
      "from-cyan-50 to-cyan-100 dark:from-cyan-800 dark:to-cyan-900",
    "client review":
      "from-indigo-50 to-indigo-100 dark:from-indigo-800 dark:to-indigo-900",
    completed:
      "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
    done: "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
  };

  return (
    statusGradients[statusString] ||
    "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
  );
};
