// src/components/TaskDetails/taskDetailsUtils.js

export const mapApiUserToLocal = (apiUser) => {
  if (!apiUser || typeof apiUser !== 'object') {
    console.warn("mapApiUserToLocal received invalid apiUser:", apiUser);
    return {
      id: null,
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
      email: null, // Added email here for completeness
    };
  }

  const id = apiUser.id || null;
  const name = apiUser.name || "Unknown User";
  const email = apiUser.email || null; // Capture email
  
  // Avatar: Multiple initials if name has spaces, otherwise first char.
  const avatarChar = (name && name !== "Unknown User" && name.length > 0) 
    ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
    : "U";

  let defaultColor = "bg-gray-500";
  if (name !== "Unknown User" && name.length > 0) {
    const colors = [
      "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", "bg-lime-500",
      "bg-green-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500", "bg-sky-500",
      "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
      "bg-pink-500", "bg-rose-500",
    ];
    const colorIndex = id ? ( (typeof id === 'string' ? id.charCodeAt(0) : id) % colors.length) : (name.length % colors.length);
    defaultColor = colors[colorIndex];
  }
  const color = apiUser.color || defaultColor;

  let profilePic = null;
  if (apiUser.profile_picture_url) {
    profilePic = apiUser.profile_picture_url;
  } else if (apiUser.profile_pic) {
    if (apiUser.profile_pic.startsWith('http://') || apiUser.profile_pic.startsWith('https://')) {
      profilePic = apiUser.profile_pic;
    } else {
      const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendBaseUrl) {
        const cleanBaseUrl = backendBaseUrl.replace(/\/$/, '');
        const cleanProfilePicPath = apiUser.profile_pic.replace(/^\//, '');
        profilePic = `${cleanBaseUrl}/storage/${cleanProfilePicPath}`;
      } else {
        console.warn("VITE_BACKEND_BASE_URL is not set. Profile picture URL for relative paths might be incorrect.");
        profilePic = `/storage/${apiUser.profile_pic.replace(/^\//, '')}`;
      }
    }
  }

  return {
    id,
    name,
    avatar: avatarChar,
    color,
    profilePic,
    email, // Return email
  };
};

// --- Other existing utility functions remain unchanged ---

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
  const option = statusUpdateOptions.find(opt => opt.apiValue.toLowerCase() === String(statusApiValue).toLowerCase());
  return option ? option.displayLabel : String(statusApiValue);
};

export const formatCommentTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};