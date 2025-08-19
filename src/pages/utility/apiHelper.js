import Cookies from 'js-cookie';

const VALID_ROLES = ['admin', 'employee', 'customer', 'member'];

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
    // This will return "Manager", "Employee", or null
    return user?.employee_type; 
  } catch (e) {
    console.error("Error parsing user cookie for employee_type:", e);
    return null;
  }
};

/**
 * YEH NAYA AUR SABSE IMPORTANT FUNCTION HAI
 * Checks if the current user has permissions to manage other employees.
 * A user is considered a manager if their role is 'admin' OR their employee_type is 'Manager'.
 * This function is case-insensitive for the employee_type check.
 * @returns {boolean} - Returns true if the user has management permissions, otherwise false.
 */
export const canManageEmployees = () => {
  const role = getActualUserRole();
  const employeeType = getEmployeeType();

  // Condition 1: If the user's role is 'admin', they always have access.
  if (role === 'admin') {
    return true;
  }

  // Condition 2: If the user's employee_type is 'Manager', they also have access.
  // We use .toLowerCase() to avoid case-sensitivity issues (e.g., "Manager" vs "manager").
  // The `?.` prevents an error if employeeType is null or undefined.
  if (employeeType?.toLowerCase() === 'manager') {
    return true;
  }

  // If neither of the above conditions are met, the user does not have access.
  return false;
};

export const getApiPrefix = () => {
  const role = getActualUserRole();
  if (VALID_ROLES.includes(role)) {
    return role;
  }
  console.warn(`Unknown or missing role found: '${role}'. Defaulting to 'customer'.`);
  return 'customer';
};

export const getUserRole = () => {
  return getActualUserRole();
};