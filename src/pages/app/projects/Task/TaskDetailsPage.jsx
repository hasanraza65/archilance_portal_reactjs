import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

// ++ BREADCRUMB HOOK KO IMPORT KIYA GAYA HAI ++
import { useBreadcrumbs } from "../../../../components/ui/BreadcrumbsContext";

import { getApiPrefix, getUserRole } from "@/pages/utility/apiHelper";

import TaskHeader from "./PartialTask/TaskHeader";
import TaskMetadata from "./PartialTask/TaskMetadata";
import SubTaskList from "./PartialTask/SubTaskList";
import CommentList from "./PartialTask/CommentList";
import LoadingState from "./PartialTask/LoadingState";
import ErrorState from "./PartialTask/ErrorState";
import AddSubTaskModal from "./PartialTask/AddSubTaskModal";
import AssigneeModal from "./PartialTask/AssigneeModal";
import TaskAttachments from "./PartialTask/TaskAttachments";
import EditTaskModal from "./PartialTask/EditTaskModal"; // Already imported for subtasks, will reuse for main task
import TaskBriefsSection from "../TaskBrief/TaskBriefDetail";

const TaskDetailsPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const jobId = location.state?.jobId;

  // ++ BREADCRUMB CONTEXT SE 'setBreadcrumbs' FUNCTION HASIL KIYA GAYA HAI ++
  const { setBreadcrumbs } = useBreadcrumbs();

  const [parentTaskDetails, setParentTaskDetails] = useState(null);
  const [jobDetails, setJobDetails] = useState(null); // Job details ke liye nayi state
  const [subTasks, setSubTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [taskBriefs, setTaskBriefs] = useState([]);

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

  // State for editing a subtask
  const [isEditSubTaskModalOpen, setIsEditSubTaskModalOpen] = useState(false);
  // State for editing the main task
  const [isEditMainTaskModalOpen, setIsEditMainTaskModalOpen] = useState(false); // New state for main task edit modal
  const [taskToEdit, setTaskToEdit] = useState(null); // This state will be used for both main task and subtask edits

  const priorityDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const toastContainerStyle = { zIndex: 10000 };
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const userRole = getUserRole();
  const isCustomer = userRole === "customer";

  const canEditTaskDetails = !isCustomer; // Use this for enabling/disabling edit functionality
  const canManageAssignees = !isCustomer;
  const canManageSubtasks = !isCustomer;
  const canChangeStatus = !isCustomer;
  const canManageComments = userRole === "admin" || userRole === "employee" || userRole === "manager";

  const apiPrefix = getApiPrefix();
  const taskApiPath = `/api/${apiPrefix}/project-task`;
  const jobApiPath = `/api/${apiPrefix}/project`; // Job details ke liye API path
  const commentApiPath = canManageComments ? `/api/${apiPrefix}/task-comment` : null;
  const employeeListApiPath = canManageAssignees ? `/api/${apiPrefix}/employee-user` : null;
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

  const fetchAllDetails = useCallback(async (showLoadingSpinner = true) => {
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
        const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

        // Dono API calls ko Promise.all ke zariye ek saath bheja jayega
        const [taskResponse, jobResponse] = await Promise.all([
            // Task (Project) details fetch karna
            fetch(`${API_BASE_URL}${taskApiPath}/${taskId}`, { headers }),
            // Job details fetch karna (agar jobId maujood hai to)
            jobId ? fetch(`${API_BASE_URL}${jobApiPath}/${jobId}`, { headers }) : Promise.resolve(null)
        ]);

        if (!taskResponse.ok) {
            const eData = await taskResponse.json().catch(() => ({}));
            throw new Error(eData.message || `Error fetching task: ${taskResponse.status}`);
        }
        if (jobResponse && !jobResponse.ok) {
            // Agar job details fetch na hon to error na dikhayein, sirf console mein warn karein
            console.warn(`Could not fetch job details for breadcrumb: Status ${jobResponse.status}`);
        }

        const taskData = await taskResponse.json();
        const jobData = jobResponse ? await jobResponse.json().catch(() => null) : null;

        setParentTaskDetails(taskData);
        setJobDetails(jobData?.data || jobData); // Job data set karein
        setSubTasks(taskData.sub_tasks || []);
        setTaskBriefs(taskData.all_briefs || []);

        if (canManageComments) {
            await initialFetchAndSetup(taskId);
        }
    } catch (err) {
        setError(err.message || "An unknown error occurred.");
        setTaskFound(false);
    } finally {
        if (showLoadingSpinner) setLoading(false);
    }
  }, [taskId, jobId, API_BASE_URL, taskApiPath, jobApiPath, canManageComments, navigate]);

  // ++ YEH useEffect DYNAMIC BREADCRUMB SET KARNE KE LIYE HAI ++
  useEffect(() => {
    // Yeh effect tab chalega jab jobDetails ya parentTaskDetails update honge
    if (jobDetails && parentTaskDetails) {
        setBreadcrumbs([
            { title: "Jobs", link: "/jobs" },
            { title: jobDetails.project_name, link: `/jobs/${jobId}` },
            { title: parentTaskDetails.task_title, link: `/project/${taskId}` }
        ]);
    } else if (parentTaskDetails) {
        // Fallback agar job details load na hon
        setBreadcrumbs([
            { title: "Jobs", link: "/jobs" },
            { title: parentTaskDetails.task_title, link: `/project/${taskId}` }
        ]);
    }

    // Cleanup function: Jab component unmount ho to breadcrumbs ko saaf kar dein
    return () => {
        setBreadcrumbs([]);
    };
  }, [jobDetails, parentTaskDetails, setBreadcrumbs, jobId, taskId]);

  const initialFetchAndSetup = async (currentTaskId) => {
    if (!canManageComments) return;
    const authToken = getAuthToken();
    if (!authToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}${commentApiPath}?task_id=${currentTaskId}&page=1`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch initial comments");
      const apiResponse = await response.json();
      const fetchedComments = apiResponse.data && Array.isArray(apiResponse.data) ? apiResponse.data : [];
      const processedComments = fetchedComments.map((comment) => ({
        ...comment,
        comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      }));
      setComments(processedComments.reverse());
      setNextPageUrl(apiResponse.links?.next || apiResponse.next_page_url || null);
      setTotalCommentsFromApi(apiResponse.meta?.total || apiResponse.total || 0);
      setAllCommentsLoaded(!apiResponse.links?.next && !apiResponse.next_page_url);
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
      const fetchedComments = apiResponse.data && Array.isArray(apiResponse.data) ? apiResponse.data : [];
      const processedComments = fetchedComments.map((comment) => ({
        ...comment,
        comment_attachments: Array.isArray(comment.comment_attachments) ? comment.comment_attachments : [],
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      }));
      const reversedBatch = processedComments.reverse();
      setComments((prev) => [...reversedBatch, ...prev]);
      setNextPageUrl(apiResponse.links?.next || apiResponse.next_page_url || null);
      setAllCommentsLoaded(!apiResponse.links?.next && !apiResponse.next_page_url);
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
      fetchAllEmployees();
    } else {
      setLoading(false);
      setError("Task ID is missing or invalid in the URL.");
      setTaskFound(false);
    }
  }, [taskId, fetchAllDetails]);

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
      if (!response.ok) throw new Error(responseData.message || "Failed to update the task.");
      toast.success(`Task ${fieldName.replace(/_/g, " ")} updated successfully!`);
      await fetchAllDetails(false);
      if (fieldName === "priority") setIsPriorityDropdownOpen(false);
      if (fieldName === "status") setIsStatusDropdownOpen(false);
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
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });
      const responseData = await response.json().catch(() => ({}));
      if (!response.ok) {
        let errorMessage = responseData.message || "Failed to update assignees.";
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
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${commentId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
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
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
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
      const response = await fetch(`${API_BASE_URL}${commentApiPath}/${parentCommentId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: Could not load replies.`);
      }
      const fetchedParentCommentData = await response.json();
      const parentCommentDetail = fetchedParentCommentData.data || fetchedParentCommentData;
      const newReplies = Array.isArray(parentCommentDetail.replies) ? parentCommentDetail.replies : [];
      if (newReplies.length > 0) {
        setComments((prevComments) => {
          const existingCommentIds = new Set(prevComments.map((c) => c.id));
          const uniqueNewReplies = newReplies.filter((reply) => !existingCommentIds.has(reply.id));
          let combinedComments = [...prevComments, ...uniqueNewReplies];
          const updatedComments = combinedComments.map((c) => {
            if (c.id === parentCommentId) {
              return { ...c, replies_count: parentCommentDetail.replies.length };
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
    setTaskToEdit(subTask); // Set the subtask to be edited
    setIsEditSubTaskModalOpen(true);
  };

  const handleCloseEditSubTaskModal = () => {
    setTaskToEdit(null);
    setIsEditSubTaskModalOpen(false);
  };

  const handleSubTaskUpdated = async () => {
    handleCloseEditSubTaskModal();
    toast.success("Subtask updated successfully!");
    await fetchAllDetails(false); // Refresh parent task details and subtasks
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
        const response = await fetch(`${API_BASE_URL}${taskApiPath}/${subTaskId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
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

  // --- New handlers for Main Task Edit Modal ---
  const handleOpenEditMainTaskModal = () => {
    if (parentTaskDetails) {
      setTaskToEdit(parentTaskDetails); // Set the main task to be edited
      setIsEditMainTaskModalOpen(true);
    } else {
      toast.error("Main task details not loaded yet.");
    }
  };

  const handleCloseEditMainTaskModal = () => {
    setTaskToEdit(null); // Clear taskToEdit
    setIsEditMainTaskModalOpen(false);
  };

  const handleMainTaskUpdated = async () => {
    handleCloseEditMainTaskModal();
    toast.success("Main task updated successfully!");
    await fetchAllDetails(false); // Re-fetch all details to update the page
  };
  // --- End New handlers ---

  if (loading) return <LoadingState />;
  if (error || !taskFound || !parentTaskDetails)
    return <ErrorState title={!taskFound ? "Task Not Found" : "Error"} message={error} />;

  const currentAssignees = parentTaskDetails.assignees || [];
  const currentAssigneeUserIds = currentAssignees.map((a) => a?.user?.id).filter((id) => id != null);
  const gridLayoutClass = canManageComments ? "grid lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-6 max-w-4xl mx-auto";
  const mainContentClass = canManageComments ? "lg:col-span-2 space-y-6" : "space-y-6";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <ToastContainer {...toastContainerStyle} position="top-right" autoClose={3000} theme="colored" />
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
                onEditTaskClick={canEditTaskDetails ? handleOpenEditMainTaskModal : null} // Pass handler for main task edit
              />
              <TaskMetadata
                description={parentTaskDetails.task_description}
                priority={parentTaskDetails.priority}
                dueDate={parentTaskDetails.due_date}
                currentAssignees={currentAssignees}
                onOpenAssigneeModal={canManageAssignees ? () => setIsAssigneeModalOpen(true) : null}
                isPriorityDropdownOpen={isPriorityDropdownOpen}
                setIsPriorityDropdownOpen={setIsPriorityDropdownOpen}
                priorityDropdownRef={priorityDropdownRef}
                handleUpdateTaskField={handleUpdateTaskField}
                onDescriptionUpdate={
                  canEditTaskDetails
                    ? (newDescription) => handleUpdateTaskField("description", newDescription)
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
              onAddSubTaskClick={canManageSubtasks ? () => setIsAddSubTaskModalOpen(true) : null}
              onEditSubTask={handleOpenEditSubTaskModal}
              onDeleteSubTask={handleDeleteSubTask}
              isEditable={canManageSubtasks}
            />
            <TaskAttachments attachments={parentTaskDetails?.attachments} />
          </div>

          <div className="lg:col-span-1">
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
          </div>
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
      {canManageAssignees && isAssigneeModalOpen && parentTaskDetails && !loadingEmployees && (
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
      {/* Edit modal for SUBTASKS */}
      {canManageSubtasks && isEditSubTaskModalOpen && taskToEdit && parentTaskDetails && (
        <EditTaskModal
          isOpen={isEditSubTaskModalOpen}
          onClose={handleCloseEditSubTaskModal}
          onTaskUpdated={handleSubTaskUpdated}
          taskData={taskToEdit}
          projectId={parentTaskDetails.project_id}
        />
      )}
      {/* Edit modal for the MAIN TASK */}
      {canEditTaskDetails && isEditMainTaskModalOpen && parentTaskDetails && (
        <EditTaskModal
          isOpen={isEditMainTaskModalOpen}
          onClose={handleCloseEditMainTaskModal}
          onTaskUpdated={handleMainTaskUpdated} // This will re-fetch all details for the main task
          taskData={parentTaskDetails} // Pass the main task details
          projectId={parentTaskDetails.project_id} // Project ID is needed for the API call
        />
      )}
    </div>
  );
};

export default TaskDetailsPage;