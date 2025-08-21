// src/components/TaskDetails/taskDetailsUtils.js

export const mapApiUserToLocal = (apiUser) => {
  if (!apiUser || typeof apiUser !== "object") {
    console.warn("mapApiUserToLocal received invalid apiUser:", apiUser);
    return {
      id: null,
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
      email: null,
    };
  }

  const id = apiUser.id || null;
  const name = apiUser.name || "Unknown User";
  const email = apiUser.email || null;

  const avatarChar =
    name && name !== "Unknown User" && name.length > 0
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase()
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
  const color = apiUser.color || defaultColor;

  let profilePic = null;
  if (apiUser.profile_picture_url) {
    profilePic = apiUser.profile_picture_url;
  } else if (apiUser.profile_pic) {
    if (
      apiUser.profile_pic.startsWith("http://") ||
      apiUser.profile_pic.startsWith("https://")
    ) {
      profilePic = apiUser.profile_pic;
    } else {
      const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendBaseUrl) {
        const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
        const cleanProfilePicPath = apiUser.profile_pic.replace(/^\//, "");
        profilePic = `${cleanBaseUrl}/storage/${cleanProfilePicPath}`;
      } else {
        console.warn(
          "VITE_BACKEND_BASE_URL is not set. Profile picture URL for relative paths might be incorrect."
        );
        profilePic = `/storage/${apiUser.profile_pic.replace(/^\//, "")}`;
      }
    }
  }

  return {
    id,
    name,
    avatar: avatarChar,
    color,
    profilePic,
    email,
  };
};

// ***** SUDHAAR: Naye status ke hisab se styling update ki gayi hai *****
export const getStatusClass = (status) => {
  const s = status === null ? "todo" : String(status).toLowerCase();

  switch (s) {
    case "todo":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "backlog":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "awaiting info":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "in progress":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "in-house review":
      return "bg-purple-100 text-purple-800 border-purple-300";
    case "client review":
      return "bg-pink-100 text-pink-800 border-pink-300";
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    default:
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
};

// ***** SUDHAAR: Naye status ke hisab se dropdown indicator color update kiya gaya hai *****
export const getStatusSelectedBarColor = (status) => {
  const s = status === null ? "todo" : String(status).toLowerCase();
  switch (s) {
    case "todo":
      return "bg-slate-500";
    case "backlog":
      return "bg-gray-500";
    case "awaiting info":
      return "bg-amber-500";
    case "in progress":
      return "bg-blue-500";
    case "in-house review":
      return "bg-purple-500";
    case "client review":
      return "bg-pink-500";
    case "completed":
      return "bg-emerald-500";
    default:
      return "bg-gray-500";
  }
};

export const priorityUpdateOptions = [
  {
    apiValue: "Low",
    displayLabel: "Low",
    icon: "🟢",
    colorClass: "text-emerald-600",
  },
  {
    apiValue: "Normal",
    displayLabel: "Normal",
    icon: "🟡",
    colorClass: "text-blue-600",
  },
  {
    apiValue: "High",
    displayLabel: "High",
    icon: "🔴",
    colorClass: "text-red-600",
  },
  {
    apiValue: "Urgent",
    displayLabel: "Urgent",
    icon: "⚠️",
    colorClass: "text-orange-600 font-semibold",
  },
];

export const getCurrentPriorityDetails = (priorityValue) => {
  if (!priorityValue)
    return { displayLabel: "Not Set", icon: "○", colorClass: "text-slate-500" };
  const found = priorityUpdateOptions.find(
    (p) => p.apiValue.toLowerCase() === String(priorityValue).toLowerCase()
  );
  if (found) return found;
  return {
    displayLabel: String(priorityValue),
    icon: "○",
    colorClass: "text-slate-500",
  };
};

// ***** SUDHAAR: Status options ko naye workflow ke hisab se update kiya gaya hai *****
export const statusUpdateOptions = [
  { apiValue: "Backlog", displayLabel: "Backlog" },
  { apiValue: "Awaiting Info", displayLabel: "Awaiting Info" },
  { apiValue: "In Progress", displayLabel: "In Progress" },
  { apiValue: "In-house review", displayLabel: "In-house review" },
  { apiValue: "Client Review", displayLabel: "Client Review" },
  { apiValue: "Completed", displayLabel: "Completed" },
];

export const getCurrentStatusDisplayLabel = (statusApiValue) => {
  if (!statusApiValue) return "To-Do";
  // The special `null` status in the header component isn't listed in the options, so we handle it first.
  if (statusApiValue === "Todo") return "To-Do";

  const option = statusUpdateOptions.find(
    (opt) => opt.apiValue.toLowerCase() === String(statusApiValue).toLowerCase()
  );
  return option ? option.displayLabel : String(statusApiValue);
};

export const formatCommentTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
