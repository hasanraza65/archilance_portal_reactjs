import Cookies from "js-cookie";

const getActualUserRole = () => {
  const userCookie = Cookies.get("user");
  if (!userCookie) {
    return null;
  }
  try {
    const user = JSON.parse(userCookie);
    return user?.role?.toLowerCase();
  } catch (e) {
    console.error("Error parsing user cookie:", e);
    return null;
  }
};

export const getEmployeeType = () => {
  const userCookie = Cookies.get("user");
  if (!userCookie) {
    return null;
  }
  try {
    const user = JSON.parse(userCookie);
    return user?.employee_type;
  } catch (e) {
    console.error("Error parsing user cookie for employee_type:", e);
    return null;
  }
};

// --- UPDATED CODE ---
export const canManageEmployees = () => {
  const role = getActualUserRole();

  if (role === "admin") {
    return true;
  }

  // Grant permission to Manager, Supervisor, and Executive
  if (role === "manager" || role === "supervisor" || role === "executive") {
    return true;
  }

  return false;
};

export const getApiPrefix = () => {
  const role = getActualUserRole();

  switch (role) {
    case "manager":
    case "outsource":
    case "employee":
    case "supervisor":
    case "executive": // Add executive here
      return "employee";

    case "admin":
      return "admin";
    case "customer":
      return "customer";
    case "member":
      return "member";

    default:
      console.warn(
        `Unknown or missing role found: '${role}'. Defaulting to 'customer'.`
      );
      return "customer";
  }
};
// --- END OF UPDATE ---

export const getUserRole = () => {
  return getActualUserRole();
};

export const getApiBasePathForRole = (basePath) => {
  const prefix = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;

  return `/api/${prefix}${cleanBasePath}`;
};

// Media URL helper — routes files to old or new base URL based on upload date.
// Files uploaded before June 14 2026 live under the old backend path; newer files under VITE_BACKEND_BASE_URL.
// OneDrive / already-absolute URLs are returned untouched.
const MEDIA_CUTOFF = new Date('2026-06-14T00:00:00Z');
const OLD_STORAGE_BASE = 'http://portal.archilance.net/backend';

export const getMediaUrl = (path, createdAt = null) => {
  if (!path) return null;
  const str = String(path);
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  const cleanPath = str.replace(/^\/+/, '');
  const base =
    createdAt && new Date(createdAt) >= MEDIA_CUTOFF
      ? import.meta.env.VITE_BACKEND_BASE_URL
      : OLD_STORAGE_BASE;
  return `${base}/storage/${cleanPath}`;
};
