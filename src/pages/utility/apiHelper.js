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
    
    return user?.employee_type; 
  } catch (e) {
    console.error("Error parsing user cookie for employee_type:", e);
    return null;
  }
};
export const canManageEmployees = () => {
  const role = getActualUserRole();
  const employeeType = getEmployeeType();

  if (role === 'admin') {
    return true;
  }

  if (employeeType?.toLowerCase() === 'manager') {
    return true;
  }

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