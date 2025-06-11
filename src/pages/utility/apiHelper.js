// src/pages/utility/apiHelper.js
import Cookies from 'js-cookie';

/**
 * This function reads the user's role from the cookie and returns the appropriate API path prefix.
 * @returns {string} Returns "admin", "employee", or "customer" based on the user's role. Defaults to "admin" if the role is not found or an error occurs.
 */
export const getApiPrefix = () => {
  const userCookie = Cookies.get("user");

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      // Check if the role is one of the expected values
      if (['admin', 'employee', 'customer'].includes(user?.role)) {
        return user.role;
      }
    } catch (e) {
      console.error("Error parsing user cookie:", e);
    }
  }

  // Default to 'admin' if no role is found or an error occurs
  return 'admin';
};