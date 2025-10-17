import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

import { useAuth } from "../../../../context/AuthContext";
import { useBreadcrumbs } from "../../../../components/ui/BreadcrumbsContext";
import {
  getApiPrefix,
  getUserRole,
  getEmployeeType,
} from "@/pages/utility/apiHelper";

import TaskHeader from "./PartialTask/TaskHeader";
import TaskMetadata from "./PartialTask/TaskMetadata";
import SubTaskList from "./PartialTask/SubTaskList";
import CommentList from "./PartialTask/CommentList";
import LoadingState from "./PartialTask/LoadingState";
import ErrorState from "./PartialTask/ErrorState";
import AddSubTaskModal from "./PartialTask/AddSubTaskModal";
import AssigneeModal from "./PartialTask/AssigneeModal";
import TaskAttachments from "./PartialTask/TaskAttachments";
import EditTaskModal from "./PartialTask/EditTaskModal";
import TaskBriefsSection from "../TaskBrief/TaskBriefDetail";
import TimeLogSummary from "./PartialTask/TimeLogSummary";

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const jobId = location.state?.jobId;
  const currentUserRole = getUserRole();

  const { user } = useAuth();
  const { setBreadcrumbs } = useBreadcrumbs();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [taskBriefs, setTaskBriefs] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);

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
  const [isAddSubTaskModalOpen, setIsAddSubTaskModalOpen] = useState(false);
  const [isAssigneeModalOpen, setIsAssigneeModalOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [isUpdatingAssignees, setIsUpdatingAssignees] = useState(false);

  const [isEditSubTaskModalOpen, setIsEditSubTaskModalOpen] = useState(false);
  const [isEditMainTaskModalOpen, setIsEditMainTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const priorityDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const toastContainerStyle = { zIndex: 10000 };
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const userRole = getUserRole();
  const employeeType = getEmployeeType();
  const isCustomer = userRole === "customer";

  const canEditTaskDetails = !isCustomer;
  const canManageAssignees = !isCustomer;
  const canManageSubtasks = !isCustomer;
  const canChangeStatus = !isCustomer;
  const canManageComments =
    userRole === "admin" ||
    userRole === "employee" ||
    userRole === "manager" ||
    userRole === "supervisor"||
    userRole === "executive" ||
    userRole === "customer";
  
  // ++ YAHAN TABDEELI KI GAYI HAI: Nayi condition banayi gayi hai ++
  const canViewTimeLogs = ["admin", "manager", "supervisor", "customer","executive"].includes(userRole);


  const apiPrefix = getApiPrefix();
  const taskApiPath = `/api/${apiPrefix}/project-task`;
  const jobApiPath = `/api/${apiPrefix}/project`;
  const commentApiPath = canManageComments
    ? `/api/${apiPrefix}/task-comment`
    : null;
  const employeeListApiPath = canManageAssignees
    ? `/api/${apiPrefix}/employee-user`
    : null;
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

  const fetchAllDetails = useCallback(
    async (showLoadingSpinner = true) => {
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
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };

        const taskResponse = await fetch(
          `${API_BASE_URL}${taskApiPath}/${taskId}`,
          { headers }
        );

        if (!taskResponse.ok) {
          let errorMessage = `Error fetching task: ${taskResponse.status} ${taskResponse.statusText}`;
          try {
            const errorData = await taskResponse.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            /* Ignore if response is not JSON */
          }
          throw new Error(errorMessage);
        }

        const taskData = await taskResponse.json();
        setParentTaskDetails(taskData);
        setSubTasks(taskData.sub_tasks || []);
        setTaskBriefs(taskData.all_briefs || []);
        setTimeLogs(taskData.assignees_with_hours || []);

        const project_id_to_fetch = jobId || taskData.project_id;
        if (project_id_to_fetch) {
          const jobResponse = await fetch(
            `${API_BASE_URL}${jobApiPath}/${project_id_to_fetch}`,
            { headers }
          );
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            setJobDetails(jobData?.data || jobData);
          }
        }

        if (canManageComments) {
          await initialFetchAndSetup(taskId);
        }
      } catch (err) {
        console.error("Failed to fetch details:", err);
        setError(
          err.message || "An unknown error occurred while fetching data."
        );
        setTaskFound(false);
      } finally {
        if (showLoadingSpinner) setLoading(false);
      }
    },
    [
      taskId,
      jobId,
      API_BASE_URL,
      taskApiPath,
      jobApiPath,
      canManageComments,
      navigate,
    ]
  );
