// src/pages/utility/apiHelper.js
import Cookies from 'js-cookie';

// Sab roles jo aapki application mein hain
const VALID_ROLES = ['admin', 'employee', 'customer', 'member'];

/**
 * Ye function cookie se user ka asal role nikalta hai.
 */
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


/**
 * getApiPrefix() - API Calls Ke Liye
 * Ye function ab user ka asal role hi return karega.
 */
export const getApiPrefix = () => {
  const role = getActualUserRole();

  // ====================================================================
  // CHANGE: 'member' ko 'customer' banane wali logic hata di gayi hai.
  // Ab ye function 'member' ke liye 'member' hi return karega.
  // ====================================================================

  // Check karein ke role valid hai ya nahi
  if (VALID_ROLES.includes(role)) {
    return role; // 'member' ke liye 'member', 'customer' ke liye 'customer' etc. return hoga
  }

  // Agar role na ho ya na-maloom ho, to default set karein
  console.warn(`Unknown or missing role found: '${role}'. Defaulting to 'customer'.`);
  return 'customer';
};


/**
 * getUserRole() - User Interface (UI) Ke Liye
 * Ye function UI ke liye user ka ASAL role batata hai.
 */
export const getUserRole = () => {
  // Ye hamesha user ka asal role return karega.
  return getActualUserRole();
};