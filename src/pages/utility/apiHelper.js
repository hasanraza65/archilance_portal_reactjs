// src/pages/utility/apiHelper.js
import Cookies from 'js-cookie';
export const getApiPrefix = () => {
  const userCookie = Cookies.get("user");

  if (!userCookie) {
    return null; 
  }

  try {
    const user = JSON.parse(userCookie);
    const role = user?.role?.toLowerCase();
    if (['admin', 'employee', 'customer'].includes(role)) {
      return role;
    }
    console.warn(`Unknown role found: '${user?.role}'. Defaulting to 'employee' access for API path.`);
    return 'employee'; 

  } catch (e) {
    console.error("Error parsing user cookie:", e);
    return 'employee';
  }
};
export const getUserRole = () => {
  const userCookie = Cookies.get("user");
  if (!userCookie) {
    return null;
  }

  try {
    const user = JSON.parse(userCookie);
    const role = user?.role?.toLowerCase();

    if (['admin', 'employee', 'customer'].includes(role)) {
      return role;
    }
    console.warn(`Unknown role found: '${user?.role}'. Defaulting to 'customer' role for UI permissions.`);
    return 'customer';

  } catch (e) {
    console.error("Error parsing user cookie for role check:", e);
    return 'customer';
  }
};