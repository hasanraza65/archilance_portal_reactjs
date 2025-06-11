// src/pages/app/projects/Task/TaskDetailsPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiPrefix } from "@/pages/utility/apiHelper";
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
  const [totalCommentsFromApi, setTotalCommentsFromApi] = useState(0);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);

  const toastContainerStyle = { zIndex: 10000 };
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  // ***** YEH PATHS AB HAR JAGAH ISTEMAL HONGE *****
  const apiPrefix = getApiPrefix();
  const taskApiPath = `/api/${apiPrefix}/project-task`;
  const commentApiPath = `/api/${apiPrefix}/task-comment`;
  const employeeListApiPath = `/api/${apiPrefix}/employee-user`;
  const bulkAssignApiPath = `/api/${apiPrefix}/bulk-assign`;
  
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
  
  const initialFetchAndSetup = async (currentTaskId) => {
    const authToken = getAuthToken();
    if (!authToken) return;

    try {
        // *** UPDATED: Using dynamic commentApiPath ***
        const response = await fetch(`${API_BASE_URL}${commentApiPath}?task_id=${currentTaskId}&page=1`, {
            headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json", Accept: "application/json" }
        });
        if (!response.ok) throw new Error("Failed to fetch initial comments");

        const apiResponse = await response.json();
        const fetchedComments = apiResponse.data && Array.isArray(apiResponse.data) ? apiResponse.data : [];
        const processedComments = fetchedComments.map(comment => ({
            ...comment,
            comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
            replies: Array.isArray(comment.replies) ? comment.replies : [],
        }));
        setComments(processedComments.reverse());
        setNextPageUrl(apiResponse.links?.next || apiResponse.next_page_url || null);
        setTotalCommentsFromApi(apiResponse.meta?.total || apiResponse.total || 0);
        setAllCommentsLoaded(!apiResponse.links?.next && !apiResponse.next_page_url);
    } catch(err) {
        toast.error(`Failed to load comments: ${err.message}`);
    }
  };


  const handleLoadOlderComments = async () => {
    if (!nextPageUrl || isLoadingOlderComments || !parentTaskDetails) return;
    
    const token = getAuthToken();
    if (!token) return;

    setIsLoadingOlderComments(true);
    try {
        const url = new URL(nextPageUrl);
        if (!url.searchParams.has('task_id')) {
            url.searchParams.set('task_id', taskId);
        }
        
        const response = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" }
        });

        if (!response.ok) throw new Error("Failed to fetch older comments.");
        
        const apiResponse = await response.json();
        const fetchedComments = apiResponse.data && Array.isArray(apiResponse.data) ? apiResponse.data : [];
        const processedComments = fetchedComments.map(comment => ({
            ...comment,
            comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
            replies: Array.isArray(comment.replies) ? comment.replies : [],
        }));
        const reversedBatch = processedComments.reverse();
        
        setComments(prev => [...reversedBatch, ...prev]);
        setNextPageUrl(apiResponse.links?.next || apiResponse.next_page_url || null);
        setAllCommentsLoaded(!apiResponse.links?.next && !apiResponse.next_page_url);

    } catch (err) {
        toast.error(err.message);
    } finally {
        setIsLoadingOlderComments(false);
    }
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

    const token = getAuthToken();
    if (!token) {
        if (showLoadingSpinner) setLoading(false);
        return;
    }

    try {
        // *** UPDATED: Using dynamic taskApiPath ***
        const response = await fetch(`${API_BASE_URL}${taskApiPath}/${taskId}`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });

        if (!response.ok) {
            const eData = await response.json().catch(() => ({}));
            throw new Error(eData.message || `Error ${response.status}`);
        }

        const data = await response.json();
        setParentTaskDetails(data);
        setSubTasks(data.sub_tasks || []);
        
        await initialFetchAndSetup(taskId);
        
    } catch (err) {
        setError(err.message || "An unknown error occurred.");
        setTaskFound(false);
    } finally {
        if (showLoadingSpinner) setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    const token = getAuthToken();
    if (!token) { setLoadingEmployees(false); return; }
    try {
      // *** UPDATED: Using dynamic employeeListApiPath ***
      const response = await fetch(`${API_BASE_URL}${employeeListApiPath}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setAllEmployees(Array.isArray(data) ? data : data?.data || []);
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
    const handleClickOutside = (event) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target))
        setIsPriorityDropdownOpen(false);
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target))
        setIsStatusDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdateTaskField = async (fieldName, value) => {
    setIsUpdatingField(true);
    const token = getAuthToken();
    if (!token) {
        setIsUpdatingField(false);
        return;
    }
    const fieldMapping = {
        status: 'task_status',
        priority: 'priority',
        description: 'task_description',
        dueDate: 'due_date'
    };
    const apiFieldName = fieldMapping[fieldName] || fieldName;
    const payload = { [apiFieldName]: value };
    try {
        const response = await fetch(`${API_BASE_URL}${taskApiPath}/${taskId}`, {
            method: "PUT",
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || "Failed to update the task.");
        toast.success(`Task ${fieldName.replace(/_/g, ' ')} updated successfully!`);
        await fetchTaskData(false); 
        if (fieldName === 'priority') setIsPriorityDropdownOpen(false);
        if (fieldName === 'status') setIsStatusDropdownOpen(false);
    } catch (err) {
        toast.error(`Update failed: ${err.message}`);
    } finally {
        setIsUpdatingField(false);
    }
  };

  const handleUpdateTaskAssignees = async (currentTaskId, selectedEmployeeIdsArray) => {
    if (!currentTaskId || isUpdatingAssignees) return;
    const token = getAuthToken();
    if (!token) return;
    
    setIsUpdatingAssignees(true);
    const formData = new FormData();
    formData.append("task_id", String(currentTaskId));
    
    if (selectedEmployeeIdsArray.length > 0) {
        selectedEmployeeIdsArray.forEach((id) => formData.append("employee_ids[]", String(id)));
    } else {
        formData.append("employee_ids[]", "");
    }

    try {
      const response = await fetch(`${API_BASE_URL}${bulkAssignApiPath}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          body: formData,
        });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        let errorMessage = responseData.message || "Failed to update assignees.";
        if (response.status === 422 && responseData.errors) {
            errorMessage = Object.values(responseData.errors).flat().join(' ');
        }
        throw new Error(errorMessage);
      }
      toast.success(responseData.message || "Assignees updated successfully!");
      await fetchTaskData(false);
      setIsAssigneeModalOpen(false);
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdatingAssignees(false);
    }
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
      // *** UPDATED: Using dynamic commentApiPath ***
      const response = await fetch(`${API_BASE_URL}${commentApiPath}`, {
        method: "POST",
        headers: isFormData ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : {
          Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json",
        },
        body: isFormData ? payload : JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to post comment (status ${response.status})`);
      }

      await initialFetchAndSetup(taskId);

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
      // *** UPDATED: Using dynamic commentApiPath ***
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${commentId}`, {
        method: "POST", 
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update comment (status ${response.status})`);
      }
      
      await initialFetchAndSetup(taskId);
      
      toast.success("Comment updated successfully!");
      return true;

    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment update failed: ${err.message}`);
      return false;
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentError(null);
    const token = getAuthToken();
    if (!token) return false;

    try {
      // *** UPDATED: Using dynamic commentApiPath ***
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.status !== 200 && response.status !== 204) {
          const responseData = await response.json().catch(() => ({}));
          throw new Error(responseData.message || `Failed to delete comment (status ${response.status})`);
      }
      
      await initialFetchAndSetup(taskId);
      
      return true;

    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment delete failed: ${err.message}`);
      return false;
    }
  };
  
  const onLoadRepliesForComment = async (parentCommentId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      // *** UPDATED: Using dynamic commentApiPath ***
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${parentCommentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: Could not load replies.`);
      }

      const fetchedParentCommentData = await response.json();
      const parentCommentDetail = fetchedParentCommentData.data || fetchedParentCommentData;
      
      setComments(prevComments => 
        prevComments.map(c => 
            c.id === parentCommentId ? { ...c, ...parentCommentDetail, replies_count: parentCommentDetail.replies?.length || 0 } : c
        )
      );

    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !taskFound || !parentTaskDetails)
    return (
        <ErrorState title={!taskFound ? "Task Not Found" : "Error"} message={error} />
    );

  const currentAssignees = parentTaskDetails.assignees || [];
  const currentAssigneeUserIds = currentAssignees.map(a => a?.user?.id).filter(id => id != null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <ToastContainer {...toastContainerStyle} position="top-right" autoClose={3000} theme="colored" />
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
              <TaskHeader
                 taskTitle={parentTaskDetails.task_title}
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
              onAddSubTaskClick={() => setIsAddSubTaskModalOpen(true)}
              parentTaskId={taskId}
              onSubTaskUpdated={async () => await fetchTaskData(false)}
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
      {isAddSubTaskModalOpen && parentTaskDetails && (
          <AddSubTaskModal
            isOpen={isAddSubTaskModalOpen}
            onClose={() => setIsAddSubTaskModalOpen(false)}
            parentTaskId={taskId}
            projectId={parentTaskDetails.project_id}
            onSubTaskAdded={async () => await fetchTaskData(false)}
          />
        )}
      {isAssigneeModalOpen && parentTaskDetails && !loadingEmployees && (
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