// src/pages/utility/apiHelper.js
import Cookies from 'js-cookie';

// 1. Sab roles ko ek jagah define kar diya hai
const VALID_ROLES = ['admin', 'employee', 'customer', 'member'];

export const getApiPrefix = () => {
  const userCookie = Cookies.get("user");

  if (!userCookie) {
    return null; 
  }

  try {
    const user = JSON.parse(userCookie);
    const role = user?.role?.toLowerCase();

    // 2. Yahan "member" ko check kiya ja raha hai
    if (VALID_ROLES.includes(role)) {
      return role;
    }

    // Agar koi na-maloom role ho, to warning de kar default istemal karein
    console.warn(`Unknown role found: '${user?.role}'. Defaulting to 'employee' access for API path.`);
    return 'employee'; 

  } catch (e) {
    console.error("Error parsing user cookie:", e);
    return 'employee'; // Error ki soorat mein default
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

    // 3. Yahan bhi "member" ko check kiya ja raha hai
    if (VALID_ROLES.includes(role)) {
      return role;
    }
    
    // Agar koi na-maloom role ho, to warning de kar default istemal karein
    console.warn(`Unknown role found: '${user?.role}'. Defaulting to 'customer' role for UI permissions.`);
    return 'customer';

  } catch (e) {
    console.error("Error parsing user cookie for role check:", e);
    return 'customer'; // Error ki soorat mein default
  }
};