// --- START: REPLACEMENT CODE for your Task Details Page ---

  useEffect(() => {
    // This part remains the same if you are passing breadcrumbs via location state
    if (location.state?.breadcrumbs) {
      setBreadcrumbs(location.state.breadcrumbs);
    } 
    // This is the main logic we are fixing
    else if (parentTaskDetails) {
      
      // Determine the correct "parent" page link for the main project list
      let projectListCrumb = { title: "Jobs", link: "/jobs" }; // Default for customer, admin, etc.
      if (currentUserRole === 'member') {
        // If the user is a 'member', their main list is on the 'teamaccess' page.
        projectListCrumb = { title: "My Team Access", link: "/teamaccess" };
      }

      // Start building the breadcrumbs array with the correct first link
      const newCrumbs = [projectListCrumb];

      if (jobDetails) {
        // Determine the correct link for the JOB itself
        // Only 'member' should go to order-details. Everyone else goes to jobs/:id
        const projectLink = (currentUserRole === 'member')
          ? `/order-details/${jobDetails.id}`
          : `/jobs/${jobDetails.id}`;
          
        newCrumbs.push({ title: jobDetails.project_name, link: projectLink });
      }

      // This logic for nested tasks remains the same
      if (parentTaskDetails.parent_task) {
        newCrumbs.push({
          title: parentTaskDetails.parent_task.task_title,
          link: `/project/${parentTaskDetails.parent_task.id}`,
        });
      }

      // Add the current task's title (it's not a link)
      newCrumbs.push({ title: parentTaskDetails.task_title });

      // Set the final, correct breadcrumbs
      setBreadcrumbs(newCrumbs);
    }

    // Cleanup function
    return () => {
      setBreadcrumbs([]);
    };
  }, [
    location.state,
    jobDetails,
    parentTaskDetails,
    setBreadcrumbs,
    currentUserRole, // Use currentUserRole instead of isCustomer
  ]);

