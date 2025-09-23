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
  } catch (e)
  {
    console.error("Error parsing user cookie for employee_type:", e);
    return null;
  }
};

export const canManageEmployees = () => {
  const role = getActualUserRole();

  if (role === "admin") {
    return true;
  }

  if (role === "manager" || role === "supervisor") {
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

export const getUserRole = () => {
  return getActualUserRole();
};
export const getApiBasePathForRole = (basePath) => {
  const prefix = getApiPrefix(); 
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  
  return `/api/${prefix}${cleanBasePath}`;
};