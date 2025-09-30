import axios from "axios";
import Cookies from "js-cookie";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const API_BASE_URL = `${BACKEND_BASE_URL}/api`;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Agar response theek hai to usay aage bhej dein
    return response;
  },
  (error) => {
    // Agar error hai to check karein
    if (error.response && error.response.status === 401) {
      // 401 Unauthorized error milne par
      // Token cookie ko delete karein
      Cookies.remove("token");

      // User ko login page par redirect karein
      // 'window.location.href' ka istemal yahan behtar hai kyun ke
      // hum React component ke bahar hain.
      window.location.href = "/login";
    }

    // Baaki sab errors ko aage bhej dein
    return Promise.reject(error);
  }
);

export default axiosInstance;