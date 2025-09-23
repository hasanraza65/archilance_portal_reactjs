import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const TimeLogSummary = ({ timeLogs }) => {
  const [totalTime, setTotalTime] = useState("0h 0m");

 useEffect(() => {
  const calculateTotalTime = (logs) => {
    // Filter out logs with null users or invalid data
    const validLogs = logs.filter(log => log && log.total_working_hours != null);
    
    const totalSeconds = validLogs.reduce(
      (acc, log) => acc + (log.total_working_hours || 0),
      0
    );
    if (totalSeconds === 0) return "0h 0m";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (timeLogs && timeLogs.length > 0) {
    setTotalTime(calculateTotalTime(timeLogs));
  } else {
    setTotalTime("0h 0m");
  }
}, [timeLogs]);
 const handleDetailsClick = (log) => {
  // Add null checks for log.user
  const userName = log.user?.name || "Unknown User";
  const userEmail = log.user?.email || "N/A";
  const userPhone = log.user?.phone || "N/A";
  const userRole = log.user?.employee_type || "N/A";

  Swal.fire({
    title: `Details for ${userName}`,
    html: `
      <div style="text-align: left; padding: 0 1rem;">
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Phone:</strong> ${userPhone}</p>
        <p><strong>Role:</strong> ${userRole}</p>
        <hr style="margin: 1rem 0;" />
        <p><strong>Time Spent on Task:</strong> ${
          log.total_working_hours_formatted || "N/A"
        }</p>
      </div>
    `,
    icon: "info",
    confirmButtonText: "Close",
  });
};

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">
        Total time worked: {totalTime}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-300 bg-slate-50">
              <th className="p-3 text-left font-semibold text-slate-600 border-r border-slate-300 last:border-r-0">
                Assignees
              </th>
              <th className="p-3 text-left font-semibold text-slate-600 border-r border-slate-300 last:border-r-0">
                Time Spent
              </th>
            </tr>
          </thead>
         <tbody>
  {timeLogs && timeLogs.length > 0 ? (
    timeLogs.map((log) => (
      <tr
        key={log.user?.id || `log-${log.id || Math.random()}`} // Fallback key
        className="border-b border-slate-300 last:border-0 hover:bg-slate-50"
      >
        <td className="p-3 align-top border-r border-slate-300 last:border-r-0">
          <div>
            <div className="font-semibold text-slate-800">
              {log.user?.name || "Unknown User"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {log.user?.email || "No email available"}
            </div>
          </div>
        </td>
        <td className="p-3 align-top text-slate-600 border-r border-slate-300 last:border-r-0">
          {log.total_working_hours_formatted || "N/A"}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="3" className="text-center text-slate-500 py-6">
        No time logs available for this task.
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default TimeLogSummary;
