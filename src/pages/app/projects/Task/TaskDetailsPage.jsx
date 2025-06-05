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
import TaskAttachments from "./PartialTask/TaskAttachments";

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);

  const [comments, setComments] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCommentsFromApi, setTotalCommentsFromApi] = useState(0);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);

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

  const getAuthToken = () => {
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication token missing. Please log in.");
      navigate("/login");
      return null;
    }
    return token;
  };


  const fetchTaskComments = async (
    currentTaskId,
    authToken,
    fetchUrl = null,
    isFetchingOlder = false
  ) => {
    if (!currentTaskId || !authToken) {
    
      return;
    }
    const urlToFetch =
      fetchUrl ||
      `${
        import.meta.env.VITE_BACKEND_BASE_URL
      }/api/admin/task-comment?task_id=${currentTaskId}&page=1`;
    
    if (isFetchingOlder) setIsLoadingOlderComments(true);
    else if (!isFetchingOlder && comments.length === 0) {
       
        setIsLoadingOlderComments(true); 
    }


    try {
      const response = await fetch(urlToFetch, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const eData = await response
          .json()
          .catch(() => ({ message: `Server error ${response.status}` }));
        throw new Error(
          eData.message || `Error ${response.status}: Failed to fetch comments.`
        );
      }

      const commentsApiResponse = await response.json();
      const fetchedCommentsData =
        commentsApiResponse.data && Array.isArray(commentsApiResponse.data)
          ? commentsApiResponse.data
          : [];
      
      const processedComments = fetchedCommentsData.map(comment => ({
          ...comment,
          comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
          replies: Array.isArray(comment.replies) ? comment.replies : [],
      }));


      const chronologicallyOrderedBatch = processedComments.reverse();

      setComments((prevComments) => {
        if (isFetchingOlder) {
          const existingIds = new Set(prevComments.map(c => c.id));
          const newUniqueOlderComments = chronologicallyOrderedBatch.filter(c => !existingIds.has(c.id));
          return [...newUniqueOlderComments, ...prevComments];
        } else {
          return chronologicallyOrderedBatch;
        }
      });

      setNextPageUrl(commentsApiResponse.next_page_url || null);
      setCurrentPage(commentsApiResponse.current_page || 1);
      setTotalCommentsFromApi(commentsApiResponse.total || 0);
      setAllCommentsLoaded(commentsApiResponse.next_page_url === null);
    } catch (err) {
      toast.error(`Failed to load comments: ${err.message}`);
      if (!isFetchingOlder) {
        setComments([]);
        setAllCommentsLoaded(true); 
      }
    } finally {
      setIsLoadingOlderComments(false);
    }
  };

  const handleLoadOlderComments = async () => {
    if (!nextPageUrl || isLoadingOlderComments || !parentTaskDetails) return;
    const token = getAuthToken();
    if (!token) return;
    
    try {
      await fetchTaskComments(parentTaskDetails.id, token, nextPageUrl, true);
    } catch (err) {
    }
  };

  const fetchTaskData = async (
    showLoadingSpinner = true,
    isRefresh = false
  ) => {
    if (!taskId) {
      setError("Task ID is missing from URL.");
      if (showLoadingSpinner) setLoading(false);
      setTaskFound(false);
      return;
    }
    if (showLoadingSpinner) setLoading(true);
    if (!isRefresh) setError(null); 
    setTaskFound(true);
    
    const token = getAuthToken();
    if (!token) {
        if (showLoadingSpinner) setLoading(false);
        setTaskFound(false);
       
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
        if (response.status === 404) {
          setError(`Task with ID ${taskId} not found.`);
        } else {
          setError(
            `Error ${response.status}: ${
              eData.message || response.statusText
            } (fetching task details)`
          );
        }
        setTaskFound(false);
        setComments([]);
        setAllCommentsLoaded(true); 
        return;
      }
      const data = await response.json();

      if (data && data.id) {
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        if (isRefresh) {
            setComments([]); 
            setNextPageUrl(null);
            setCurrentPage(1);
            setAllCommentsLoaded(false);
        }
        await fetchTaskComments(taskId, token, null, false); 
        setTaskFound(true);
      } else {
        setError("Invalid task data received from API.");
        setTaskFound(false);
        setComments([]);
        setAllCommentsLoaded(true);
      }
    } catch (err) {
      setError(
        err.message ||
          "An unknown error occurred while fetching task data or comments."
      );
      setTaskFound(false);
      setComments([]);
      setAllCommentsLoaded(true);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    const token = getAuthToken();
    if (!token) {
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
      setAllEmployees(
        Array.isArray(data)
          ? data
          : data && Array.isArray(data.data)
          ? data.data
          : []
      );
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
      setComments([]);
      setAllCommentsLoaded(true);
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
    const token = getAuthToken();
    if (!token) return;

    setIsUpdatingField(true);
    setFieldUpdateError(null); 
    const originalValue = parentTaskDetails[fieldName];
    setParentTaskDetails((prev) => ({ ...prev, [fieldName]: value })); 
    try {
      const payload =
        fieldName === "description"
          ? { task_description: value }
          : { [fieldName]: value };
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
      const responseData = await response.json().catch(() => ({})); 
      if (!response.ok) {
        setParentTaskDetails((prev) => ({...prev, [fieldName]: originalValue,}));
        const errMsg = responseData.message || `Failed to update ${fieldName}. Status: ${response.status}`;
        setFieldUpdateError(errMsg);
        toast.error(errMsg);
        return;
      }

      if (responseData && responseData.id) {
        setParentTaskDetails(responseData); 
        if (responseData.sub_tasks) setSubTasks(responseData.sub_tasks);
        toast.success(
          `${fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} updated successfully!`
        );
      } else {
        toast.warn("Task field updated, but server response was incomplete. Refreshing task data.");
        await fetchTaskData(false, true);
      }
    } catch (err) {
     
      setParentTaskDetails((prevDetails) => {
        if (prevDetails && prevDetails[fieldName] !== originalValue) {
          return { ...prevDetails, [fieldName]: originalValue };
        }
        return prevDetails;
      });
      if (!fieldUpdateError) { 
        const defaultMsg = `An unknown error occurred while updating ${fieldName}.`;
        setFieldUpdateError(err.message || defaultMsg);
        toast.error(err.message || defaultMsg);
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
    const token = getAuthToken();
    if (!token) return;

    setIsUpdatingAssignees(true);
    const formData = new FormData();
    formData.append("task_id", String(currentTaskId));
    if (selectedEmployeeIdsArray.length > 0) {
      selectedEmployeeIdsArray.forEach((id) =>
        formData.append("employee_ids[]", String(id))
      );
    } else {
   
        formData.append("employee_ids[]", ""); 
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/bulk-assign`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", },
          body: formData,
        }
      );
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        let errorMessage = responseData.message || `Failed to update assignees (Status: ${response.status}).`;
        if (response.status === 422 && responseData.errors) {
          const validationErrors = Object.values(responseData.errors).flat().join(" ");
          errorMessage = `${errorMessage} Details: ${validationErrors}`;
        }
        toast.error(errorMessage);
        return;
      }
      toast.success(responseData.message || "Assignees updated successfully!");
      setIsAssigneeModalOpen(false);
      await fetchTaskData(false, true); 
    } catch (err) {
      
    } finally {
      setIsUpdatingAssignees(false);
    }
  };

  const handleOpenAddSubTaskModal = () => {
    if (!taskId || !parentTaskDetails || parentTaskDetails.project_id == null) {
      toast.error("Cannot add sub-task: Parent task data incomplete.");
      return;
    }
    setIsAddSubTaskModalOpen(true);
  };
  const handleCloseAddSubTaskModal = () => setIsAddSubTaskModalOpen(false);
  const handleSubTaskAdded = async () => { 
    if (taskId) await fetchTaskData(false, true);
  };

  const handleCommentSubmit = async (payload, isFormData) => {
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = getAuthToken();
    if (!token) {
      setIsSubmittingComment(false);
      return false;
    }
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment`,
        {
          method: "POST",
          headers: isFormData
            ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
            : {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
          body: isFormData ? payload : JSON.stringify(payload),
        }
      );
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to post comment (status ${response.status})`
        );
      }
      if (taskId) {
        setComments([]); 
        setNextPageUrl(null);
        setCurrentPage(1);
        setAllCommentsLoaded(false);
        await fetchTaskComments(taskId, token, null, false); 
      }
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

  const handleEditComment = async (commentId, formData) => {
    setCommentError(null);
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment/${commentId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", },
          body: formData, 
        }
      );
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update comment (status ${response.status})`);
      }
      if (taskId) {
        setComments([]); 
        setNextPageUrl(null);
        setCurrentPage(1);
        setAllCommentsLoaded(false);
        await fetchTaskComments(taskId, token, null, false); 
      }
      toast.success("Comment updated successfully!");
      return true;
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment update failed: ${err.message}`);
      return false;
    } finally {
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError(null);
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment/${commentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json", },
        }
      );
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to delete comment (status ${response.status})`);
      }
      if (taskId) {
         setComments([]); 
         setNextPageUrl(null);
         setCurrentPage(1);
         setAllCommentsLoaded(false);
        await fetchTaskComments(taskId, token, null, false); 
      }
      return true; 
    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment delete failed: ${err.message}`);
      return false;
    }
  };

  // <<<< NEW FUNCTION to load replies for a specific comment >>>>
  const onLoadRepliesForComment = async (parentCommentId) => {
    const token = getAuthToken();
    if (!token || !parentTaskDetails) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/task-comment/${parentCommentId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response." }));
        toast.error(errorData.message || `Error ${response.status}: Could not load replies.`);
        throw new Error(`API error: ${response.status}`);
      }

      const fetchedParentCommentData = await response.json();
      const parentCommentDetail = fetchedParentCommentData.data || fetchedParentCommentData;
      
      const newRepliesFromApi = (parentCommentDetail.replies || []).map(reply => ({
          ...reply,
          comment_attachments: Array.isArray(reply.comment_attachments) ? reply.comment_attachments : [],
      }));


      setComments(prevComments => {
        const existingCommentIds = new Set(prevComments.map(c => c.id));
        
        const trulyNewReplies = newRepliesFromApi
          .filter(reply => !existingCommentIds.has(reply.id))
          .map(reply => ({
            ...reply,
            reply_to: parentCommentId,
            task_id: reply.task_id || parentCommentDetail.task_id || taskId,
          }));

        let updatedCommentsList = [...prevComments];
        const parentIndex = updatedCommentsList.findIndex(c => c.id === parentCommentId);

        if (parentIndex !== -1) {
          const { replies, ...updatedParentFields } = parentCommentDetail;
          updatedCommentsList[parentIndex] = {
            ...updatedCommentsList[parentIndex],
            ...updatedParentFields,
            replies_count: parentCommentDetail.replies_count !== undefined 
                           ? parentCommentDetail.replies_count 
                           : updatedCommentsList[parentIndex].replies_count,
          };
        }

        if (trulyNewReplies.length > 0) {
          updatedCommentsList = [...updatedCommentsList, ...trulyNewReplies];
        }
        
       
        return updatedCommentsList;
      });

    } catch (error) {
      console.error(`Failed to process replies for comment ${parentCommentId}:`, error);
     
    }
  };


  if (loading && taskId && taskId.trim() !== "") return <LoadingState />;
  if (!taskId || taskId.trim() === "")
    return (
      <>
        <ToastContainer {...toastContainerStyle} />
        <ErrorState title="Invalid Task URL" message="No Task ID was provided or it is invalid in the URL." />
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
    .map((a) => (a?.user?.id != null ? Number(a.user.id) : null))
    .filter((id) => id !== null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 dark:from-slate-800 dark:to-slate-900">
      <ToastContainer
        {...{
          ...toastContainerStyle,
          position: "top-right", autoClose: 3000, hideProgressBar: false,
          newestOnTop: true, closeOnClick: true, rtl: false,
          pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "colored",
        }}
      />
      <div className="container mx-auto px-4 py-6">
        {fieldUpdateError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-lg text-sm shadow dark:bg-red-900/30 dark:text-red-300 dark:border-red-700">
            <strong>Update Issue:</strong> {fieldUpdateError}
          </div>
        )}
        {isUpdatingField && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-sm shadow animate-pulse dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
            Updating task field...
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
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
                onDescriptionUpdate={(newDescription) => handleUpdateTaskField("description", newDescription)}
                isUpdatingField={isUpdatingField}
              />
            </div>
            <SubTaskList
              subTasks={subTasks}
              onAddSubTaskClick={handleOpenAddSubTaskModal}
              parentTaskId={taskId}
              onSubTaskUpdated={async () => await fetchTaskData(false, true)}
            />
            <TaskAttachments attachments={parentTaskDetails?.attachments} />
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
              onLoadOlderComments={handleLoadOlderComments}
              isLoadingOlderComments={isLoadingOlderComments}
              allCommentsLoaded={allCommentsLoaded}
              totalCommentsFromApi={totalCommentsFromApi}
              onLoadRepliesForComment={onLoadRepliesForComment} 
            />
          </div>
        </div>
      </div>
      {isAddSubTaskModalOpen && parentTaskDetails && parentTaskDetails.project_id != null && (
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