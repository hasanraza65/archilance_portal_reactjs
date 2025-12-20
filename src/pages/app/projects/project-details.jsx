import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import AddTaskModal from "../projects/Task/PartialTask/AddSubTaskModal";
import EditTaskModal from "../projects/Task/PartialTask/EditTaskModal";
import AddBriefModal from "./Brief-task/AddBriefModel";
import EditBriefModal from "./Brief-task/EditBriefModel";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { getUserRole } from "@/pages/utility/apiHelper";
import { useSelector, useDispatch } from "react-redux";
import { toggleUpdateAssigneesModal, setEditModalAndItem } from "./store";
import UpdateAssigneesModal from "./UpdateAssigneesModal";
import EditProject from "./EditProject";
import { useBreadcrumbs } from "../../../components/ui/BreadcrumbsContext";

// Refactored Components
import TasksTimeSummary from "@/components/features/projects/details/TasksTimeSummary";
import ResponsiveTableStyles from "@/components/features/projects/details/ResponsiveTableStyles";
import ConversationBox from "@/components/features/projects/details/ConversationBox";
import CustomerConversationBox from "@/components/features/projects/details/CustomerConversationBox";
import ProjectHeader from "@/components/features/projects/details/ProjectHeader";
import ProjectTasks from "@/components/features/projects/details/ProjectTasks";
import {
  getApiBasePathForRole,
  getAttachmentUrl,
} from "@/components/features/projects/details/utils";

