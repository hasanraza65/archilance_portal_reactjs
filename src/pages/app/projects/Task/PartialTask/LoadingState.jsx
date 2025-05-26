// src/components/TaskDetails/LoadingState.jsx
import React from "react";

const LoadingState = ({ message = "Loading task details..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  </div>
);

export default LoadingState;