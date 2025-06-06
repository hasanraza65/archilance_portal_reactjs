// src/components/TaskDetails/TaskDetailsPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // Task & Sub-task state
  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);

  // Comment state
  const [comments, setComments] = useState([]);
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [totalCommentsFromApi, setTotalCommentsFromApi] = useState(0);
  const [isLoadingOlderComments, setIsLoadingOlderComments] = useState(false);
  const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // General page state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskFound, setTaskFound] = useState(true);

  // Field update state
  const [fieldUpdateError, setFieldUpdateError] = useState(null);
  const [isUpdatingField, setIsUpdatingField] = useState(false);

  // Modal & Dropdown state
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  // Employee/Assignee state
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);

  const toastContainerStyle = { zIndex: 10000 };
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

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
  
  // <<< REFINED: Centralized fetch for comments >>>
  const fetchTaskComments = useCallback(
    async (
      currentTaskId,
      authToken,
      fetchUrl = null,
      isFetchingOlder = false
    ) => {
      if (!currentTaskId || !authToken) return;
      
      const urlToFetch = fetchUrl || `${API_BASE_URL}/api/admin/task-comment?task_id=${currentTaskId}&page=1`;
      
      if (isFetchingOlder) setIsLoadingOlderComments(true);

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
          const eData = await response.json().catch(() => ({ message: `Server error ${response.status}` }));
          throw new Error(eData.message || `Error ${response.status}: Failed to fetch comments.`);
        }

        const apiResponse = await response.json();
        const fetchedComments = apiResponse.data && Array.isArray(apiResponse.data) ? apiResponse.data : [];
        
        // Ensure API data has a consistent shape
        const processedComments = fetchedComments.map(comment => ({
          ...comment,
          comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
          replies: Array.isArray(comment.replies) ? comment.replies : [],
        }));
        
        // API often returns newest first. Reverse to get chronological order for prepending.
        const chronologicallyOrderedBatch = processedComments.reverse();

        setComments((prevComments) => {
          if (isFetchingOlder) {
            const existingIds = new Set(prevComments.map(c => c.id));
            const newUniqueOlderComments = chronologicallyOrderedBatch.filter(c => !existingIds.has(c.id));
            return [...newUniqueOlderComments, ...prevComments];
          }
          return chronologicallyOrderedBatch; // Initial load
        });

        setNextPageUrl(apiResponse.links?.next || apiResponse.next_page_url || null);
        setTotalCommentsFromApi(apiResponse.meta?.total || apiResponse.total || 0);
        setAllCommentsLoaded(!apiResponse.links?.next && !apiResponse.next_page_url);

      } catch (err) {
        toast.error(`Failed to load comments: ${err.message}`);
        if (!isFetchingOlder) {
            setComments([]);
            setAllCommentsLoaded(true); 
        }
      } finally {
        setIsLoadingOlderComments(false);
      }
    }, []
  );

  const handleLoadOlderComments = useCallback(async () => {
    if (!nextPageUrl || isLoadingOlderComments || !parentTaskDetails) return;
    const token = getAuthToken();
    if (!token) return;
    await fetchTaskComments(parentTaskDetails.id, token, nextPageUrl, true);
  }, [nextPageUrl, isLoadingOlderComments, parentTaskDetails, fetchTaskComments]);

  const fetchTaskData = useCallback(async (showLoadingSpinner = true, isRefresh = false) => {
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
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/project-task/${taskId}`, {
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
        
        // Reset and fetch comments
        setComments([]);
        setNextPageUrl(null);
        setAllCommentsLoaded(false);
        await fetchTaskComments(taskId, token);
        
    } catch (err) {
        setError(err.message || "An unknown error occurred.");
        setTaskFound(false);
    } finally {
        if (showLoadingSpinner) setLoading(false);
    }
  }, [taskId, fetchTaskComments]);


  const fetchAllEmployees = useCallback(async () => {
    setLoadingEmployees(true);
    const token = getAuthToken();
    if (!token) { setLoadingEmployees(false); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/employee-user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Failed to fetch employees");
      const data = await response.json();
      setAllEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error(`Error fetching employees: ${err.message}`);
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    setCurrentUserId(getUserIdFromCookie());
    if (taskId) {
      fetchTaskData();
      fetchAllEmployees();
    } else {
      setLoading(false);
      setError("Task ID is missing.");
      setTaskFound(false);
    }
  }, [taskId, fetchTaskData, fetchAllEmployees]);

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
    // ... (Your existing logic is good, no changes needed here)
  };

  const handleUpdateTaskAssignees = async (currentTaskId, selectedEmployeeIdsArray) => {
    // ... (Your existing logic is good, no changes needed here)
  };
  
  // <<< CHANGED: More efficient comment submission >>>
  const handleCommentSubmit = async (payload, isFormData) => {
    setIsSubmittingComment(true);
    setCommentError(null);
    const token = getAuthToken();
    if (!token) {
      setIsSubmittingComment(false);
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/task-comment`, {
        method: "POST",
        headers: isFormData ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: isFormData ? payload : JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to post comment (status ${response.status})`);
      }

      // Instead of refetching, add the new comment directly to state
      const newCommentData = responseData.data || responseData;
      setComments((prevComments) => [...prevComments, newCommentData]);
      setTotalCommentsFromApi(prev => prev + 1);
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

  // <<< CHANGED: More efficient comment editing >>>
  const handleEditComment = async (commentId, formData) => {
    setCommentError(null);
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/task-comment/${commentId}`, {
        method: "POST", // HTML forms don't support PUT with FormData, so backend uses POST with _method
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Failed to update comment (status ${response.status})`);
      }
      
      // Instead of refetching, find and update the comment in state
      const updatedComment = responseData.data || responseData;
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      
      toast.success("Comment updated successfully!");
      return true;

    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment update failed: ${err.message}`);
      return false;
    }
  };

  // <<< CHANGED: More efficient comment deletion >>>
  const handleDeleteComment = async (commentId) => {
    setCommentError(null);
    const token = getAuthToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/task-comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.status !== 200 && response.status !== 204) {
          const responseData = await response.json().catch(() => ({}));
          throw new Error(responseData.message || `Failed to delete comment (status ${response.status})`);
      }
      
      // Instead of refetching, filter out the deleted comment
      setComments(prev => prev.filter(c => c.id !== commentId));
      setTotalCommentsFromApi(prev => prev - 1);
      
      return true;

    } catch (err) {
      setCommentError(err.message);
      toast.error(`Comment delete failed: ${err.message}`);
      return false;
    }
  };
  
  // <<< NEW: Function to load replies for a specific comment >>>
  const onLoadRepliesForComment = async (parentCommentId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/task-comment/${parentCommentId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: Could not load replies.`);
      }

      const fetchedParentCommentData = await response.json();
      const parentCommentDetail = fetchedParentCommentData.data || fetchedParentCommentData;
      const newRepliesFromApi = parentCommentDetail.replies || [];

      setComments(prevComments => {
        const existingCommentIds = new Set(prevComments.map(c => c.id));
        const trulyNewReplies = newRepliesFromApi.filter(reply => !existingCommentIds.has(reply.id));
        
        // Update the parent comment's data (e.g., replies_count) in the list
        const updatedList = prevComments.map(c => {
            if (c.id === parentCommentId) {
                return { ...c, ...parentCommentDetail };
            }
            return c;
        });

        // Add the new replies to the main flat list
        return [...updatedList, ...trulyNewReplies];
      });

    } catch (error) {
      console.error(`Failed to process replies for comment ${parentCommentId}:`, error);
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
      {isAddSubTaskModalOpen && parentTaskDetails && (
          <AddSubTaskModal
            isOpen={isAddSubTaskModalOpen}
            onClose={() => setIsAddSubTaskModalOpen(false)}
            parentTaskId={taskId}
            projectId={parentTaskDetails.project_id}
            onSubTaskAdded={async () => await fetchTaskData(false, true)}
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