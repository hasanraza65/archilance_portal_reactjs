import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import TaskHeader from "./PartialTask/TaskHeader";
import TaskMetadata from "./PartialTask/TaskMetadata";
import SubTaskList from "./PartialTask/SubTaskList";
import CommentList from "./PartialTask/CommentList";
import LoadingState from "./PartialTask/LoadingState";
import ErrorState from "./PartialTask/ErrorState";
import AddSubTaskModals from "./PartialTask/AddSubTaskModal"; 

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false); // For NEW comments specifically
  const [commentError, setCommentError] = useState(null);
  
  // Placeholder for current user ID - you'll need to get this from your auth system
  const [currentUserId, setCurrentUserId] = useState(null); // Example: null; replace with actual logic

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const toastContainerStyle = { zIndex: 10000 };

  // Function to get user ID from cookie (example)
  const getUserIdFromCookie = () => {
    const userCookie = Cookies.get("user"); // Assuming user data is stored in a cookie named "user"
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        return userData.id; // Adjust 'id' if your user object has a different key for the user ID
      } catch (e) {
        console.error("Failed to parse user data from cookie:", e);
        return null;
      }
    }
    return null;
  };


  const fetchTaskData = async (showLoadingSpinner = true) => {
    if (!taskId) {
      setError("Task ID is missing from URL.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      return;
    }
    if (showLoadingSpinner) setLoading(true);
    setError(null); setFieldUpdateError(null); setTaskFound(true);
    const token = Cookies.get("token");
    if (!token) {
      setError("Authorization token not found. Please log in.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${taskId}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      });
      if (!response.ok) {
        const eData = await response.json().catch(() => ({ message: `Server error ${response.status}` }));
        if (response.status === 404) {
          setError(`Task with ID ${taskId} not found.`);
        } else {
          setError(`Error ${response.status}: ${eData.message || response.statusText}`);
        }
        setTaskFound(false);
        if (showLoadingSpinner) setLoading(false);
        return;
      }
      const data = await response.json();
      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        const sortedComments = (data.comments || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setComments(sortedComments);
        setTaskFound(true);
      } else {
        setError("Invalid task data received from API.");
        setTaskFound(false);
      }
    } catch (err) {
      setError(err.message || "An unknown error occurred while fetching task details.");
      setTaskFound(false);
    } 
    finally { if (showLoadingSpinner) setLoading(false); }
  };

  useEffect(() => {
    setCurrentUserId(getUserIdFromCookie()); // Set user ID on component mount/update

    if (taskId && taskId.trim() !== "") fetchTaskData();
    else { setLoading(false); setError("Task ID is missing or invalid in the URL."); setTaskFound(false); }
  }, [taskId, navigate]); // `navigate` might not be needed here if only for redirect

  useEffect(() => {
    function handleClickOutside(event) {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) setIsPriorityDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) setIsStatusDropdownOpen(false);
    }
    if (isPriorityDropdownOpen || isStatusDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPriorityDropdownOpen, isStatusDropdownOpen]);


  const handleUpdateTaskField = async (fieldName, value) => {
    if (!parentTaskDetails) return;
    const token = Cookies.get("token");
    if (!token) { /* ... toast error ... */ return; }
    setFieldUpdateError(null);
    const originalValue = parentTaskDetails[fieldName];
    setParentTaskDetails((prevDetails) => ({ ...prevDetails, [fieldName]: value }));
    try {
      // ... API call ...
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${parentTaskDetails.id}`,
        { /* ... */ }
      );
      // ... response handling ...
    } catch (err) {
      // ... error handling ...
    }
  };

  const handleOpenAddSubTaskModal = () => {
    if (!taskId || !parentTaskDetails || parentTaskDetails.project_id == null) {
        toast.error("Cannot add sub-task: Parent task data is incomplete.");
        return;
    }
    setIsAddSubTaskModalOpen(true);
  };
  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = () => { if (taskId) fetchTaskData(false); };

  const handleCommentSubmit = async (payload, isFormData) => { // For NEW comments
    setIsSubmittingComment(true); setCommentError(null);
    const token = Cookies.get("token");
    if (!token) { toast.error("Auth token missing."); setIsSubmittingComment(false); return false; }
    
    let requestBody;
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
    if (isFormData) requestBody = payload; else { requestBody = JSON.stringify(payload); headers['Content-Type'] = 'application/json'; }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment`, {
        method: "POST", headers: headers, body: requestBody,
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to post comment (status ${response.status})`);
      }
      setNewComment(""); toast.success("Comment posted!");
      if (taskId) fetchTaskData(false);
      return true;
    } catch (err) { setCommentError(err.message); toast.error(`Failed to post: ${err.message}`); return false; } 
    finally { setIsSubmittingComment(false); }
  };

  const handleEditComment = async (commentId, newText) => {
    // Note: isSubmittingComment in CommentList will handle UI disable
    setCommentError(null); // Clear previous errors for this operation type
    const token = Cookies.get("token");
    if (!token) { toast.error("Authorization token not found."); return false; }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment/${commentId}`, {
        method: "PUT", 
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ comment_message: newText }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to update comment (status ${response.status})`);
      }
      toast.success("Comment updated!");
      if (taskId) fetchTaskData(false); // Refetch to get updated comment list
      return true;
    } catch (err) {
      setCommentError(err.message); // Set error specific to this operation
      toast.error(`Update failed: ${err.message}`);
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    // Note: isSubmittingComment in CommentList will handle UI disable
    setCommentError(null); // Clear previous errors for this operation type
    const token = Cookies.get("token");
    if (!token) { toast.error("Authorization token not found."); return false; }
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to delete comment (status ${response.status})`);
      }
      toast.success("Comment deleted!");
      if (taskId) fetchTaskData(false); // Refetch to get updated comment list
      return true;
    } catch (err) {
      setCommentError(err.message); // Set error specific to this operation
      toast.error(`Delete failed: ${err.message}`);
      return false;
    }
  };
  
  if (loading && taskId && taskId.trim() !== "") return <LoadingState />;
  if (!taskId || taskId.trim() === "") return <><ToastContainer {...toastContainerStyle} /><ErrorState title="Invalid Task URL" message="No Task ID was provided or it is invalid in the URL." /></>;
  if (error || !taskFound || !parentTaskDetails) return <><ToastContainer {...toastContainerStyle} /><ErrorState title={taskFound ? "Error Loading Task" : "Task Not Found"} message={error || "Failed to load task details."} taskId={taskId} /></>;
  
  const parentAssignee = parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0 ? parentTaskDetails.assignees[0].user : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer {...{ ...toastContainerStyle, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme:"colored" }} />
      <div className="container mx-auto px-4 py-6">
        {fieldUpdateError && <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm shadow"><strong>Update Issue:</strong> {fieldUpdateError}</div>}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <TaskHeader taskTitle={parentTaskDetails.task_title} projectId={parentTaskDetails.project_id} taskStatus={parentTaskDetails.task_status} isStatusDropdownOpen={isStatusDropdownOpen} setIsStatusDropdownOpen={setIsStatusDropdownOpen} statusDropdownRef={statusDropdownRef} handleUpdateTaskField={handleUpdateTaskField} />
              <TaskMetadata description={parentTaskDetails.task_description} priority={parentTaskDetails.priority} dueDate={parentTaskDetails.due_date} assignee={parentAssignee} isPriorityDropdownOpen={isPriorityDropdownOpen} setIsPriorityDropdownOpen={setIsPriorityDropdownOpen} priorityDropdownRef={priorityDropdownRef} handleUpdateTaskField={handleUpdateTaskField}/>
            </div>
            <SubTaskList subTasks={subTasks} onAddSubTaskClick={handleOpenAddSubTaskModal} />
          </div>
          <div className="lg:col-span-1">
            <CommentList
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit} 
              isSubmittingComment={isSubmittingComment} // For new comment form
              commentError={commentError} // General error for all comment ops displayed in list
              taskId={taskId}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>

      {isAddSubTaskModalOpen && taskId && parentTaskDetails && parentTaskDetails.project_id != null && (
        <AddSubTaskModals isOpen={isAddSubTaskModalOpen} onClose={handleCloseAddSubTaskModal} parentTaskId={taskId} projectId={parentTaskDetails.project_id} onSubTaskAdded={handleSubTaskAdded} />
      )}
    </div>
  );
};

export default TaskDetailsPage;