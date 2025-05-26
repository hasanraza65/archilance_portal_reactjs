// src/components/TaskDetails/taskDetailsUtils.js
export const mapApiUserToLocal = (apiUser, type = "assignee") => {
  if (!apiUser || typeof apiUser !== "object") {
    return {
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
    };
  }
  const name = apiUser.name || "Unknown";
  const avatarChar = name.charAt(0).toUpperCase() || "U";
  let color = "bg-gray-500";
  if (name !== "Unknown") {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    color = colors[name.length % colors.length];
  }
  const profilePic = apiUser.profile_pic
    ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${apiUser.profile_pic}`
    : null;
  return {
    name,
    avatar: avatarChar,
    color: apiUser.color || color,
    profilePic,
  };
};

export const getStatusClass = (status) => {
  if (
    !status ||
    String(status).toLowerCase() === "todo" ||
    String(status).toLowerCase() === "to do" ||
    String(status).toLowerCase() === "open"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "pending":
    case "doing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "completed":
    case "done":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "waiting":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return `bg-purple-50 text-purple-700 border-purple-200`;
  }
};

export const getStatusSelectedBarColor = (status) => {
  if (!status || String(status).toLowerCase() === "todo") return "bg-amber-500";
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "doing":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    case "waiting":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

export const priorityUpdateOptions = [
  { apiValue: "Low", displayLabel: "Low", icon: "🟢", colorClass: "text-emerald-600" },
  { apiValue: "Normal", displayLabel: "Normal", icon: "🟡", colorClass: "text-blue-600" },
  { apiValue: "High", displayLabel: "High", icon: "🔴", colorClass: "text-red-600" },
  { apiValue: "Urgent", displayLabel: "Urgent", icon: "⚠️", colorClass: "text-orange-600 font-semibold" },
];

export const getCurrentPriorityDetails = (priorityValue) => {
  if (!priorityValue) return { displayLabel: "Not Set", icon: "○", colorClass: "text-slate-500" };
  const found = priorityUpdateOptions.find(p => p.apiValue.toLowerCase() === String(priorityValue).toLowerCase());
  if (found) return found;
  return { displayLabel: String(priorityValue), icon: "○", colorClass: "text-slate-500" };
};

export const statusUpdateOptions = [
  { apiValue: "Todo", displayLabel: "To-Do" },
  { apiValue: "In Progress", displayLabel: "In Progress" },
  { apiValue: "Completed", displayLabel: "Completed" },
];

export const getCurrentStatusDisplayLabel = (statusApiValue) => {
  if (!statusApiValue) return "To-Do";
  const option = statusUpdateOptions.find(opt => opt.apiValue === statusApiValue);
  return option ? option.displayLabel : String(statusApiValue);
};

export const formatCommentTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};