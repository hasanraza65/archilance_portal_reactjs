import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import store from "./store";
import { queryClient } from "./react-query/queryClient";
import axios from "axios";
import Cookies from "js-cookie"; // Step 1: Import js-cookie

import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/css/app.css";
import "react-toastify/dist/ReactToastify.css";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const UPDATE_FCM_TOKEN_URL = `${BACKEND_BASE_URL}/api/update-fcm-token`;

window.receiveFcmToken = async function (fcmTokenFromFlutter) {
  console.log("FCM Token received in main.jsx:", fcmTokenFromFlutter);

  if (!fcmTokenFromFlutter || typeof fcmTokenFromFlutter !== 'string') {
    console.error("Invalid FCM token received.");
    return;
  }

  // Store token in local storage
  localStorage.setItem("fcm_token", fcmTokenFromFlutter);

  console.log("FCM token saved to localStorage:", fcmTokenFromFlutter);
};

  const bearerToken = Cookies.get('token');

  // if (!bearerToken) {
  //   console.error("Cannot update FCM token: Auth token cookie 'token' not found. User is not logged in.");
  //   return;
  // }

  // try {
  //   const apiBody = new FormData();
  //   apiBody.append('fcm_token', fcmTokenFromFlutter);

  //   console.log("Sending FCM token to backend with Bearer Token from cookie...");

  //   const response = await axios.post(
  //     UPDATE_FCM_TOKEN_URL,
  //     apiBody,
  //     {
  //       headers: {
  //         'Authorization': `Bearer ${bearerToken}`,
  //       },
  //     }
  //   );

  //   console.log("Backend response after updating token:", response.data);
  //   // Behtar hai ke yahan alert ki jagah toast istemal karein, lekin yeh bhi theek hai
  //   alert("Notification token has been updated successfully!");

  // } catch (error) {
  //   console.error("Failed to send FCM token to backend:", error);
  //   let errorMsg = "Failed to update notification token.";
  //   if (axios.isAxiosError(error) && error.response) {
  //     errorMsg = error.response.data.message || `Server Error: ${error.response.status}`;
  //   }
  //   console.error(errorMsg);
  // }

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {/* Aapka AuthProvider pehle se hi sahi jagah par hai */}
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);