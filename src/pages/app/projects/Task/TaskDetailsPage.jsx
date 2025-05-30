// src/components/TaskDetails/TaskDetailsPage.jsx
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
import AssigneeModal from "./PartialTask/AssigneeModal";

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

  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);

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
      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        const sortedComments = (data.comments || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        setComments(sortedComments);
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

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Auth token missing for fetching employees.");
      setLoadingEmployees(false);
      setAllEmployees([]);
      return;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/employee-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch employees");
      }
      const data = await response.json();
      setAllEmployees(Array.isArray(data) ? data : (data && Array.isArray(data.data)) ? data.data : []);
    } catch (err) {
      toast.error(`Error fetching employees: ${err.message}`);
      setAllEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    setCurrentUserId(getUserIdFromCookie());
    if (taskId && taskId.trim() !== "") {
      fetchTaskData();
      fetchAllEmployees();
    } else {
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
      if (fieldName === "description") {
        payload["task_description"] = value;
      } else {
        payload[fieldName] = value;
      }
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
      if (updatedTaskFromServer && updatedTaskFromServer.id) {
        setParentTaskDetails(updatedTaskFromServer);
        if (updatedTaskFromServer.sub_tasks)
          setSubTasks(updatedTaskFromServer.sub_tasks);
        if (updatedTaskFromServer.comments) {
          const sortedComments = (updatedTaskFromServer.comments || []).sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          );
          setComments(sortedComments);
        }
      }
      toast.success(
        `${fieldName
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())} updated successfully!`
      );
    } catch (err) {
      setParentTaskDetails((prevDetails) => ({
        ...prevDetails,
        [fieldName]: originalValue,
      }));
      if (!fieldUpdateError) {
        setFieldUpdateError(err.message || `An unknown error occurred while updating ${fieldName}.`);
      }
    } finally {
      setIsUpdatingField(false);
      if (fieldName === "priority") setIsPriorityDropdownOpen(false);
      if (fieldName === "task_status") setIsStatusDropdownOpen(false);
    }
  };

  const handleUpdateTaskAssignees = async (
    currentTaskId,
    selectedEmployeeIdsArray
  ) => {
    if (!currentTaskId || isUpdatingAssignees) return;

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found. Please log in again.");
      return;
    }

    setIsUpdatingAssignees(true);

    const formData = new FormData();
    formData.append("task_id", String(currentTaskId));
    
    // ----- UPDATED LOGIC -----
    // Only append employee_ids[] if there are actual IDs to send.
    // If selectedEmployeeIdsArray is empty, the 'employee_ids[]' key will NOT be added to formData.
    if (selectedEmployeeIdsArray.length > 0) {
        selectedEmployeeIdsArray.forEach((id) => {
            formData.append("employee_ids[]", String(id));
        });
    }
    // If selectedEmployeeIdsArray.length is 0, no 'employee_ids[]' field is appended.
    // The backend should interpret this as "unassign all" for the given task_id.
    // ----- END OF UPDATED LOGIC -----

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/bulk-assign`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        let errorMessage = responseData.message || `Failed to update assignees (Status: ${response.status}).`;
        if (response.status === 422 && responseData.errors) {
            const validationErrors = Object.values(responseData.errors).flat().join(' ');
            errorMessage = `${errorMessage} Details: ${validationErrors}`;
        }
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(responseData.message || "Assignees updated successfully!");
      setIsAssigneeModalOpen(false);
      fetchTaskData(false); 
    } catch (err) {
      console.error("TaskDetailsPage: Error updating assignees:", err.message);
    } finally {
      setIsUpdatingAssignees(false);
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
    if (taskId) fetchTaskData(false);
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
    } else {
      requestBody = JSON.stringify(payload);
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment`,
        { method: "POST", headers, body: requestBody }
      );
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to post comment (status ${response.status})`
        );
      }
      if (taskId) fetchTaskData(false);
      setNewComment("");
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
    setCommentError(null);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found.");
      return false;
    }
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
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to update comment (status ${response.status})`
        );
      }
      toast.success(responseData.message || "Comment updated!");
      if (taskId) fetchTaskData(false);
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment update failed: ${err.message}`);
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError(null);
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authorization token not found.");
      return false;
    }
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
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to delete comment (status ${response.status})`
        );
      }
      toast.success(responseData.message || "Comment deleted!");
      if (taskId) fetchTaskData(false);
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment delete failed: ${err.message}`);
      return false;
    }
  };

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

  const currentAssignees = parentTaskDetails.assignees || [];
  const currentAssigneeUserIds = currentAssignees
    .map(assigneeLinkObject => {
      if (assigneeLinkObject && assigneeLinkObject.user && assigneeLinkObject.user.id != null) {
        return Number(assigneeLinkObject.user.id);
      }
      return null; 
    })
    .filter(id => id !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ToastContainer
        {...{
          ...toastContainerStyle,
          position: "top-right", autoClose: 5000, hideProgressBar: false, newestOnTop: false,
          closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "colored",
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
                currentAssignees={currentAssignees} 
                onOpenAssigneeModal={() => setIsAssigneeModalOpen(true)}
                isPriorityDropdownOpen={isPriorityDropdownOpen}
                setIsPriorityDropdownOpen={setIsPriorityDropdownOpen}
                priorityDropdownRef={priorityDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
              />
            </div>
            <SubTaskList
              subTasks={subTasks}
              onAddSubTaskClick={handleOpenAddSubTaskModal}
              parentTaskId={taskId}
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
            parentTaskId={taskId}
            projectId={parentTaskDetails.project_id}
            onSubTaskAdded={handleSubTaskAdded}
          />
        )}

      {isAssigneeModalOpen && parentTaskDetails && (
        <AssigneeModal
          isOpen={isAssigneeModalOpen}
          onClose={() => setIsAssigneeModalOpen(false)}
          allEmployees={allEmployees}
          currentAssigneeIds={currentAssigneeUserIds}
          onSaveAssignees={handleUpdateTaskAssignees}
          taskId={parentTaskDetails.id}
          isUpdating={isUpdatingAssignees} 
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;