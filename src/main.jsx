import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";

// Hamara AuthProvider import karein (path check kar lein)
import { AuthProvider } from "./context/AuthContext";

// Aapke baaqi imports
import store from "./store";
import { queryClient } from "./react-query/queryClient"; // Aap alag file se client import kar rahe hain, jo bilkul theek hai
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/css/app.css";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Provider ki nesting ko theek kiya gaya hai
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