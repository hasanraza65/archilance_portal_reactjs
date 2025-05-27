// src/pages/TaskDetailsPage.jsx
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
  const { taskId } = useParams(); // taskId from URL
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [loading, setLoading] = useState(true); // Default to true, set to false if taskId is initially missing
  const [error, setError] = useState(null);
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const toastContainerStyle = { zIndex: 10000 };

  const fetchTaskData = async (showLoadingSpinner = true) => {
    console.log("Attempting to fetch task data for taskId:", taskId);
    if (!taskId) {
      console.error("fetchTaskData: Task ID is missing. Aborting fetch.");
      setError("Task ID is missing from URL. Cannot fetch task data.");
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
          const eData = await response.json().catch(() => ({ message: `Server error ${response.status}` }));
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
        console.log("Parent task details fetched successfully:", data);
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
    console.log("TaskDetailsPage useEffect [taskId, navigate] - current taskId from useParams:", taskId);
    if (taskId && taskId.trim() !== "") {
      fetchTaskData();
    } else {
      console.warn("Task ID from URL is undefined, null, or empty in useEffect. Not fetching data.");
      setLoading(false); // Stop loading if taskId is invalid
      setError("Task ID is missing or invalid in the URL.");
      setTaskFound(false);
    }
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
        if (taskId) fetchTaskData(false);
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

  const handleOpenAddSubTaskModal = () => {
    console.log("handleOpenAddSubTaskModal called. Current taskId:", taskId, "ParentDetails:", parentTaskDetails);
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
      console.error("Attempted to open modal, but Task ID from URL is invalid. Value:", taskId);
      toast.error("Cannot add sub-task: Parent task ID is missing or invalid.");
      return;
    }
    if (!parentTaskDetails || parentTaskDetails.project_id === undefined || parentTaskDetails.project_id === null) {
      console.error("Attempted to open modal, but parentTaskDetails or project_id is missing/invalid. ParentDetails:", parentTaskDetails);
      toast.error("Cannot add sub-task: Parent task data or project ID is not fully loaded.");
      return;
    }
    console.log("All checks passed. Opening Add Sub Task Modal with taskId:", taskId, "projectId:", parentTaskDetails.project_id);
    setIsAddSubTaskModalOpen(true);
  };

  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = () => {
    if (taskId) fetchTaskData(false);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!taskId || typeof taskId !== 'string' || taskId.trim() === '') {
        toast.error("Cannot post comment: Task ID is missing or invalid.");
        return;
    }
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = Cookies.get("token");
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) {
        toast.error("Cannot post comment: Invalid Task ID format.");
        setIsSubmittingComment(false);
        return;
    }
    const commentPayload = { task_id: numericTaskId, comment_message: newComment };
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
      if (taskId) fetchTaskData(false);
    } catch (err) {
      console.error("Error posting comment:", err);
      setCommentError(err.message);
      toast.error(`Failed to post comment: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Initial loading state check based on presence AND validity of taskId
  if (loading && taskId && taskId.trim() !== "") return <LoadingState />;

  // If taskId is genuinely missing or invalid from URL after initial checks in useEffect
  if (!taskId || taskId.trim() === "") {
    console.error("Rendering ErrorState because taskId from useParams is invalid. Value:", taskId);
    return (
      <>
        <ToastContainer {...{ position:"top-right", autoClose:3000, style:toastContainerStyle }} />
        <ErrorState title="Invalid Task URL" message="No Task ID was provided or it is invalid in the URL." />
      </>
    );
  }

  // If error occurred, or task not found, or parentTaskDetails not loaded (even if taskId was present)
  if (error || !taskFound || !parentTaskDetails) {
    console.warn("Rendering ErrorState. Error:", error, "TaskFound:", taskFound, "ParentDetails:", parentTaskDetails);
    return (
      <>
        <ToastContainer {...{ position:"top-right", autoClose:3000, style:toastContainerStyle }} />
        <ErrorState title={taskFound ? "Error Loading Task" : "Task Not Found"} message={error || "Failed to load task details."} taskId={taskId} />
      </>
    );
  }
  
  const parentAssignee = parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0 ? parentTaskDetails.assignees[0].user : null;

  console.log("Rendering main TaskDetailsPage content. taskId:", taskId, "parentTaskDetails.project_id:", parentTaskDetails.project_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer {...{ position:"top-right", autoClose:3000, style:toastContainerStyle, newestOnTop: false, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme:"colored" }} />
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

      {/* Modal Rendering: ALL conditions must be met */}
      {isAddSubTaskModalOpen && 
       taskId && typeof taskId === 'string' && taskId.trim() !== '' && 
       parentTaskDetails && 
       (parentTaskDetails.project_id !== undefined && parentTaskDetails.project_id !== null) && 
       (
        (() => { 
          console.log("CONDITIONS MET FOR RENDERING MODAL: isAddSubTaskModalOpen:", isAddSubTaskModalOpen, "passing parentTaskId:", taskId, "passing projectId:", parentTaskDetails.project_id);
          return (
            <AddSubTaskModals
              isOpen={isAddSubTaskModalOpen}
              onClose={handleCloseAddSubTaskModal}
              parentTaskId={taskId} 
              projectId={parentTaskDetails.project_id} 
              onSubTaskAdded={handleSubTaskAdded}
            />
          );
        })()
      )}
    </div>
  );
};

export default TaskDetailsPage;