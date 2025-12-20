import React from "react";

const StatusBadge = ({ status }) => {
    const statusString = String(status || "unknown").toLowerCase();
    const statusColors = {
        backlog:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        "on hold":
            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        "awaiting info":
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        "in progress":
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        "in-house review":
            "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
        "client review":
            "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
        completed:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    const defaultColor =
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

    return (
        <span
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[statusString] || defaultColor
                }`}
        >
            {status || "Unknown"}
        </span>
    );
};

export default StatusBadge;
