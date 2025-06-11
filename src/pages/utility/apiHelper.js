// src/pages/utility/apiHelper.js
import Cookies from 'js-cookie';

/**
 * Reads the user's role from the cookie and returns the appropriate API path prefix.
 * It is designed to be secure by defaulting to the least privileged role.
 * @returns {string|null} Returns "admin", "employee", "customer", or null if the user is not logged in.
 */
export const getApiPrefix = () => {
  const userCookie = Cookies.get("user");

  // Step 1: If the user is not logged in, return null to prevent API calls.
  if (!userCookie) {
    return null; 
  }

  try {
    const user = JSON.parse(userCookie);
    const role = user?.role?.toLowerCase(); // Use toLowerCase() to make the check case-insensitive.

    // Step 2: Check for valid roles.
    if (['admin', 'employee', 'customer'].includes(role)) {
      return role;
    }

    // Step 3: If the role is unknown, default to the safest, least-privileged role.
    console.warn(`Unknown role found: '${user?.role}'. Defaulting to 'employee' access.`);
    return 'employee'; // Defaulting to 'employee' is much safer than 'admin'.

  } catch (e) {
    console.error("Error parsing user cookie:", e);
    // Step 4: In case of an error, also return the safest default.
    return 'employee';
  }
};