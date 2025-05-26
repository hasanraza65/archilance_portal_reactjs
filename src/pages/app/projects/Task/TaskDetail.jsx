// src/pages/TaskDetailsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import AddSubTaskModal from "./SubTaskDetail"; // Adjust path if necessary

// Helper functions
const mapApiUserToLocal = (apiUser, type = "assignee") => {
  if (!apiUser || typeof apiUser !== "object") {
    return {
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
    };
  }
  const name = apiUser.name || "Unknown";
  const avatarChar = name.charAt(0).toUpperCase() || "U";
  let color = "bg-gray-500";
  if (name !== "Unknown") {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
    ];
    color = colors[name.length % colors.length];
  }
  const profilePic = apiUser.profile_pic
    ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${apiUser.profile_pic}`
    : null;
  return {
    name,
    avatar: avatarChar,
    color: apiUser.color || color,
    profilePic,
  };
};

const getStatusClass = (status) => {
  if (
    !status ||
    String(status).toLowerCase() === "todo" ||
    String(status).toLowerCase() === "to do" ||
    String(status).toLowerCase() === "open"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200"; // Default to "Todo" style if null or "Todo"
  }
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "pending":
    case "doing":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "completed":
    case "done":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "waiting":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    default:
      return `bg-purple-50 text-purple-700 border-purple-200`; // Fallback for unknown values
  }
};
// For the colored bar in the status dropdown, similar to priority
const getStatusSelectedBarColor = (status) => {
  if (!status || String(status).toLowerCase() === "todo") return "bg-amber-500"; // Default bar for "Todo" or null
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "doing":
      return "bg-blue-500";
    case "completed":
      return "bg-green-500";
    case "waiting":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

const priorityUpdateOptions = [
  {
    apiValue: "Low",
    displayLabel: "Low",
    icon: "🟢",
    colorClass: "text-emerald-600",
  },
  {
    apiValue: "Normal",
    displayLabel: "Normal",
    icon: "🟡",
    colorClass: "text-blue-600",
  },
  {
    apiValue: "High",
    displayLabel: "High",
    icon: "🔴",
    colorClass: "text-red-600",
  },
  {
    apiValue: "Urgent",
    displayLabel: "Urgent",
    icon: "⚠️",
    colorClass: "text-orange-600 font-semibold",
  },
];
const getCurrentPriorityDetails = (priorityValue) => {
  if (!priorityValue)
    return { displayLabel: "Not Set", icon: "○", colorClass: "text-slate-500" };
  const found = priorityUpdateOptions.find(
    (p) => p.apiValue.toLowerCase() === String(priorityValue).toLowerCase()
  );
  if (found) return found;
  return {
    displayLabel: String(priorityValue),
    icon: "○",
    colorClass: "text-slate-500",
  };
};

// Status options for the new dropdown
const statusUpdateOptions = [
  { apiValue: "Todo", displayLabel: "To-Do" },
  { apiValue: "In Progress", displayLabel: "In Progress" },
  { apiValue: "Completed", displayLabel: "Completed" },
];
// Helper to get current status display label
const getCurrentStatusDisplayLabel = (statusApiValue) => {
  if (!statusApiValue) return "To-Do"; // Default to "To-Do" display if null
  const option = statusUpdateOptions.find(
    (opt) => opt.apiValue === statusApiValue
  );
  return option ? option.displayLabel : String(statusApiValue); // Fallback to API value if not in options
};

const formatCommentTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false); // State for status dropdown
  const statusDropdownRef = useRef(null); // Ref for status dropdown

  const fetchTaskData = async (showLoadingSpinner = true) => {
    if (!taskId) {
      setError("Task ID is missing from URL.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      return;
    }
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    setFieldUpdateError(null);
    setTaskFound(true);

    const token = Cookies.get("token");
    if (!token) {
      setError("Authorization token not found. Please log in.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/admin/project-task/${taskId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          setTaskFound(false);
          setError(`Task with ID ${taskId} not found.`);
        } else {
          const eData = await response.json().catch(() => ({}));
          setError(
            `Error ${response.status}: ${eData.message || response.statusText}`
          );
          setTaskFound(false);
        }
        if (showLoadingSpinner) setLoading(false);
        return;
      }
      const data = await response.json();
      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        setComments(data.comments || []);
        setTaskFound(true);
      } else {
        setError("Invalid task data received from API.");
        setTaskFound(false);
      }
    } catch (err) {
      console.error("Fetch task error:", err);
      setError(
        err.message || "An unknown error occurred while fetching task details."
      );
      setTaskFound(false);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [taskId, navigate]);

  useEffect(() => {
    // For Priority Dropdown
    function handleClickOutside(event) {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setIsStatusDropdownOpen(false);
      }
    }
    if (isPriorityDropdownOpen || isStatusDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPriorityDropdownOpen, isStatusDropdownOpen]);

  const handleUpdateTaskField = async (fieldName, value) => {
    if (!parentTaskDetails) return;
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found. Please log in again.");
      setFieldUpdateError(
        "Authorization token not found. Please log in again."
      );
      return;
    }
    setFieldUpdateError(null);
    const originalValue = parentTaskDetails[fieldName];
    setParentTaskDetails((prevDetails) => ({
      ...prevDetails,
      [fieldName]: value,
    }));

    try {
      const payload = { [fieldName]: value };
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${
          parentTaskDetails.id
        }`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json();
      console.log(
        `API Update Response for ${fieldName} (new value: '${value}'):`,
        responseData
      );

      if (!response.ok) {
        setParentTaskDetails((prevDetails) => ({
          ...prevDetails,
          [fieldName]: originalValue,
        }));
        toast.error(responseData.message || `Failed to update ${fieldName}`);
        throw new Error(
          responseData.message ||
            `Failed to update ${fieldName} (status ${response.status})`
        );
      }

      if (
        responseData &&
        responseData.task &&
        responseData.task.hasOwnProperty(fieldName)
      ) {
        setParentTaskDetails((prevDetails) => ({
          ...prevDetails,
          [fieldName]: responseData.task[fieldName],
        }));
        const friendlyFieldName = fieldName.replace(/_/g, " ");
        toast.success(
          `${
            friendlyFieldName.charAt(0).toUpperCase() +
            friendlyFieldName.slice(1)
          } updated!`
        );
      } else if (responseData && responseData.message && response.ok) {
        const friendlyFieldName = fieldName.replace(/_/g, " ");
        toast.success(
          `${
            friendlyFieldName.charAt(0).toUpperCase() +
            friendlyFieldName.slice(1)
          } updated (confirmed by server)!`
        );
      } else {
        toast.warn(
          "Update may have succeeded, but API response format was unexpected. Local value kept. Refresh if needed."
        );
      }
    } catch (err) {
      console.error(`Error updating ${fieldName}:`, err);
      setParentTaskDetails((prevDetails) => ({
        ...prevDetails,
        [fieldName]: originalValue,
      }));
      if (!err.message.includes("Failed to update")) {
        toast.error(`Error updating ${fieldName}: ${err.message}`);
      }
      setFieldUpdateError(`Failed to update ${fieldName}: ${err.message}`);
    }
  };

  const handleOpenAddSubTaskModal = () => setIsAddSubTaskModalOpen(true);
  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = () => {
    fetchTaskData(false);
  };
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = Cookies.get("token");
    const commentPayload = {
      task_id: parseInt(taskId),
      comment_message: newComment,
    };
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/comments`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(commentPayload),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `Failed to post comment (status ${response.status})`
        );
      }
      setNewComment("");
      toast.success("Comment posted!");
      fetchTaskData(false);
    } catch (err) {
      console.error("Error posting comment:", err);
      setCommentError(err.message);
      toast.error(`Failed to post comment: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 font-medium">Loading task details...</p>
        </div>
      </div>
    );
  if (error || !taskFound || !parentTaskDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {taskFound ? "Error Loading Task" : "Task Not Found"}
            </h2>
            <p className="text-slate-600">
              {error ||
                `The task with ID ${taskId} could not be found or the data is invalid.`}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const parentAssignee =
    parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0
      ? mapApiUserToLocal(parentTaskDetails.assignees[0].user)
      : null;
  const currentPriorityDisplay = getCurrentPriorityDetails(
    parentTaskDetails.priority
  );
  const currentStatusLabel = getCurrentStatusDisplayLabel(
    parentTaskDetails.task_status
  );
  const currentStatusForNull =
    parentTaskDetails.task_status === null
      ? "Todo"
      : parentTaskDetails.task_status; // Handles null for comparison

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="container mx-auto px-4 py-6">
        {fieldUpdateError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm shadow">
            <strong>Update Issue:</strong> {fieldUpdateError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="bg-gradient-to-r from-blue-200 to-indigo-300 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2 text-white">
                      {parentTaskDetails.task_title}
                    </h1>
                    <button
                      onClick={() =>
                        navigate(`/project/${parentTaskDetails.project_id}`)
                      }
                      className="inline-flex items-center text-indigo-100 hover:text-white text-sm transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Project #{parentTaskDetails.project_id}
                    </button>
                  </div>
                  {/* --- Editable Status Dropdown --- */}
                  <div className="relative" ref={statusDropdownRef}>
                    <button
                      onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 flex items-center
                                    ${getStatusClass(
                                      parentTaskDetails.task_status
                                    )}`} // Uses current status for styling
                      aria-haspopup="true"
                      aria-expanded={isStatusDropdownOpen}
                    >
                      {currentStatusLabel.toUpperCase()}
                      <svg
                        className={`w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transform transition-transform duration-200 ${
                          isStatusDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl z-30 border border-slate-200 overflow-y-auto max-h-60 py-1">
                        <button
                          onClick={async () => {
                            await handleUpdateTaskField("task_status", null);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center relative ${
                            parentTaskDetails.task_status === null
                              ? "font-semibold text-blue-600"
                              : "text-slate-700"
                          }`}
                        >
                          {parentTaskDetails.task_status === null && (
                            <span
                              className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(
                                null
                              )}`}
                            ></span>
                          )}
                          {parentTaskDetails.task_status === null ? (
                            <svg
                              className="w-4 h-4 mr-2.5 text-blue-600 shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="w-4 h-4 mr-2.5 shrink-0"></span>
                          )}
                          <span className="italic text-slate-500">
                            — Default (To-Do) —
                          </span>
                        </button>
                        <div className="border-t border-slate-100 my-1 mx-1"></div>
                        {statusUpdateOptions.map((option) => (
                          <button
                            key={option.apiValue}
                            onClick={async () => {
                              await handleUpdateTaskField(
                                "task_status",
                                option.apiValue
                              );
                              setIsStatusDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center relative ${
                              currentStatusForNull === option.apiValue
                                ? "font-semibold text-blue-600"
                                : "text-slate-700"
                            }`}
                          >
                            {currentStatusForNull === option.apiValue && (
                              <span
                                className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusSelectedBarColor(
                                  option.apiValue
                                )}`}
                              ></span>
                            )}
                            {currentStatusForNull === option.apiValue ? (
                              <svg
                                className="w-4 h-4 mr-2.5 text-blue-600 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <span className="w-4 h-4 mr-2.5 shrink-0"></span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap ${getStatusClass(
                                option.apiValue
                              )}`}
                            >
                              {option.displayLabel}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  {" "}
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Description
                  </h3>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4">
                    {parentTaskDetails.task_description ||
                      "No description provided"}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Priority
                    </h4>
                    <div className="relative" ref={priorityDropdownRef}>
                      <button
                        onClick={() =>
                          setIsPriorityDropdownOpen((prev) => !prev)
                        }
                        className={`w-full flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-slate-200/60 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          isPriorityDropdownOpen
                            ? "bg-slate-200/60"
                            : "hover:bg-slate-100"
                        }`}
                        aria-haspopup="true"
                        aria-expanded={isPriorityDropdownOpen}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {currentPriorityDisplay.icon}
                          </span>
                          <span
                            className={`font-semibold ${currentPriorityDisplay.colorClass}`}
                          >
                            {currentPriorityDisplay.displayLabel}
                          </span>
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-500 transform transition-transform duration-200 ${
                            isPriorityDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </button>
                      {isPriorityDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md shadow-lg z-30 border border-slate-200 overflow-y-auto max-h-60 py-1">
                          <button
                            onClick={async () => {
                              await handleUpdateTaskField("priority", null);
                              setIsPriorityDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center ${
                              !parentTaskDetails.priority
                                ? "font-semibold text-blue-600"
                                : "text-slate-700"
                            }`}
                          >
                            {!parentTaskDetails.priority && (
                              <svg
                                className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span className="italic text-slate-500">
                              — Clear Priority —
                            </span>
                          </button>
                          <div className="border-t border-slate-100 my-1 mx-1"></div>
                          {priorityUpdateOptions.map((option) => (
                            <button
                              key={option.apiValue}
                              onClick={async () => {
                                await handleUpdateTaskField(
                                  "priority",
                                  option.apiValue
                                );
                                setIsPriorityDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-slate-100 flex items-center ${
                                parentTaskDetails.priority === option.apiValue
                                  ? "font-semibold text-blue-600"
                                  : "text-slate-700"
                              }`}
                            >
                              {parentTaskDetails.priority ===
                                option.apiValue && (
                                <svg
                                  className="w-3.5 h-3.5 mr-2 text-blue-600 shrink-0"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                              <span className="text-sm mr-2 shrink-0">
                                {option.icon}
                              </span>
                              <span className={option.colorClass}>
                                {option.displayLabel}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Due Date
                    </h4>
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-slate-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <input
                        type="date"
                        value={parentTaskDetails.due_date || ""}
                        onChange={async (e) =>
                          await handleUpdateTaskField(
                            "due_date",
                            e.target.value || null
                          )
                        }
                        className="text-slate-700 font-medium bg-transparent border-0 focus:ring-0 p-0 w-full focus:outline-none appearance-none cursor-pointer"
                      />
                      {!parentTaskDetails.due_date && (
                        <span className="text-slate-500 text-sm italic whitespace-nowrap">
                          No due date
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Assignee
                    </h4>
                    {parentAssignee ? (
                      <div className="flex items-center space-x-3">
                        {parentAssignee.profilePic ? (
                          <img
                            src={parentAssignee.profilePic}
                            alt={parentAssignee.name}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
                          />
                        ) : (
                          <span
                            className={`w-8 h-8 ${parentAssignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-200`}
                          >
                            {parentAssignee.avatar}
                          </span>
                        )}
                        <span className="text-slate-700 font-medium truncate">
                          {parentAssignee.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <span className="text-slate-500">Unassigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              {" "}
              <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Tasks</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {subTasks.length} task{subTasks.length !== 1 ? "s" : ""}{" "}
                    total
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSubTaskModal}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 text-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <span>Add Task</span>
                </button>
              </div>
              {subTasks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {subTasks.map((subTask, index) => {
                    const assignee =
                      subTask.assignees && subTask.assignees.length > 0
                        ? mapApiUserToLocal(subTask.assignees[0].user)
                        : subTask.creator
                        ? mapApiUserToLocal(subTask.creator, "creator")
                        : null;
                    const subTaskPriority = getCurrentPriorityDetails(
                      subTask.priority
                    );
                    return (
                      <div
                        key={subTask.id || `subtask-${index}`}
                        className="p-6 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3
                              className="text-lg font-semibold text-slate-800 mb-2 hover:text-blue-600 cursor-pointer"
                              onClick={() => navigate(`/task/${subTask.id}`)}
                            >
                              {subTask.task_title || "Untitled Task"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(
                                  subTask.task_status
                                )}`}
                              >
                                {String(
                                  subTask.task_status || "N/A"
                                ).toUpperCase()}
                              </span>
                              <div
                                className="flex items-center space-x-1"
                                title={`Priority: ${subTaskPriority.displayLabel}`}
                              >
                                <span>{subTaskPriority.icon}</span>
                                <span
                                  className={`font-medium ${subTaskPriority.colorClass}`}
                                >
                                  {subTaskPriority.displayLabel}
                                </span>
                              </div>
                              {subTask.due_date && (
                                <div className="flex items-center space-x-1 text-slate-600">
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span>
                                    {new Date(
                                      subTask.due_date
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 sm:space-x-4 ml-4">
                            {assignee ? (
                              <div
                                className="flex items-center space-x-2"
                                title={`Assigned to: ${assignee.name}`}
                              >
                                {assignee.profilePic ? (
                                  <img
                                    src={assignee.profilePic}
                                    alt={assignee.name}
                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-slate-200"
                                  />
                                ) : (
                                  <span
                                    className={`w-7 h-7 sm:w-8 sm:h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-1 ring-slate-200`}
                                  >
                                    {assignee.avatar}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-slate-700 hidden md:block truncate max-w-[100px]">
                                  {assignee.name}
                                </span>
                              </div>
                            ) : (
                              <div
                                className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 rounded-full flex items-center justify-center"
                                title="Unassigned"
                              >
                                <svg
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    No tasks yet
                  </h3>
                  <p className="text-slate-500 mb-4 text-sm">
                    Break down this task into smaller, manageable pieces.
                  </p>
                  <button
                    onClick={handleOpenAddSubTaskModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors text-sm"
                  >
                    Create First Task
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  Activity & Comments
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {comments.length} comment{comments.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div
                className="flex-1 overflow-y-auto p-6 space-y-4"
                style={{ maxHeight: "calc(100vh - 22rem)" }}
              >
                {comments.length > 0 ? (
                  comments.map((comment) => {
                    const sender = comment.sender
                      ? mapApiUserToLocal(comment.sender, "commenter")
                      : mapApiUserToLocal(null, "commenter");
                    return (
                      <div key={comment.id} className="group">
                        <div className="flex items-start space-x-3">
                          {sender.profilePic ? (
                            <img
                              src={sender.profilePic}
                              alt={sender.name}
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100"
                            />
                          ) : (
                            <span
                              className={`w-9 h-9 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100`}
                            >
                              {sender.avatar}
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="bg-slate-50 rounded-xl rounded-tl-sm p-3.5 group-hover:bg-slate-100 transition-colors">
                              <p className="text-sm font-semibold text-slate-800 mb-1">
                                {sender.name}
                              </p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {comment.comment_message}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 ml-3">
                              {formatCommentTimestamp(comment.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500">No comments yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Start the conversation below
                    </p>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm transition-colors"
                    rows={3}
                    disabled={isSubmittingComment}
                    maxLength={500}
                  />
                  {commentError && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md">
                      {commentError}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {newComment.length > 500 ? (
                        <span className="text-red-500">
                          {newComment.length}/500
                        </span>
                      ) : (
                        `${newComment.length}/500`
                      )}
                    </span>
                    <button
                      type="submit"
                      disabled={
                        !newComment.trim() ||
                        isSubmittingComment ||
                        newComment.length > 500
                      }
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-1.5"
                    >
                      {isSubmittingComment ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          <span>Post</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddSubTaskModalOpen && (
        <AddSubTaskModal
          isOpen={isAddSubTaskModalOpen}
          onClose={handleCloseAddSubTaskModal}
          parentTaskId={taskId}
          onSubTaskAdded={handleSubTaskAdded}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;
