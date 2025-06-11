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
import { queryClient } from "./react-query/queryClient";
import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../src/assets/css/app.css";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode> ka istemal development mein behtar hai
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider ko yahan wrap karein */}
      <AuthProvider>
        {/* Redux Provider iske andar */}
        <Provider store={store}>
          {/* React Query Provider iske andar */}
          <QueryClientProvider client={queryClient}>
            {/* Aakhir mein App Component */}
            <App />
          </QueryClientProvider>
        </Provider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);