const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { setBreadcrumbs } = useBreadcrumbs();
  const { updateAssigneesModal, editModal: isEditProjectModalOpen } =
    useSelector((state) => state.project);
  const currentUserRole = getUserRole();
  const token = Cookies.get("token");

  const [projectDetails, setProjectDetails] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectFound, setProjectFound] = useState(true);

  // Modals State
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isAddBriefModalOpen, setIsAddBriefModalOpen] = useState(false);
  const [isEditBriefModalOpen, setIsEditBriefModalOpen] = useState(false);
  const [briefToEdit, setBriefToEdit] = useState(null);

  const [expandedSections, setExpandedSections] = useState({});
  const [tasksViewMode, setTasksViewMode] = useState("grid");
  const [timeSummaryFilters, setTimeSummaryFilters] = useState({
    start_date: null,
    end_date: null,
  });

  const isManagerOrAdmin =
    currentUserRole === "admin" ||
    currentUserRole === "manager" ||
    currentUserRole === "supervisor" ||
    currentUserRole === "employee" ||
    currentUserRole === "executive";
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const userDataCookie = Cookies.get("user");
    if (userDataCookie) {
      try {
        setCurrentUser(JSON.parse(userDataCookie));
      } catch (e) {
        console.error("Failed to parse user data from cookie:", e);
      }
    }
  }, []);
  const currentUserId = currentUser ? currentUser.id : null;

  // --- INTERNAL JOB CHAT STATES ---
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  // --- CUSTOMER CHAT STATES ---
  const [customerMessages, setCustomerMessages] = useState([]);
  const [isCustomerMessagesLoading, setIsCustomerMessagesLoading] =
    useState(true);
  const [customerMessagesError, setCustomerMessagesError] = useState(null);
  const [customerNewMessage, setCustomerNewMessage] = useState("");
  const [customerAttachments, setCustomerAttachments] = useState([]);
  const [isCustomerSending, setIsCustomerSending] = useState(false);

  // Fetch Internal Chat Messages
  const fetchMessages = useCallback(async () => {
    const canViewChat = [
      "admin",
      "manager",
      "employee",
      "outsource",
      "supervisor",
      "executive",
      "customer",
    ].includes(currentUserRole);
    if (!canViewChat || !token || !id) {
      setIsMessagesLoading(false);
      return;
    }
    const chatApiPath = getApiBasePathForRole("/project-chat");
    try {
      const response = await fetch(`${API_BASE_URL}${chatApiPath}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch messages.");
      const data = await response.json();
      setMessages(data.chats || []);
      setMessagesError(null);
    } catch (err) {
      setMessagesError(err.message);
    } finally {
      setIsMessagesLoading(false);
    }
  }, [id, token, currentUserRole, API_BASE_URL]);

  // Fetch Customer Chat Messages
  const fetchCustomerMessages = useCallback(async () => {
    if (!token || !id) {
      setIsCustomerMessagesLoading(false);
      return;
    }

    // For role map 4 (customer), use /api/customer/project-chat/{id}
    // For all other roles, use the existing endpoint
    let customerChatApiPath;
    if (currentUserRole === "customer") {
      customerChatApiPath = getApiBasePathForRole("/project-chat");
    } else {
      customerChatApiPath = getApiBasePathForRole("/project-chat-with-customers");
    }
    const customerChatUrl = `${API_BASE_URL}${customerChatApiPath}/${id}`;

    try {
      const response = await fetch(customerChatUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch customer messages.");
      const data = await response.json();
      setCustomerMessages(data.chats || []);
      setCustomerMessagesError(null);
    } catch (err) {
      setCustomerMessagesError(err.message);
    } finally {
      setIsCustomerMessagesLoading(false);
    }
  }, [id, token, API_BASE_URL, currentUserRole]);

  useEffect(() => {
    const canViewChat = [
      "admin",
      "manager",
      "employee",
      "outsource",
      "supervisor",
      "executive",
      "customer",
    ].includes(currentUserRole);
    if (canViewChat) {
      fetchMessages();
      fetchCustomerMessages();
      const pollInterval = setInterval(() => {
        fetchMessages();
        fetchCustomerMessages();
      }, 20000);
      return () => clearInterval(pollInterval);
    }
  }, [fetchMessages, fetchCustomerMessages, currentUserRole]);

  // Handle Send Message (Logic same for both, but different endpoints/flags)
  const handleSendMessage = async (isCustomerChat = false) => {
    const msgText = isCustomerChat ? customerNewMessage : newMessage;
    const fileList = isCustomerChat ? customerAttachments : attachments;
    const setMsgText = isCustomerChat ? setCustomerNewMessage : setNewMessage;
    const setFileList = isCustomerChat
      ? setCustomerAttachments
      : setAttachments;
    const setSendingState = isCustomerChat
      ? setIsCustomerSending
      : setIsSending;
    const isSendingFlag = isCustomerChat ? isCustomerSending : isSending;

    if ((!msgText.trim() && fileList.length === 0) || isSendingFlag) return;

    setSendingState(true);
    const formData = new FormData();
    formData.append("project_id", id);
    formData.append("message", msgText.trim());

    // Add allowed_customer=1 for customer communication
    if (isCustomerChat) {
      formData.append("allowed_customer", "1");
    }

    fileList.forEach((att) => formData.append("attachments[]", att.file));

    // Send logic uses the standard API path (with /public/api/admin) as requested
    const chatApiPath = getApiBasePathForRole("/project-chat");
    try {
      const response = await fetch(`${API_BASE_URL}${chatApiPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to send message.");
      }
      const result = await response.json();

      if (isCustomerChat) {
        setCustomerMessages((prev) => [...prev, result.chat]);
      } else {
        setMessages((prev) => [...prev, result.chat]);
      }

      setMsgText("");
      setFileList([]);
    } catch (err) {
      Swal.fire("Error", `Failed to send message: ${err.message}`, "error");
    } finally {
      setSendingState(false);
    }
  };

  const handleUpdateMessage = async (
    messageId,
    updatedText,
    newFiles,
    deletedAttachmentIds,
    isCustomerChat = false
  ) => {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("message", updatedText.trim());

    if (isCustomerChat) {
      formData.append("allowed_customer", "1");
    }

    newFiles.forEach((file) => formData.append("attachments[]", file));
    deletedAttachmentIds.forEach((id) =>
      formData.append("delete_attachments[]", id)
    );

    const chatApiPath = getApiBasePathForRole("/project-chat");
    try {
      const response = await fetch(
        `${API_BASE_URL}${chatApiPath}/${messageId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          body: formData,
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to update message.");
      }
      const result = await response.json();

      if (isCustomerChat) {
        setCustomerMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? result.chat : msg))
        );
      } else {
        setMessages((prev) =>
          prev.map((msg) => (msg.id === messageId ? result.chat : msg))
        );
      }

      toast.success("Message updated!");
      return true;
    } catch (err) {
      Swal.fire("Error", `Failed to update message: ${err.message}`, "error");
      return false;
    }
  };

  const handleDeleteMessage = async (messageId, isCustomerChat = false) => {
    const chatApiPath = getApiBasePathForRole("/project-chat");
    try {
      const response = await fetch(
        `${API_BASE_URL}${chatApiPath}/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to delete message.");
      }

      if (isCustomerChat) {
        setCustomerMessages((prev) =>
          prev.filter((msg) => msg.id !== messageId)
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      }

      Swal.fire("Deleted!", "The message has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error", `Failed to delete message: ${err.message}`, "error");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProjectData = useCallback(async () => {
    if (!id) {
      setError("Project ID is missing from URL.");
      setProjectFound(false);
      return;
    }

    const currentToken = Cookies.get("token");
    if (!currentToken) {
      setError("Authorization token not found. Please log in.");
      setProjectFound(false);
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Please log in again to continue.",
        confirmButtonColor: "#3085d6",
      }).then(() => navigate("/login"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      };

      const params = new URLSearchParams();
      if (timeSummaryFilters.start_date) {
        params.append("summary_start_date", timeSummaryFilters.start_date);
      }
      if (timeSummaryFilters.end_date) {
        params.append("summary_end_date", timeSummaryFilters.end_date);
      }

      const apiPath = getApiBasePathForRole(`/project`);
      const queryString = params.toString();
      const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${id}${queryString ? `?${queryString}` : ""
        }`;

      const response = await fetch(apiUrl, { method: "GET", headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Project with ID ${id} not found.`);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Failed to parse error response." }));
          throw new Error(
            `Error ${response.status}: ${errorData.message || response.statusText
            }`
          );
        }
      }

      const fetchedProjectData = await response.json();
      const projectData = fetchedProjectData.data || fetchedProjectData;

      if (projectData && projectData.project_name) {
        setProjectDetails(projectData);
        setTasks(
          (projectData.tasks || []).map((task) => ({
            ...task,
            assignees: task.assignees || [],
          }))
        );
        setBriefs(
          (projectData.all_briefs || []).map((brief) => ({
            ...brief,
            sanitized_description: DOMPurify.sanitize(
              brief.brief_description || ""
            ),
            attachments: (brief.attachments || []).map((att) => ({
              ...att,
              url: getAttachmentUrl(att.file_path),
            })),
          }))
        );

        const uniqueStatuses = [
          ...new Set(
            (projectData.tasks || []).map((t) =>
              String(t.task_status || "unknown").toLowerCase()
            )
          ),
        ];
        const initialExpandedState = {};
        uniqueStatuses.forEach((status) => {
          initialExpandedState[status] = true;
        });
        setExpandedSections(initialExpandedState);
        setProjectFound(true);
      } else {
        throw new Error("Invalid project data received.");
      }
    } catch (err) {
      setError(err.message);
      setProjectFound(false);
    } finally {
      setLoading(false);
    }
  }, [id, timeSummaryFilters, navigate]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    if (projectDetails && projectDetails.project_name) {
      setBreadcrumbs([
        { title: "Jobs", link: "/jobs" },
        { title: projectDetails.project_name, link: `/jobs/${id}` },
      ]);
    }
    return () => {
      setBreadcrumbs([]);
    };
  }, [projectDetails, setBreadcrumbs, id]);

  const groupedTasks = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const status = String(task.task_status || "unknown").toLowerCase();
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const sortedStatusOrder = useMemo(() => {
    const statusOrder = [
      "on hold",
      "backlog",
      "awaiting info",
      "in progress",
      "in-house review",
      "client review",
      "completed",
      "done",
    ];
    const availableStatuses = Object.keys(groupedTasks);
    return availableStatuses.sort((a, b) => {
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedTasks]);

  const handleTimeSummaryFilterChange = (dates) => {
    setTimeSummaryFilters(dates);
  };

  const toggleSection = (status) => {
    setExpandedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handleOpenEditProjectModal = (e) => {
    if (e) e.stopPropagation();
    if (projectDetails) {
      dispatch(setEditModalAndItem({ open: true, project: projectDetails }));
    } else {
      toast.error("Job details not loaded yet.");
    }
  };
  const handleOpenAssigneesModal = () =>
    dispatch(
      toggleUpdateAssigneesModal({ open: true, project: projectDetails })
    );
  const handleOpenAddTaskModal = () => setIsAddTaskModalOpen(true);
  const handleCloseAddTaskModal = () => setIsAddTaskModalOpen(false);

  const handleTaskAdded = () => {
    setIsAddTaskModalOpen(false);
    fetchProjectData();
  };
  const handleTaskUpdated = () => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
    toast.success("Project updated successfully!");
    fetchProjectData();
  };

  const handleOpenEditTaskModal = (task, e) => {
    e.stopPropagation();
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  };
  const handleCloseEditTaskModal = () => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  };

  const handleKanbanBoard = () => navigate(`/job/${id}/kanban`);

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (!taskId) {
      toast.error("Cannot delete task: Task ID is missing.");
      return;
    }
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const currentToken = Cookies.get("token");
        if (!currentToken) {
          toast.error("Authentication Error. Please log in again.");
          navigate("/login");
          return;
        }
        try {
          const apiPath = getApiBasePathForRole("/project-task");
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${taskId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${currentToken}`,
                Accept: "application/json",
              },
            }
          );
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Server error during deletion." }));
            throw new Error(
              errorData.message ||
              `Failed to delete task (Status: ${response.status})`
            );
          }
          toast.success("Project has been deleted.");
          fetchProjectData();
        } catch (err) {
          Swal.fire("Error", err.message, "error");
        }
      }
    });
  };

  const handleOpenAddBriefModal = () => setIsAddBriefModalOpen(true);
  const handleCloseAddBriefModal = () => setIsAddBriefModalOpen(false);

  const handleBriefAdded = () => {
    setIsAddBriefModalOpen(false);
    fetchProjectData();
  };

  const handleOpenEditBriefModal = (brief) => {
    setBriefToEdit(brief);
    setIsEditBriefModalOpen(true);
  };

  const handleCloseEditBriefModal = () => {
    setIsEditBriefModalOpen(false);
    setBriefToEdit(null);
  };

  const handleBriefUpdated = () => {
    setIsEditBriefModalOpen(false);
    setBriefToEdit(null);
    fetchProjectData();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading job details...
      </div>
    );
  }
  if (!projectFound) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Job Not Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {error ? error : `The job with ID: ${id} could not be found.`}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canViewBriefs = [
    "admin",
    "manager",
    "employee",
    "outsource",
    "supervisor",
    "executive",
  ].includes(currentUserRole);
  const canViewChat = [
    "admin",
    "manager",
    "employee",
    "outsource",
    "supervisor",
    "customer",
    "executive",
  ].includes(currentUserRole);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ResponsiveTableStyles />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {projectDetails && (
            <ProjectHeader
              projectDetails={projectDetails}
              isManagerOrAdmin={isManagerOrAdmin}
              handleOpenEditProjectModal={handleOpenEditProjectModal}
              fetchProjectData={fetchProjectData}
              API_BASE_URL={API_BASE_URL}
              token={token}
              handleOpenAssigneesModal={handleOpenAssigneesModal}
            />
          )}
        </div>

        <div className="lg:col-span-1">
          <TasksTimeSummary
            summary={projectDetails?.tasks_hours_summary || []}
            onDateFilterChange={handleTimeSummaryFilterChange}
            activeStartDate={timeSummaryFilters.start_date}
            activeEndDate={timeSummaryFilters.end_date}
          />
        </div>
      </div>

      <ProjectTasks
        tasks={tasks}
        groupedTasks={groupedTasks}
        sortedStatusOrder={sortedStatusOrder}
        expandedSections={expandedSections}
        toggleSection={toggleSection}
        tasksViewMode={tasksViewMode}
        setTasksViewMode={setTasksViewMode}
        handleKanbanBoard={handleKanbanBoard}
        handleOpenAddTaskModal={handleOpenAddTaskModal}
        handleOpenEditTaskModal={handleOpenEditTaskModal}
        handleDeleteTask={handleDeleteTask}
        isManagerOrAdmin={isManagerOrAdmin}
        id={id}
        projectDetails={projectDetails}
      />

      {/* CHAT SECTION GRID */}
      {canViewChat && (
        <div
          className={`grid grid-cols-1 gap-8 mt-10 ${currentUserRole !== "customer" ? "xl:grid-cols-2" : ""
            }`}
        >
          {/* INTERNAL TEAM CHAT */}
          {currentUserRole !== "customer" && (
            <div className="h-[600px] flex flex-col">
              <div className="flex-1 relative min-h-0">
                <ConversationBox
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  onSendMessage={() => handleSendMessage(false)}
                  onUpdateMessage={(mid, txt, files, del) =>
                    handleUpdateMessage(mid, txt, files, del, false)
                  }
                  onDeleteMessage={(mid) => handleDeleteMessage(mid, false)}
                  isSending={isSending}
                  isLoading={isMessagesLoading}
                  error={messagesError}
                  currentUserId={currentUserId}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>
            </div>
          )}

          {/* CUSTOMER COMMUNICATION CHAT */}
          <div className="h-[600px] flex flex-col">
            <div className="flex-1 relative min-h-0">
              <CustomerConversationBox
                messages={customerMessages}
                newMessage={customerNewMessage}
                setNewMessage={setCustomerNewMessage}
                attachments={customerAttachments}
                setAttachments={setCustomerAttachments}
                onSendMessage={() => handleSendMessage(true)}
                onUpdateMessage={(mid, txt, files, del) =>
                  handleUpdateMessage(mid, txt, files, del, true)
                }
                onDeleteMessage={(mid) => handleDeleteMessage(mid, true)}
                isSending={isCustomerSending}
                isLoading={isCustomerMessagesLoading}
                error={customerMessagesError}
                currentUserId={currentUserId}
                apiBaseUrl={API_BASE_URL}
              />
            </div>
          </div>
        </div>
      )}

      {projectDetails && canViewBriefs && briefs.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mt-10">
          {/* Briefs section can go here */}
        </div>
      )}

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={handleCloseAddTaskModal}
        onSubTaskAdded={handleTaskAdded}
        projectId={id}
        parentTaskId={null}
      />
      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={handleCloseEditTaskModal}
        onTaskUpdated={handleTaskUpdated}
        taskData={taskToEdit}
        projectId={id}
      />

      {id && (
        <AddBriefModal
          isOpen={isAddBriefModalOpen}
          onClose={handleCloseAddBriefModal}
          onBriefAdded={handleBriefAdded}
          projectId={id}
        />
      )}
      {id && briefToEdit && (
        <EditBriefModal
          isOpen={isEditBriefModalOpen}
          onClose={handleCloseEditBriefModal}
          onBriefUpdated={handleBriefUpdated}
          briefData={briefToEdit}
          projectId={id}
          getAttachmentUrl={getAttachmentUrl}
        />
      )}

      <UpdateAssigneesModal showUpdateButton={false} />
      <EditProject />
    </div>
  );
};

export default ProjectDetailsPage;
