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

// Media URL helper — builds storage URLs from relative paths.
// Already-absolute URLs (OneDrive, CDN, etc.) are returned untouched.
export const getMediaUrl = (path) => {
  if (!path) return null;
  const str = String(path);
  if (str.startsWith('http://') || str.startsWith('https://')) return str;
  const cleanPath = str.replace(/^\/+/, '');
  return `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${cleanPath}`;
};
