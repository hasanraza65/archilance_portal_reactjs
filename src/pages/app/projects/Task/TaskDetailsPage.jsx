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
import AddSubTaskModal from "./PartialTask/AddSubTaskModal";

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [isUpdatingField, setIsUpdatingField] = useState(false);

  const [taskFound, setTaskFound] = useState(true);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);

  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  const toastContainerStyle = { zIndex: 10000 };

  const getUserIdFromCookie = () => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const userData = JSON.parse(userCookie);
        return userData.id;
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
    setError(null);
    setTaskFound(true);
    const token = Cookies.get("token");
    if (!token) {
      setError("Authorization token not found. Please log in.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      navigate("/login");
      return;
    }

    console.log(`Fetching task data for taskId: ${taskId}`);
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
        const eData = await response
          .json()
          .catch(() => ({ message: `Server error ${response.status}` }));
        if (response.status === 404)
          setError(`Task with ID ${taskId} not found.`);
        else
          setError(
            `Error ${response.status}: ${eData.message || response.statusText}`
          );
        setTaskFound(false);
        if (showLoadingSpinner) setLoading(false);
        return;
      }
      const data = await response.json();
      console.log("TaskDetailsPage: Fetched Task Data:", data); // Log the full data

      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        // Log sub_tasks to check for attachments
        console.log("TaskDetailsPage: Sub-tasks from fetched data:", data.sub_tasks);
        if (data.sub_tasks && data.sub_tasks.length > 0) {
            data.sub_tasks.forEach((sub, index) => {
                console.log(`TaskDetailsPage: Sub-task ${index} attachments:`, sub.attachments);
            });
        }

        const sortedComments = (data.comments || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at) // Sort ascending for chronological order
        );
        setComments(sortedComments);
        // Log comments to check for comment_attachments
        console.log("TaskDetailsPage: Comments from fetched data:", sortedComments);
         if (sortedComments && sortedComments.length > 0) {
            sortedComments.forEach((comment, index) => {
                console.log(`TaskDetailsPage: Comment ${index} comment_attachments:`, comment.comment_attachments);
            });
        }

        setTaskFound(true);
      } else {
        setError("Invalid task data received from API.");
        setTaskFound(false);
      }
    } catch (err) {
      setError(
        err.message || "An unknown error occurred while fetching task details."
      );
      setTaskFound(false);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUserId(getUserIdFromCookie());
    if (taskId && taskId.trim() !== "") fetchTaskData();
    else {
      setLoading(false);
      setError("Task ID is missing or invalid in the URL.");
      setTaskFound(false);
    }
  }, [taskId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target)
      )
        setIsPriorityDropdownOpen(false);
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      )
        setIsStatusDropdownOpen(false);
    }
    if (isPriorityDropdownOpen || isStatusDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPriorityDropdownOpen, isStatusDropdownOpen]);

  const handleUpdateTaskField = async (fieldName, value) => {
    if (!parentTaskDetails || isUpdatingField) return;

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found. Please log in again.");
      return;
    }

    setIsUpdatingField(true);
    setFieldUpdateError(null);

    const originalValue = parentTaskDetails[fieldName];
    setParentTaskDetails((prevDetails) => ({
      ...prevDetails,
      [fieldName]: value,
    }));

    try {
      const payload = {};
      // API might expect 'task_description' instead of 'description'
      if (fieldName === "description") {
        payload["task_description"] = value;
      } else {
        payload[fieldName] = value;
      }
      
      console.log(`TaskDetailsPage: Updating task field '${fieldName}' with payload:`, payload);

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project-task/${
          parentTaskDetails.id
        }`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to update task field." }));
        setParentTaskDetails((prevDetails) => ({
          ...prevDetails,
          [fieldName]: originalValue,
        }));
        const errorMessage =
          errorData.message ||
          `Failed to update ${fieldName}. Status: ${response.status}`;
        setFieldUpdateError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedTaskFromServer = await response.json();
      console.log("TaskDetailsPage: Task field updated, server response:", updatedTaskFromServer);

      // It's crucial to update the state with the server's response
      // to ensure consistency, especially if the server modifies data
      // or if other fields were updated by the backend logic.
      if (updatedTaskFromServer && updatedTaskFromServer.id) {
          setParentTaskDetails(updatedTaskFromServer);
          // If sub_tasks or comments could be affected by this update, refresh them too
          if (updatedTaskFromServer.sub_tasks) setSubTasks(updatedTaskFromServer.sub_tasks);
          if (updatedTaskFromServer.comments) {
              const sortedComments = (updatedTaskFromServer.comments || []).sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
              );
              setComments(sortedComments);
          }
      } else {
          // If API only returns success or minimal data, the optimistic update is fine,
          // but it's less robust. Consider re-fetching if this happens often.
          console.warn("TaskDetailsPage: Field update API did not return the full updated task object.");
      }

      toast.success(
        `${fieldName
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())} updated successfully!`
      );
    } catch (err) {
      console.error(`TaskDetailsPage: Error updating ${fieldName}:`, err);
      setParentTaskDetails((prevDetails) => ({ // Ensure reversion on any error
        ...prevDetails,
        [fieldName]: originalValue,
      }));
      if (!fieldUpdateError) { // Only set if not already set by API error
        const generalErrorMessage = err.message || `An unknown error occurred while updating ${fieldName}.`;
        setFieldUpdateError(generalErrorMessage);
        // toast.error(generalErrorMessage); // Toast is likely already shown for API error
      }
    } finally {
      setIsUpdatingField(false);
      if (fieldName === "priority") setIsPriorityDropdownOpen(false);
      if (fieldName === "task_status") setIsStatusDropdownOpen(false);
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
  
  const handleSubTaskAdded = () => {
    console.log("TaskDetailsPage: Sub-task added, re-fetching task data.");
    if (taskId) fetchTaskData(false); // Re-fetch parent task data, which should include new sub-task with attachments
  };

  const handleCommentSubmit = async (payload, isFormData) => {
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Auth token missing.");
      setIsSubmittingComment(false);
      return false;
    }
    let requestBody;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (isFormData) {
        requestBody = payload;
        // For FormData, 'Content-Type' is set automatically by the browser
    }
    else {
      requestBody = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    }

    console.log("TaskDetailsPage: Submitting new comment. Is FormData:", isFormData, "Payload:", payload);
    // If FormData, you can iterate to log its content:
    if (isFormData) {
        for (let [key, value] of payload.entries()) {
            console.log(`TaskDetailsPage: FormData entry: ${key}:`, value);
        }
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment`,
        { method: "POST", headers, body: requestBody }
      );

      const responseData = await response.json().catch(() => ({})); // Attempt to parse JSON always
      console.log("TaskDetailsPage: API response for new comment:", responseData);


      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to post comment (status ${response.status})`
        );
      }
      
      // The API should ideally return the newly created comment object with its attachments.
      // If it does, we could optimistically update:
      // if (responseData.comment && responseData.comment.id) {
      //   setComments(prevComments => [...prevComments, responseData.comment].sort( (a, b) => new Date(a.created_at) - new Date(b.created_at)));
      //   console.log("TaskDetailsPage: Optimistically added new comment:", responseData.comment);
      // } else {
      //   // If not, fall back to re-fetching
      //   console.log("TaskDetailsPage: New comment API response did not include full comment object, re-fetching all task data.");
      //   if (taskId) fetchTaskData(false);
      // }
      // For simplicity and consistency, re-fetching is often safer if unsure about API response structure.
      if (taskId) fetchTaskData(false);


      setNewComment(""); // Clear the input field
      toast.success(responseData.message || "Comment posted!");
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Failed to post comment: ${err.message}`);
      return false;
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    // ... (Keep existing logic, but ensure fetchTaskData(false) is called on success)
    setCommentError(null);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found.");
      return false;
    }
    console.log(`TaskDetailsPage: Editing comment ID ${commentId} with text: "${newText}"`);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/admin/task-comment/${commentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ comment_message: newText }),
        }
      );
      const responseData = await response.json().catch(() => ({}));
      console.log("TaskDetailsPage: API response for editing comment:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to update comment (status ${response.status})`
        );
      }
      toast.success(responseData.message || "Comment updated!");
      if (taskId) fetchTaskData(false); // Re-fetch to get updated comment list
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment update failed: ${err.message}`);
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    // ... (Keep existing logic, but ensure fetchTaskData(false) is called on success)
    setCommentError(null);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found.");
      return false;
    }
    console.log(`TaskDetailsPage: Deleting comment ID ${commentId}`);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_BASE_URL
        }/api/admin/task-comment/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      const responseData = await response.json().catch(() => ({})); // Try to parse JSON, default if fails
      console.log("TaskDetailsPage: API response for deleting comment:", responseData);

      if (!response.ok) {
         // Check if there's a message in responseData, otherwise use a generic error
        throw new Error(
          responseData.message ||
            `Failed to delete comment (status ${response.status})`
        );
      }
      toast.success(responseData.message || "Comment deleted!");
      if (taskId) fetchTaskData(false); // Re-fetch to get updated comment list
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment delete failed: ${err.message}`);
      return false;
    }
  };

  // ---- Render logic ----
  if (loading && taskId && taskId.trim() !== "") return <LoadingState />;
  if (!taskId || taskId.trim() === "")
    return (
      <>
        <ToastContainer {...toastContainerStyle} />
        <ErrorState
          title="Invalid Task URL"
          message="No Task ID was provided or it is invalid in the URL."
        />
      </>
    );
  if (error || !taskFound || !parentTaskDetails)
    return (
      <>
        <ToastContainer {...toastContainerStyle} />
        <ErrorState
          title={taskFound ? "Error Loading Task" : "Task Not Found"}
          message={error || "Failed to load task details."}
          taskId={taskId}
        />
      </>
    );

  const parentAssignee =
    parentTaskDetails.assignees && parentTaskDetails.assignees.length > 0
      ? parentTaskDetails.assignees[0].user
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer
        {...{
          ...toastContainerStyle,
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          newestOnTop: false,
          closeOnClick: true,
          rtl: false,
          pauseOnFocusLoss: true,
          draggable: true,
          pauseOnHover: true,
          theme: "colored",
        }}
      />
      <div className="container mx-auto px-4 py-6">
        {fieldUpdateError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm shadow">
            <strong>Update Issue:</strong> {fieldUpdateError}
          </div>
        )}
        {isUpdatingField && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-sm shadow animate-pulse">
            Updating task field...
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
                isUpdatingField={isUpdatingField}
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
                onDescriptionSave={(newDescription) =>
                  handleUpdateTaskField("description", newDescription) // Ensure 'description' is the field name your handleUpdateTaskField expects or map it there
                }
                isUpdatingField={isUpdatingField}
              />
            </div>
            <SubTaskList
              subTasks={subTasks} // This will now have sub-tasks with attachments if API provides them
              onAddSubTaskClick={handleOpenAddSubTaskModal}
              parentTaskId={taskId} // Pass parentTaskId if needed by SubTaskList for operations
            />
          </div>
          <div className="lg:col-span-1">
            <CommentList
              comments={comments} // This will have comments with attachments if API provides them
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit}
              isSubmittingComment={isSubmittingComment}
              commentError={commentError}
              taskId={taskId}
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>

      {isAddSubTaskModalOpen &&
        taskId &&
        parentTaskDetails &&
        parentTaskDetails.project_id != null && (
          <AddSubTaskModal
            isOpen={isAddSubTaskModalOpen}
            onClose={handleCloseAddSubTaskModal}
            parentTaskId={taskId} // This is correct
            projectId={parentTaskDetails.project_id} // This is correct
            onSubTaskAdded={handleSubTaskAdded}
          />
        )}
    </div>
  );
};

export default TaskDetailsPage;