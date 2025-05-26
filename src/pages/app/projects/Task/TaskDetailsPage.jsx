// src/pages/TaskDetailsPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// import AddSubTaskModal from "./PartialTask/AddSubTaskModal";
import TaskHeader from "./PartialTask/TaskHeader";
import TaskMetadata from "./PartialTask/TaskMetadata";
import SubTaskList from "./PartialTask/SubTaskList";
import CommentList from "./PartialTask/CommentList";
import LoadingState from "./PartialTask/LoadingState";
import ErrorState from "./PartialTask/ErrorState";
import AddSubTaskModals from "./PartialTask/AddSubTaskModal";
// Helper functions are now imported if needed by TaskDetailsPage itself, or passed to children
// For this refactor, children import them from taskDetailsUtils.js

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
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

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
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${taskId}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          setTaskFound(false);
          setError(`Task with ID ${taskId} not found.`);
        } else {
          const eData = await response.json().catch(() => ({}));
          setError(`Error ${response.status}: ${eData.message || response.statusText}`);
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
      setError(err.message || "An unknown error occurred while fetching task details.");
      setTaskFound(false);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskData();
  }, [taskId, navigate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setIsPriorityDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
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
      setFieldUpdateError("Authorization token not found. Please log in again.");
      return;
    }
    setFieldUpdateError(null);
    const originalValue = parentTaskDetails[fieldName];
    setParentTaskDetails((prevDetails) => ({ ...prevDetails, [fieldName]: value }));

    try {
      const payload = { [fieldName]: value };
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${parentTaskDetails.id}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const responseData = await response.json();

      if (!response.ok) {
        setParentTaskDetails((prevDetails) => ({ ...prevDetails, [fieldName]: originalValue }));
        toast.error(responseData.message || `Failed to update ${fieldName}`);
        throw new Error(responseData.message || `Failed to update ${fieldName} (status ${response.status})`);
      }

      if (responseData && responseData.task && responseData.task.hasOwnProperty(fieldName)) {
        setParentTaskDetails((prevDetails) => ({ ...prevDetails, [fieldName]: responseData.task[fieldName] }));
        const friendlyFieldName = fieldName.replace(/_/g, " ");
        toast.success(`${friendlyFieldName.charAt(0).toUpperCase() + friendlyFieldName.slice(1)} updated!`);
      } else if (responseData && responseData.message && response.ok) {
        const friendlyFieldName = fieldName.replace(/_/g, " ");
        toast.success(`${friendlyFieldName.charAt(0).toUpperCase() + friendlyFieldName.slice(1)} updated (confirmed by server)!`);
         // Optionally re-fetch to ensure data consistency if server response is minimal
        fetchTaskData(false);
      } else {
        toast.warn("Update may have succeeded, but API response format was unexpected. Local value kept. Refresh if needed.");
      }
    } catch (err) {
      console.error(`Error updating ${fieldName}:`, err);
      setParentTaskDetails((prevDetails) => ({ ...prevDetails, [fieldName]: originalValue }));
      if (!err.message.includes("Failed to update")) {
        toast.error(`Error updating ${fieldName}: ${err.message}`);
      }
      setFieldUpdateError(`Failed to update ${fieldName}: ${err.message}`);
    }
  };

  const handleOpenAddSubTaskModal = () => setIsAddSubTaskModalOpen(true);
  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = () => {
    fetchTaskData(false); // Refresh data after adding a sub-task
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = Cookies.get("token");
    const commentPayload = { task_id: parseInt(taskId), comment_message: newComment };
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/comments`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(commentPayload),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Failed to post comment (status ${response.status})`);
      }
      setNewComment("");
      toast.success("Comment posted!");
      fetchTaskData(false); // Refresh data to show new comment
    } catch (err) {
      console.error("Error posting comment:", err);
      setCommentError(err.message);
      toast.error(`Failed to post comment: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !taskFound || !parentTaskDetails) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        <ErrorState title={taskFound ? "Error Loading Task" : "Task Not Found"} message={error} taskId={taskId} />
      </>
    );
  }
  
  const parentAssignee = parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0 ? parentTaskDetails.assignees[0].user : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      <div className="container mx-auto px-4 py-6">
        {fieldUpdateError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm shadow">
            <strong>Update Issue:</strong> {fieldUpdateError}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              <TaskHeader
                taskTitle={parentTaskDetails.task_title}
                projectId={parentTaskDetails.project_id}
                taskStatus={parentTaskDetails.task_status}
                isStatusDropdownOpen={isStatusDropdownOpen}
                setIsStatusDropdownOpen={setIsStatusDropdownOpen}
                statusDropdownRef={statusDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
              />
              <TaskMetadata
                description={parentTaskDetails.task_description}
                priority={parentTaskDetails.priority}
                dueDate={parentTaskDetails.due_date}
                assignee={parentAssignee}
                isPriorityDropdownOpen={isPriorityDropdownOpen}
                setIsPriorityDropdownOpen={setIsPriorityDropdownOpen}
                priorityDropdownRef={priorityDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
              />
            </div>
            <SubTaskList
              subTasks={subTasks}
              onAddSubTaskClick={handleOpenAddSubTaskModal}
            />
          </div>
          <div className="lg:col-span-1">
            <CommentList
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit}
              isSubmittingComment={isSubmittingComment}
              commentError={commentError}
            />
          </div>
        </div>
      </div>

      {isAddSubTaskModalOpen && (
        <AddSubTaskModals
          isOpen={isAddSubTaskModalOpen}
          onClose={handleCloseAddSubTaskModal}
          parentTaskId={taskId} // Already a string from useParams
          onSubTaskAdded={handleSubTaskAdded}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;