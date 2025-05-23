// src/pages/TaskDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
// Assuming AddSubTaskModal is in a components directory
import AddSubTaskModal from "./SubTaskDetail"; 

// Helper functions (can be moved to a utils file if used in multiple places)
const mapApiUserToLocal = (apiUser, type = "assignee") => {
    if (!apiUser || typeof apiUser !== 'object') {
        return { name: "Unknown", avatar: "U", color: "bg-gray-500", profilePic: null };
    }
    // For assignees from project-task API: apiUser is assignees[0].user
    // For comment senders: apiUser is comments[0].sender
    const name = apiUser.name || "Unknown";
    const avatarChar = name.charAt(0).toUpperCase() || "U";
    
    let color = "bg-gray-500";
    if (name !== "Unknown") {
        const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];
        color = colors[name.length % colors.length];
    }
    // Check for profile_pic from API
    const profilePic = apiUser.profile_pic ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${apiUser.profile_pic}` : null;

    return { name, avatar: avatarChar, color: apiUser.color || color, profilePic };
};

const getStatusClass = (status) => {
    if (!status) return "bg-slate-100 text-slate-700 border-slate-200";
    switch (String(status).toLowerCase()) {
      case "in progress": case "pending": return "bg-blue-50 text-blue-700 border-blue-200";
      case "todo": case "to do": case "open": return "bg-amber-50 text-amber-700 border-amber-200"; 
      case "completed": case "done": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return `bg-purple-50 text-purple-700 border-purple-200`;
    }
};

const getPriorityClass = (priority) => {
    if (!priority) return "text-slate-500";
    switch (String(priority).toLowerCase()) {
      case "high": return "text-red-600";
      case "normal": case "medium": return "text-blue-600";
      case "low": return "text-emerald-600";
      default: return "text-slate-500";
    }
};

const getPriorityIcon = (priority) => {
    if (!priority) return "○";
    switch (String(priority).toLowerCase()) {
      case "high": return "🔴";
      case "normal": case "medium": return "🟡";
      case "low": return "🟢";
      default: return "○";
    }
};

// Function to format date/time for comments (basic example)
const formatCommentTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
};

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]); // State for comments
  const [newComment, setNewComment] = useState(""); // State for new comment input
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);

  const fetchTaskData = async () => { // Renamed for clarity
    if (!taskId) {
      setError("Task ID is missing from URL."); setLoading(false); setTaskFound(false); return;
    }
    setLoading(true); setError(null); setTaskFound(true);
    setParentTaskDetails(null); setSubTasks([]); setComments([]);

    const token = Cookies.get("token");
    if (!token) {
      setError("Authorization token not found."); setLoading(false); setTaskFound(false); navigate("/login"); return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${taskId}`, {
        method: "GET", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
      });
      if (!response.ok) {
        if (response.status === 404) { setTaskFound(false); setError(`Task with ID ${taskId} not found.`); } 
        else { const e = await response.json().catch(() => ({})); setError(`Error ${response.status}: ${e.message || response.statusText}`); setTaskFound(false); }
        setLoading(false); return;
      }
      const data = await response.json();
      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        setComments(data.comments || []); // Populate comments
        setTaskFound(true);
      } else { setError("Invalid task data."); setTaskFound(false); }
    } catch (err) { console.error("Fetch task error:", err); setError(err.message || "Unknown error."); setTaskFound(false); } 
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchTaskData();
  }, [taskId]);

  const handleOpenAddSubTaskModal = () => setIsAddSubTaskModalOpen(true);
  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = () => { fetchTaskData(); };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    setCommentError(null);
    const token = Cookies.get("token");

    // --- YOU NEED TO DEFINE THIS API ENDPOINT AND PAYLOAD ---
    // Example:
    const commentPayload = {
        task_id: parseInt(taskId),
        comment_message: newComment,
        // reply_to: null, // For top-level comments
    };

    try {
        // REPLACE WITH YOUR ACTUAL COMMENT POSTING API
        const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/comments`, { 
            method: "POST",
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(commentPayload),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Failed to post comment (status ${response.status})`);
        }
        setNewComment(""); // Clear input
        fetchTaskData(); // Re-fetch all task data to get the new comment
    } catch (err) {
        console.error("Error posting comment:", err);
        setCommentError(err.message);
    } finally {
        setIsSubmittingComment(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-slate-600 font-medium">Loading task details...</p>
      </div>
    </div>
  );

  if (error || !taskFound || !parentTaskDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.966-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Task Not Found</h2>
            <p className="text-slate-600">{error || `Task with ID ${taskId} not found or data is invalid.`}</p>
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

  const parentAssignee = parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0 
    ? mapApiUserToLocal(parentTaskDetails.assignees[0].user) // API shows assignee user data nested
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parent Task Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-200 to-indigo-300 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">{parentTaskDetails.task_title}</h1>
                    <button 
                      onClick={() => navigate(`/project/${parentTaskDetails.project_id}`)} 
                      className="inline-flex items-center text-black hover:text-white text-sm transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Project #{parentTaskDetails.project_id}
                    </button>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusClass(parentTaskDetails.task_status)}`}>
                    {String(parentTaskDetails.task_status || "N/A").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-4">
                    {parentTaskDetails.task_description || "No description provided"}
                  </p>
                </div>

                {/* Task Details Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Priority */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Priority</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getPriorityIcon(parentTaskDetails.priority)}</span>
                      <span className={`font-semibold ${getPriorityClass(parentTaskDetails.priority)}`}>
                        {parentTaskDetails.priority || "Not Set"}
                      </span>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Due Date</h4>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-slate-700 font-medium">
                        {parentTaskDetails.due_date ? new Date(parentTaskDetails.due_date).toLocaleDateString() : "No due date"}
                      </span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee</h4>
                    {parentAssignee ? (
                      <div className="flex items-center space-x-3">
                        {parentAssignee.profilePic ? (
                          <img src={parentAssignee.profilePic} alt={parentAssignee.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white"/>
                        ) : (
                          <span className={`w-8 h-8 ${parentAssignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-white`}>
                            {parentAssignee.avatar}
                          </span>
                        )}
                        <span className="text-slate-700 font-medium">{parentAssignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-slate-500">Unassigned</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-Tasks Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Sub-Tasks</h2>
                  <p className="text-sm text-slate-600 mt-1">{subTasks.length} task{subTasks.length !== 1 ? 's' : ''} total</p>
                </div>
                <button 
                  onClick={handleOpenAddSubTaskModal} 
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Sub-Task</span>
                </button>
              </div>

              {subTasks.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {subTasks.map((subTask, index) => {
                    const assignee = subTask.assignees && subTask.assignees.length > 0 
                      ? mapApiUserToLocal(subTask.assignees[0].user) 
                      : (subTask.creator ? mapApiUserToLocal(subTask.creator) : null);
                    
                    return (
                      <div key={subTask.id || `subtask-${index}`} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">{subTask.task_title || "Untitled Task"}</h3>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              {/* Status */}
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusClass(subTask.task_status)}`}>
                                {String(subTask.task_status || "N/A").toUpperCase()}
                              </span>
                              
                              {/* Priority */}
                              <div className="flex items-center space-x-1">
                                <span>{getPriorityIcon(subTask.priority)}</span>
                                <span className={`font-medium ${getPriorityClass(subTask.priority)}`}>
                                  {subTask.priority || "Normal"}
                                </span>
                              </div>
                              
                              {/* Due Date */}
                              {subTask.due_date && (
                                <div className="flex items-center space-x-1 text-slate-600">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span>{new Date(subTask.due_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 ml-4">
                            {/* Assignee */}
                            {assignee ? (
                              <div className="flex items-center space-x-2">
                                {assignee.profilePic ? (
                                  <img src={assignee.profilePic} alt={assignee.name} className="w-8 h-8 rounded-full object-cover"/>
                                ) : (
                                  <span className={`w-8 h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold`}>
                                    {assignee.avatar}
                                  </span>
                                )}
                                <span className="text-sm font-medium text-slate-700 hidden sm:block">{assignee.name}</span>
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}

                            {/* Actions */}
                            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No sub-tasks yet</h3>
                  <p className="text-slate-500 mb-4">Break down this task into smaller, manageable pieces.</p>
                  <button 
                    onClick={handleOpenAddSubTaskModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Create First Sub-Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
              <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Activity & Comments
                </h3>
                <p className="text-sm text-slate-600 mt-1">{comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
              </div>
              
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
                {comments.length > 0 ? comments.map(comment => {
                  const sender = comment.sender ? mapApiUserToLocal(comment.sender) : mapApiUserToLocal(null);
                  return (
                    <div key={comment.id} className="group">
                      <div className="flex items-start space-x-3">
                        {sender.profilePic ? (
                          <img src={sender.profilePic} alt={sender.name} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"/>
                        ) : (
                          <span className={`w-9 h-9 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-slate-100`}>
                            {sender.avatar}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="bg-slate-50 rounded-2xl rounded-tl-sm p-4 group-hover:bg-slate-100 transition-colors">
                            <p className="text-sm font-semibold text-slate-800 mb-1">{sender.name}</p>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.comment_message}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 ml-4">{formatCommentTimestamp(comment.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-slate-500">No comments yet</p>
                    <p className="text-xs text-slate-400 mt-1">Start the conversation below</p>
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-4 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm transition-colors"
                    rows={3}
                    disabled={isSubmittingComment}
                  />
                  {commentError && (
                    <div className="text-red-600 text-xs bg-red-50 p-2 rounded-lg">
                      {commentError}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">
                      {newComment.length}/500 characters
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-2"
                    >
                      {isSubmittingComment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Posting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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

      {/* Add Sub-Task Modal */}
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