// --- END: REPLACEMENT CODE ---
  const initialFetchAndSetup = async (currentTaskId) => {
    if (!canManageComments) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}${commentApiPath}?task_id=${currentTaskId}&page=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch initial comments");
      const apiResponse = await response.json();
      const fetchedComments =
        apiResponse.data && Array.isArray(apiResponse.data)
          ? apiResponse.data
          : [];
      const processedComments = fetchedComments.map((comment) => ({
        ...comment,
        comment_attachments: Array.isArray(comment.comment_attachments)
          ? comment.comment_attachments
          : [],
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      }));
      setComments(processedComments.reverse());
      setNextPageUrl(
        apiResponse.links?.next || apiResponse.next_page_url || null
      );
      setTotalCommentsFromApi(
        apiResponse.meta?.total || apiResponse.total || 0
      );
      setAllCommentsLoaded(
        !apiResponse.links?.next && !apiResponse.next_page_url
      );
    } catch (err) {
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
      if (!url.searchParams.has("task_id")) {
        url.searchParams.set("task_id", taskId);
      }
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch older comments.");
      const apiResponse = await response.json();
      const fetchedComments =
        apiResponse.data && Array.isArray(apiResponse.data)
          ? apiResponse.data
          : [];
      const processedComments = fetchedComments.map((comment) => ({
        ...comment,
        comment_attachments: Array.isArray(comment.comment_attachments)
          ? comment.comment_attachments
          : [],
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      }));
      const reversedBatch = processedComments.reverse();
      setComments((prev) => [...reversedBatch, ...prev]);
      setNextPageUrl(
        apiResponse.links?.next || apiResponse.next_page_url || null
      );
      setAllCommentsLoaded(
        !apiResponse.links?.next && !apiResponse.next_page_url
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoadingOlderComments(false);
    }
  };

  const fetchAllEmployees = async () => {
    if (!employeeListApiPath) {
      setLoadingEmployees(false);
      return;
    }
    setLoadingEmployees(true);
    const token = getAuthToken();
    if (!token) {
      setLoadingEmployees(false);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}${employeeListApiPath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
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

  const handleBriefUpdated = useCallback(() => {
    fetchAllDetails(false);
  }, [fetchAllDetails]);

  useEffect(() => {
    setCurrentUserId(getUserIdFromCookie());
    if (taskId && taskId.trim() !== "") {
      fetchAllDetails();
      if (canManageAssignees) fetchAllEmployees();
    } else {
      setLoading(false);
      setError("Task ID is missing or invalid in the URL.");
      setTaskFound(false);
    }
  }, [taskId, fetchAllDetails, canManageAssignees]);

  useEffect(() => {
    const handleClickOutside = (event) => {
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
      status: "task_status",
      priority: "priority",
      description: "task_description",
      dueDate: "due_date",
    };
    const apiFieldName = fieldMapping[fieldName] || fieldName;
    const payload = { [apiFieldName]: value };
    try {
      const response = await fetch(`${API_BASE_URL}${taskApiPath}/${taskId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok)
        throw new Error(responseData.message || "Failed to update the task.");
      toast.success(
        `Task ${fieldName.replace(/_/g, " ")} updated successfully!`
      );
      await fetchAllDetails(false);
      if (fieldName === "priority") setIsPriorityDropdownOpen(false);
      if (fieldName === "status") setIsStatusDropdownOpen(false);
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setIsUpdatingField(false);
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
      const response = await fetch(`${API_BASE_URL}${bulkAssignApiPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        let errorMessage =
          responseData.message || "Failed to update assignees.";
        if (response.status === 422 && responseData.errors) {
          errorMessage = Object.values(responseData.errors).flat().join(" ");
        }
        throw new Error(errorMessage);
      }
      toast.success(responseData.message || "Assignees updated successfully!");
      await fetchAllDetails(false);
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
      const response = await fetch(`${API_BASE_URL}${commentApiPath}`, {
        method: "POST",
        headers: isFormData
          ? { Authorization: `Bearer ${token}`, Accept: "application/json" }
          : {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
        body: isFormData ? payload : JSON.stringify(payload),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to post comment (status ${response.status})`
        );
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
      const response = await fetch(
        `${API_BASE_URL}${commentApiPath}/${commentId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to update comment (status ${response.status})`
        );
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
      const response = await fetch(
        `${API_BASE_URL}${commentApiPath}/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (response.status !== 200 && response.status !== 204) {
        const responseData = await response.json().catch(() => ({}));
        throw new Error(
          responseData.message ||
            `Failed to delete comment (status ${response.status})`
        );
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
      const response = await fetch(
        `${API_BASE_URL}${commentApiPath}/${parentCommentId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Error ${response.status}: Could not load replies.`
        );
      }
      const fetchedParentCommentData = await response.json();
      const parentCommentDetail =
        fetchedParentCommentData.data || fetchedParentCommentData;
      const newReplies = Array.isArray(parentCommentDetail.replies)
        ? parentCommentDetail.replies
        : [];
      if (newReplies.length > 0) {
        setComments((prevComments) => {
          const existingCommentIds = new Set(prevComments.map((c) => c.id));
          const uniqueNewReplies = newReplies.filter(
            (reply) => !existingCommentIds.has(reply.id)
          );
          let combinedComments = [...prevComments, ...uniqueNewReplies];
          const updatedComments = combinedComments.map((c) => {
            if (c.id === parentCommentId) {
              return {
                ...c,
                replies_count: parentCommentDetail.replies.length,
              };
            }
            return c;
          });
          return updatedComments;
        });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleOpenEditSubTaskModal = (subTask) => {
    setTaskToEdit(subTask);
    setIsEditSubTaskModalOpen(true);
  };

  const handleCloseEditSubTaskModal = () => {
    setTaskToEdit(null);
    setIsEditSubTaskModalOpen(false);
  };

  const handleSubTaskUpdated = async () => {
    handleCloseEditSubTaskModal();
    toast.success("Subtask updated successfully!");
    await fetchAllDetails(false);
  };

  const handleDeleteSubTask = async (subTaskId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this task!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      const token = getAuthToken();
      if (!token) return;
      try {
        const response = await fetch(
          `${API_BASE_URL}${taskApiPath}/${subTaskId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to delete the task.");
        }
        Swal.fire("Deleted!", "The task has been deleted.", "success");
        await fetchAllDetails(false);
      } catch (err) {
        Swal.fire("Error!", err.message, "error");
      }
    }
  };

  const handleOpenEditMainTaskModal = () => {
    if (parentTaskDetails) {
      setTaskToEdit(parentTaskDetails);
      setIsEditMainTaskModalOpen(true);
    } else {
      toast.error("Main task details not loaded yet.");
    }
  };

  const handleCloseEditMainTaskModal = () => {
    setTaskToEdit(null);
    setIsEditMainTaskModalOpen(false);
  };

  const handleMainTaskUpdated = async () => {
    handleCloseEditMainTaskModal();
    toast.success("Main task updated successfully!");
    await fetchAllDetails(false);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !taskFound || !parentTaskDetails) {
    return (
      <ErrorState
        title={!taskFound ? "Task Not Found" : "Error"}
        message={error}
      />
    );
  }

  const currentAssignees = parentTaskDetails.assignees || [];
  const currentAssigneeUserIds = currentAssignees
    .map((a) => a?.user?.id)
    .filter((id) => id != null);
  
  const showSidebar = canManageComments || canViewTimeLogs;
  const gridLayoutClass = showSidebar
    ? "grid lg:grid-cols-3 gap-6"
    : "grid grid-cols-1 gap-6 max-w-4xl mx-auto";
  const mainContentClass = showSidebar
    ? "lg:col-span-2 space-y-6"
    : "space-y-6";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <ToastContainer
        {...toastContainerStyle}
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
      <div className="container mx-auto px-4 py-6">
        <div className={gridLayoutClass}>
          <div className={mainContentClass}>
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
              <TaskHeader
                taskTitle={parentTaskDetails.task_title}
                taskStatus={parentTaskDetails.task_status}
                isStatusDropdownOpen={isStatusDropdownOpen}
                setIsStatusDropdownOpen={setIsStatusDropdownOpen}
                statusDropdownRef={statusDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
                isEditable={canChangeStatus}
                onEditTaskClick={
                  canEditTaskDetails ? handleOpenEditMainTaskModal : null
                }
              />
              <TaskMetadata
                description={parentTaskDetails.task_description}
                priority={parentTaskDetails.priority}
                dueDate={parentTaskDetails.due_date}
                currentAssignees={currentAssignees}
                onOpenAssigneeModal={
                  canManageAssignees ? () => setIsAssigneeModalOpen(true) : null
                }
                isPriorityDropdownOpen={isPriorityDropdownOpen}
                setIsPriorityDropdownOpen={setIsPriorityDropdownOpen}
                priorityDropdownRef={priorityDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
                onDescriptionUpdate={
                  canEditTaskDetails
                    ? (newDescription) =>
                        handleUpdateTaskField("description", newDescription)
                    : null
                }
                isUpdatingField={isUpdatingField}
                isEditable={canEditTaskDetails}
              />
            </div>

            <TaskBriefsSection
              briefs={taskBriefs}
              taskId={taskId}
              onBriefsUpdated={handleBriefUpdated}
            />
            <SubTaskList
              subTasks={subTasks}
              jobId={jobId}
              onAddSubTaskClick={
                canManageSubtasks ? () => setIsAddSubTaskModalOpen(true) : null
              }
              onEditSubTask={handleOpenEditSubTaskModal}
              onDeleteSubTask={handleDeleteSubTask}
              isEditable={canManageSubtasks}
            />
            <TaskAttachments attachments={parentTaskDetails?.attachments} />
          </div>

          {showSidebar && (
            <div className="lg:col-span-1 space-y-6">
              {canManageComments && (
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
              )}
            
              {canViewTimeLogs && (
                <TimeLogSummary timeLogs={timeLogs} />
              )}
            </div>
          )}
        </div>
      </div>

      {canManageSubtasks && isAddSubTaskModalOpen && parentTaskDetails && (
        <AddSubTaskModal
          isOpen={isAddSubTaskModalOpen}
          onClose={() => setIsAddSubTaskModalOpen(false)}
          parentTaskId={taskId}
          projectId={parentTaskDetails.project_id}
          onSubTaskAdded={async () => await fetchAllDetails(false)}
        />
      )}
      {canManageAssignees &&
        isAssigneeModalOpen &&
        parentTaskDetails &&
        !loadingEmployees && (
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
      {canManageSubtasks &&
        isEditSubTaskModalOpen &&
        taskToEdit &&
        parentTaskDetails && (
          <EditTaskModal
            isOpen={isEditSubTaskModalOpen}
            onClose={handleCloseEditSubTaskModal}
            onTaskUpdated={handleSubTaskUpdated}
            taskData={taskToEdit}
            projectId={parentTaskDetails.project_id}
          />
        )}
      {canEditTaskDetails && isEditMainTaskModalOpen && parentTaskDetails && (
        <EditTaskModal
          isOpen={isEditMainTaskModalOpen}
          onClose={handleCloseEditMainTaskModal}
          onTaskUpdated={handleMainTaskUpdated}
          taskData={parentTaskDetails}
          projectId={parentTaskDetails.project_id}
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;