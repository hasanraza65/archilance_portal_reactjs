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
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (String(status).toLowerCase()) {
      case "in progress": case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo": case "to do": case "open": return "bg-gray-100 text-gray-800 border-gray-200"; 
      case "completed": case "done": return "bg-green-100 text-green-800 border-green-200";
      default: return `bg-yellow-100 text-yellow-800 border-yellow-200`;
    }
};

const getPriorityClass = (priority) => {
    if (!priority) return "text-gray-600";
    switch (String(priority).toLowerCase()) {
      case "high": return "text-red-600";
      case "normal": case "medium": return "text-blue-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
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


  if (loading) return <div className="container mx-auto p-4 text-center">Loading task details...</div>;
  if (error || !taskFound || !parentTaskDetails) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h2 className="text-xl text-red-500 mb-4">Error</h2>
        <p className="text-gray-700">{error || `Task with ID ${taskId} not found or data is invalid.`}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Go Back</button>
      </div>
    );
  }

  const parentAssignee = parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0 
    ? mapApiUserToLocal(parentTaskDetails.assignees[0].user) // API shows assignee user data nested
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-full mx-auto">
      {/* Main Content Area (Left) */}
      <div className="lg:w-2/3 w-full flex-shrink-0">
        {/* Parent Task Details Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <div className="flex justify-between items-start">
              <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{parentTaskDetails.task_title}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    In Project: <button onClick={() => navigate(`/project/${parentTaskDetails.project_id}`)} className="text-blue-600 hover:underline">{parentTaskDetails.project_id}</button>
                  </p>
              </div>
          </div>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            <strong>Description:</strong> {parentTaskDetails.task_description || "N/A"}
          </p>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Status: </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(parentTaskDetails.task_status)}`}>
                      {String(parentTaskDetails.task_status || "N/A").toUpperCase()}
                  </span>
              </div>
              <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Priority: </span>
                  <span className={`${getPriorityClass(parentTaskDetails.priority)}`}>
                      {parentTaskDetails.priority || "N/A"}
                  </span>
              </div>
              <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Due Date: </span>
                  <span className="text-gray-600 dark:text-gray-400">
                      {parentTaskDetails.due_date ? new Date(parentTaskDetails.due_date).toLocaleDateString() : "N/A"}
                  </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700 dark:text-gray-300">Assignee: </span>
                {parentAssignee ? (
                    <div className="inline-flex items-center">
                      {parentAssignee.profilePic ? (
                        <img src={parentAssignee.profilePic} alt={parentAssignee.name} className="w-5 h-5 rounded-full mr-1.5 object-cover"/>
                      ) : (
                        <span className={`w-5 h-5 ${parentAssignee.color} text-white rounded-full flex items-center justify-center text-xs font-medium mr-1.5`}>
                            {parentAssignee.avatar}
                        </span>
                      )}
                      <span className="text-gray-600 dark:text-gray-400">{parentAssignee.name}</span>
                    </div>
                  ) : ( <span className="text-gray-500 dark:text-gray-400">Unassigned</span> )}
            </div>
          </div>
        </div>

        {/* Sub-Tasks Section */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-700">Sub-Tasks</h2>
                <button onClick={handleOpenAddSubTaskModal} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Add Sub-Task
                </button>
            </div>
            {subTasks.length > 0 ? (
                <>
                    <div className="grid grid-cols-12 bg-gray-50 border-b text-sm font-medium text-gray-500 sticky top-0 z-10">
                        <div className="col-span-4 p-3">Name</div><div className="col-span-2 p-3">Assignee</div>
                        <div className="col-span-2 p-3">Status</div><div className="col-span-2 p-3">Due date</div>
                        <div className="col-span-1 p-3">Priority</div><div className="col-span-1 p-3 text-center">Actions</div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {subTasks.map((subTask, index) => {
                            const assignee = subTask.assignees && subTask.assignees.length > 0 
                                ? mapApiUserToLocal(subTask.assignees[0].user) 
                                : (subTask.creator ? mapApiUserToLocal(subTask.creator) : null);
                            return (
                                <div key={subTask.id || `subtask-${index}`} className="grid grid-cols-12 border-b hover:bg-gray-50">
                                    <div className="col-span-4 p-3 flex items-center"><span className="text-gray-900">{subTask.task_title || "N/A"}</span></div>
                                    <div className="col-span-2 p-3 flex items-center">
                                      {assignee ? (<div className="flex items-center">
                                        {assignee.profilePic ? <img src={assignee.profilePic} alt={assignee.name} className="w-6 h-6 rounded-full mr-2 object-cover"/> : <span className={`w-6 h-6 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs font-medium mr-2`}>{assignee.avatar}</span>}
                                        <span className="text-sm text-gray-700">{assignee.name}</span>
                                      </div>) : <span className="text-sm text-gray-500">Unassigned</span>}
                                    </div>
                                    <div className="col-span-2 p-3 flex items-center"><span className={`px-2 py-0.5 rounded-full text-xs ${getStatusClass(subTask.task_status)}`}>{String(subTask.task_status || "N/A").toUpperCase()}</span></div>
                                    <div className="col-span-2 p-3 flex items-center"><span className="text-sm text-gray-700">{subTask.due_date ? new Date(subTask.due_date).toLocaleDateString() : "N/A"}</span></div>
                                    <div className="col-span-1 p-3 flex items-center"><span className={`text-sm font-medium ${getPriorityClass(subTask.priority)}`}>{subTask.priority || "N/A"}</span></div>
                                    <div className="col-span-1 p-3 flex items-center justify-center"><button className="text-gray-400 hover:text-gray-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg></button></div>
                                </div>);
                        })}
                    </div>
                </>
            ) : <div className="p-6 text-center text-gray-500">No sub-tasks found.</div>}
        </div>
      </div>

      {/* Activity / Comments Section (Right Sidebar) */}
      <div className="lg:w-1/3 w-full bg-white dark:bg-gray-800 rounded-lg shadow p-2 lg:sticky lg:top-4 self-start max-h-[calc(100vh-2rem)] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-white p-4 border-b dark:border-gray-700">Activity & Comments</h3>
        
        {/* Comments List */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {comments.length > 0 ? comments.map(comment => {
            const sender = comment.sender ? mapApiUserToLocal(comment.sender) : mapApiUserToLocal(null); // Handle if sender is null
            return (
              <div key={comment.id} className="flex items-start space-x-3">
                {sender.profilePic ? (
                    <img src={sender.profilePic} alt={sender.name} className="w-8 h-8 rounded-full object-cover"/>
                ) : (
                    <span className={`w-8 h-8 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-medium`}>
                        {sender.avatar}
                    </span>
                )}
                <div className="flex-1">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{sender.name}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.comment_message}</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatCommentTimestamp(comment.created_at)}</p>
                </div>
              </div>
            );
          }) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No comments yet.</p>}
        </div>

        {/* Add Comment Form */}
        <div className="p-4 border-t dark:border-gray-700">
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500 text-sm"
              rows="3"
              required
            ></textarea>
            {commentError && <p className="text-xs text-red-500 mt-1">{commentError}</p>}
            <button 
              type="submit"
              disabled={isSubmittingComment || !newComment.trim()}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isSubmittingComment ? "Submitting..." : "Post Comment"}
            </button>
          </form>
        </div>
      </div>

      {parentTaskDetails && (
        <AddSubTaskModal
            isOpen={isAddSubTaskModalOpen} onClose={handleCloseAddSubTaskModal} onSubTaskAdded={handleSubTaskAdded}
            parentTaskId={parentTaskDetails.id} projectId={parentTaskDetails.project_id}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;