import Cookies from 'js-cookie';

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
  
  if (role === 'admin') {
    return true;
  }

  // --- UPDATED CODE ---
  // Added 'supervisor' to allow management permissions.
  if (role === 'manager' || role === 'supervisor') {
    return true;
  }
  // --- END OF UPDATE ---

  return false;
};

export const getApiPrefix = () => {
  const role = getActualUserRole();

  switch (role) {
    case 'manager':
    case 'outsource':
    case 'employee':
      return 'employee';

    case 'admin':
      return 'admin';
    case 'customer':
      return 'customer';
    case 'member':
      return 'member';
      
    // --- UPDATED CODE ---
    // Added 'supervisor' to use the 'employee' API prefix.
    case 'supervisor':
      return 'employee';
    // --- END OF UPDATE ---

    default:
      console.warn(`Unknown or missing role found: '${role}'. Defaulting to 'customer'.`);
      return 'customer';
  }
};


export const getUserRole = () => {
  return getActualUserRole();
};