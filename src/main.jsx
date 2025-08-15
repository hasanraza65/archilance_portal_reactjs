
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

// CSS Imports
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/css/app.css";
import "react-toastify/dist/ReactToastify.css";


const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;
const UPDATE_FCM_TOKEN_URL = `${BACKEND_BASE_URL}/api/update-fcm-token`;


function getCookie(name) {
  const cookieString = document.cookie;
  const cookies = cookieString.split(';');
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

window.receiveFcmToken = async function (fcmTokenFromFlutter) {
  console.log("FCM Token received in main.jsx:", fcmTokenFromFlutter);

  if (!fcmTokenFromFlutter || typeof fcmTokenFromFlutter !== 'string') {
    console.error("Invalid FCM token received.");
    return;
  }

  const bearerToken = getCookie('token'); 

  if (!bearerToken) {
    console.error("Cannot update FCM token: Auth token cookie not found. User is not logged in.");
    alert("Cannot update notification token because you are not logged in.");
    return;
  }

  try {

    const apiBody = new FormData();
    apiBody.append('fcm_token', fcmTokenFromFlutter);
    console.log("Sending FCM token to backend with Bearer Token from cookie...");

    const response = await axios.post(
      UPDATE_FCM_TOKEN_URL,
      apiBody,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
        },
      }
    );

    console.log("Backend response:", response.data);
    alert("Notification token has been updated successfully!");

  } catch (error) {
    console.error("Failed to send FCM token to backend:", error);
    let errorMsg = "Failed to update notification token.";
    if (axios.isAxiosError(error) && error.response) {
      errorMsg = error.response.data.message || `Server Error: ${error.response.status}`;
    }
    alert(errorMsg);
  }
};
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </QueryClientProvider>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);