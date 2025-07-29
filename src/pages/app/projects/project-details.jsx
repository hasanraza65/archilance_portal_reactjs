import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import AddTaskModal from "../projects/Task/PartialTask/AddSubTaskModal";
import EditTaskModal from "../projects/Task/PartialTask/EditTaskModal";
import AddBriefModal from "./Brief-task/AddBriefModel";
import EditBriefModal from "./Brief-task/EditBriefModel";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import { useDispatch } from "react-redux";
import { toggleUpdateAssigneesModal } from "./store";
import Icon from "@/components/ui/Icon";
import UpdateAssigneesModal from "./UpdateAssigneesModal";
import {
  MessageCircle,
  Paperclip,
  Send,
  Loader,
  ImageIcon,
  FileText,
  Edit,
  Trash2,
  XCircle,
  Undo2,
} from "lucide-react";

// +++ IMPORT THE NEW COMPONENT +++
import EditableProjectStatus from "./EditableProjectStatus";

const ConversationBox = ({
  messages,
  newMessage,
  setNewMessage,
  attachments,
  setAttachments,
  onSendMessage,
  onUpdateMessage,
  onDeleteMessage,
  isSending,
  isLoading,
  error,
  currentUserId,
  apiBaseUrl,
}) => {
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [newAttachmentsForEdit, setNewAttachmentsForEdit] = useState([]);
  const [attachmentIdsToDelete, setAttachmentIdsToDelete] = useState([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [mobileActionMessageId, setMobileActionMessageId] = useState(null);


  const STORAGE_BASE_URL = `${apiBaseUrl}/storage/`;
  const formatTime = (dateString) =>
    new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const getFileIcon = (fileName) => {
    const ext = fileName?.split(".").pop().toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
      return <ImageIcon className="w-6 h-6 text-green-500" />;
    if (ext === "pdf") return <FileText className="w-6 h-6 text-red-500" />;
    return <FileText className="w-6 h-6 text-blue-500" />;
  };
  const handleFileSelect = (e, isEdit = false) => {
    const targetFiles = Array.from(e.target.files).filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB).`);
        return false;
      }
      return true;
    });
    const newAtts = targetFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: `${isEdit ? "edit" : "new"}-${Date.now()}-${file.name}`,
    }));
    if (isEdit) {
      setNewAttachmentsForEdit((prev) => [...prev, ...newAtts]);
    } else {
      setAttachments((prev) => [...prev, ...newAtts]);
    }
    e.target.value = "";
  };
  const removeAttachment = (id, isEdit = false) => {
    const [getter, setter] = isEdit
      ? [newAttachmentsForEdit, setNewAttachmentsForEdit]
      : [attachments, setAttachments];
    setter((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== id);
    });
  };
  const handleStartEdit = (message) => {
    setEditingMessage(message);
    setEditedText(message.message || "");
    setNewAttachmentsForEdit([]);
    setAttachmentIdsToDelete([]);
  };
  const handleCancelEdit = () => setEditingMessage(null);
  const toggleDeleteExistingAttachment = (id) =>
    setAttachmentIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  const handleSaveEdit = async () => {
    setIsProcessingAction(true);
    const success = await onUpdateMessage(
      editingMessage.id,
      editedText,
      newAttachmentsForEdit.map((a) => a.file),
      attachmentIdsToDelete
    );
    if (success) handleCancelEdit();
    setIsProcessingAction(false);
  };
  const handleDelete = async (messageId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      setIsProcessingAction(true);
      await onDeleteMessage(messageId);
      setIsProcessingAction(false);
    }
  };
  const renderAttachment = (url, name, isPreview = false) => {
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
      name.split(".").pop().toLowerCase()
    );
    const finalUrl = isPreview ? url : `${STORAGE_BASE_URL}${url}`;
    return (
      <a
        href={finalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-1.5 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"
      >
        {isImage ? (
          <img
            src={finalUrl}
            alt={name}
            className="w-20 h-20 object-cover rounded-md border border-white/20"
          />
        ) : (
          <div className="w-20 h-20 flex flex-col items-center justify-center bg-white/10 rounded-md p-1">
            {getFileIcon(name)}
            <p className="text-xs text-center mt-2 break-all line-clamp-2">
              {name}
            </p>
          </div>
        )}
      </a>
    );
  };
  const renderMessageContent = (message, isSentByMe) => (
    <div className="w-full">
      {message.message && (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.message}
        </p>
      )}
      {message.attachments?.length > 0 && (
        <div
          className={`grid grid-cols-2 sm:grid-cols-3 gap-2 ${
            message.message
              ? `mt-3 pt-3 border-t ${
                  isSentByMe ? "border-white/20" : "border-gray-200/80"
                }`
              : ""
          }`}
        >
          {message.attachments.map((att) => (
            <div key={att.id}>
              {renderAttachment(
                att.file_path,
                att.file_name,
                att.file_path.startsWith("blob:")
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
  const renderEditView = () => (
    <div className="w-full space-y-3">
      <textarea
        value={editedText}
        onChange={(e) => setEditedText(e.target.value)}
        className="w-full bg-white/20 text-white rounded-lg p-2 text-sm focus:outline-none"
        rows={3}
      />
      {editingMessage.attachments?.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">Current files:</p>
          <div className="grid grid-cols-3 gap-2">
            {editingMessage.attachments.map((att) => {
              const isMarkedForDeletion = attachmentIdsToDelete.includes(
                att.id
              );
              return (
                <div key={att.id} className="relative group">
                  {renderAttachment(att.file_path, att.file_name)}
                  <button
                    onClick={() => toggleDeleteExistingAttachment(att.id)}
                    className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-md transition-all ${
                      isMarkedForDeletion
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {isMarkedForDeletion ? (
                      <Undo2 size={12} />
                    ) : (
                      <Trash2 size={12} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {newAttachmentsForEdit.length > 0 && (
        <div>
          <p className="text-xs font-medium mb-2">New files to add:</p>
          <div className="grid grid-cols-3 gap-2">
            {newAttachmentsForEdit.map((att) => (
              <div key={att.id} className="relative group">
                {renderAttachment(att.preview, att.file.name, true)}
                <button
                  onClick={() => removeAttachment(att.id, true)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs shadow-md bg-red-500 hover:bg-red-600"
                >
                  <XCircle size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <label className="inline-flex items-center px-3 py-1.5 border border-dashed border-white/50 rounded-lg cursor-pointer hover:bg-white/10 text-xs">
        <Paperclip size={12} className="mr-1.5" />
        Add Files
        <input
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e, true)}
          className="hidden"
        />
      </label>
      <div className="flex justify-end gap-2 pt-2 border-t border-white/20">
        <button
          onClick={handleCancelEdit}
          disabled={isProcessingAction}
          className="text-xs px-3 py-1 rounded-full bg-gray-500 hover:bg-gray-600 text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSaveEdit}
          disabled={isProcessingAction}
          className="text-xs px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50"
        >
          {isProcessingAction ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
  return (
<div className="bg-white/70 dark:bg-slate-800/70 rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/20 h-full flex flex-col overflow-hidden">
  {/* Header: Adjusted padding for mobile */}
  <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
        <MessageCircle className="w-6 h-6" />
      </div>
      {/* Header: Adjusted font size for mobile */}
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        Project Chat
      </h3>
    </div>
  </div>

  {/* Chat Area: Adjusted padding and spacing for mobile */}
  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
    {isLoading && (
      <div className="flex justify-center items-center h-full">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )}
    {error && (
      <div className="text-center text-red-500">Error: {error}</div>
    )}
    {!isLoading &&
      messages.map((message) => {
        const isSentByMe = message.sender_id === currentUserId;
        const isEditing = editingMessage && editingMessage.id === message.id;

        return (
          // +++ MODIFIED: Added onClick to handle mobile tap actions +++
          <div
            key={message.id}
            className={`flex items-end gap-2 sm:gap-3 ${isSentByMe ? "flex-row-reverse" : ""}`}
            onClick={() => {
              if (window.innerWidth < 640 && isSentByMe && !isEditing) {
                setMobileActionMessageId(mobileActionMessageId === message.id ? null : message.id);
              }
            }}
          >
            {/* Avatar: Adjusted size for mobile */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0">
              {message.sender?.profile_pic ? (
                <img src={`${STORAGE_BASE_URL}${message.sender.profile_pic}`} alt={message.sender.name} className="w-full h-full rounded-full object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 border-white shadow-md">
                  {message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>

            <div
              className={`group relative max-w-[85%] sm:max-w-md min-w-[120px] px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-lg ${
                isSentByMe ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md" : "bg-white/90 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-md"
              }`}
            >
              {isEditing
                ? renderEditView()
                : renderMessageContent(message, isSentByMe)}
              <p className={`text-xs mt-2 text-right ${isSentByMe ? "text-blue-200" : "text-gray-500 dark:text-slate-400"}`}>
                {formatTime(message.created_at)}
              </p>

              {/* --- DESKTOP HOVER ACTIONS (Hidden on mobile) --- */}
              {isSentByMe && !isEditing && (
                <div className="absolute top-1 -left-12 flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                  <button onClick={() => handleStartEdit(message)} disabled={isProcessingAction} className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"><Edit size={12} className="text-gray-600 dark:text-slate-200" /></button>
                  <button onClick={() => handleDelete(message.id)} disabled={isProcessingAction} className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"><Trash2 size={12} className="text-red-500" /></button>
                </div>
              )}

              {/* --- MOBILE TAP ACTIONS (Visible on tap, hidden on desktop) --- */}
              {isSentByMe && !isEditing && mobileActionMessageId === message.id && (
                <div className="sm:hidden flex justify-end gap-2 border-t border-white/20 mt-2 pt-2">
                  <button onClick={() => handleStartEdit(message)} disabled={isProcessingAction} className="flex items-center gap-1 text-xs text-blue-100 disabled:opacity-50"><Edit size={14} /> Edit</button>
                  <button onClick={() => handleDelete(message.id)} disabled={isProcessingAction} className="flex items-center gap-1 text-xs text-red-200 disabled:opacity-50"><Trash2 size={14} /> Delete</button>
                </div>
              )}

            </div>
          </div>
        );
      })}
    <div ref={chatEndRef} />
  </div>

  {/* Input Area: Adjusted for mobile */}
  <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 space-y-3">
    {attachments.length > 0 && (
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {attachments.map((att) => (
          <div key={att.id} className="relative group">
            {renderAttachment(att.preview, att.file.name, true)}
            <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md bg-red-500 hover:bg-red-600"><XCircle size={12} /></button>
          </div>
        ))}
      </div>
    )}
    <div className="relative">
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full bg-white/80 dark:bg-slate-700/80 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-slate-200 rounded-2xl pl-10 sm:pl-12 pr-24 sm:pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyPress={(e) => e.key === "Enter" && !isSending && onSendMessage()}
        disabled={isSending}
      />
      <button onClick={() => fileInputRef.current.click()} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600">
        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-slate-400" />
      </button>
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple hidden />
      <button
        onClick={onSendMessage}
        disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:scale-105 disabled:opacity-50"
      >
        {isSending ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
        {/* +++ MODIFIED: "Send" text is hidden on mobile +++ */}
        <span className="hidden sm:inline">Send</span>
      </button>
    </div>
  </div>
</div>
  );
};
const mapApiAssigneeToLocal = (apiUser) => {
  if (!apiUser || typeof apiUser !== "object")
    return {
      id: null,
      name: "Unknown",
      avatar: "U",
      color: "bg-gray-500",
      profilePic: null,
    };
  const user = apiUser.user || apiUser;
  const id = user.id || null;
  const name = user.name || "Unknown User";
  const avatarChar =
    name && name !== "Unknown User" && name.length > 0
      ? name.charAt(0).toUpperCase()
      : "U";
  let defaultColor = "bg-gray-500";
  if (name !== "Unknown User" && name.length > 0) {
    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-lime-500",
      "bg-green-500",
      "bg-emerald-500",
      "bg-teal-500",
      "bg-cyan-500",
      "bg-sky-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-violet-500",
      "bg-purple-500",
      "bg-fuchsia-500",
      "bg-pink-500",
      "bg-rose-500",
    ];
    const colorIndex = id
      ? (typeof id === "string" ? id.charCodeAt(0) : id) % colors.length
      : name.length % colors.length;
    defaultColor = colors[colorIndex];
  }
  const color = user.color || defaultColor;
  let profilePic = null;
  if (user.profile_picture_url) profilePic = user.profile_picture_url;
  else if (user.profile_pic) {
    if (
      user.profile_pic.startsWith("http://") ||
      user.profile_pic.startsWith("https://")
    )
      profilePic = user.profile_pic;
    else {
      const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendBaseUrl) {
        const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
        const cleanProfilePicPath = user.profile_pic.replace(/^\//, "");
        profilePic = `${cleanBaseUrl}/storage/${cleanProfilePicPath}`;
      } else profilePic = `/storage/${user.profile_pic.replace(/^\//, "")}`;
    }
  }
  return { id, name, avatar: avatarChar, color, profilePic };
};
const getStatusClass = (status) => {
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "todo":
    case "to do":
    case "open":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "completed":
    case "done":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return `bg-yellow-100 text-yellow-800 border-yellow-200`;
  }
};
const getPriorityClass = (priority) => {
  if (!priority) return "text-gray-600";
  switch (String(priority).toLowerCase()) {
    case "high":
      return "text-red-600";
    case "urgent":
      return "text-orange-600 font-semibold";
    case "normal":
    case "medium":
      return "text-blue-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
  }
};
const getAttachmentUrl = (filePath) => {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (!backendBaseUrl || !filePath) return "#";
  const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
  const cleanFilePath = filePath.replace(/^\//, "");
  return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};
const isImageFile = (fileType) => {
  if (!fileType) return false;
  return fileType.startsWith("image/");
};
const getApiBasePathForRole = (basePath) => {
  const role = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (role) {
    return `/api/${role}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};
const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userRole = getApiPrefix();
  const token = Cookies.get("token");

  const [projectDetails, setProjectDetails] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectFound, setProjectFound] = useState(true);

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isAddBriefModalOpen, setIsAddBriefModalOpen] = useState(false);
  const [isEditBriefModalOpen, setIsEditBriefModalOpen] = useState(false);
  const [briefToEdit, setBriefToEdit] = useState(null);

  const MAX_DISPLAY_ASSIGNEES_IN_LIST = 2;
  const isManagerOrAdmin = userRole === "admin";
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
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if ((userRole !== "admin" && userRole !== "employee") || !token || !id)
      return;
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
  }, [id, token, userRole, API_BASE_URL]);
  useEffect(() => {
    if (userRole === "admin" || userRole === "employee") {
      fetchMessages();
      const pollInterval = setInterval(fetchMessages, 20000);
      return () => clearInterval(pollInterval);
    } else {
      setIsMessagesLoading(false);
    }
  }, [fetchMessages, userRole]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;
    setIsSending(true);
    const formData = new FormData();
    formData.append("project_id", id);
    formData.append("message", newMessage.trim());
    attachments.forEach((att) => formData.append("attachments[]", att.file));
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
      setMessages((prev) => [...prev, result.chat]);
      setNewMessage("");
      setAttachments([]);
    } catch (err) {
      Swal.fire("Error", `Failed to send message: ${err.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };
  const handleUpdateMessage = async (
    messageId,
    updatedText,
    newFiles,
    deletedAttachmentIds
  ) => {
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("message", updatedText.trim());
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
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? result.chat : msg))
      );
      toast.success("Message updated!");
      return true;
    } catch (err) {
      Swal.fire("Error", `Failed to update message: ${err.message}`, "error");
      return false;
    }
  };
  const handleDeleteMessage = async (messageId) => {
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
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      Swal.fire("Deleted!", "The message has been deleted.", "success");
    } catch (err) {
      Swal.fire("Error", `Failed to delete message: ${err.message}`, "error");
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProjectAndTasks = useCallback(async () => {
    if (!id) {
      setError("Project ID is missing from URL.");
      setLoading(false);
      setProjectFound(false);
      return;
    }
    setLoading(true);
    setError(null);

    const token = Cookies.get("token");
    if (!token) {
      setError("Authorization token not found. Please log in.");
      setLoading(false);
      setProjectFound(false);
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Authorization token not found. Please log in.",
        confirmButtonColor: "#3085d6",
      }).then(() => navigate("/login"));
      return;
    }
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Cache-Control": "no-cache",
      };
      const apiPath = getApiBasePathForRole(`/project`);
      const apiUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${id}`;
      const response = await fetch(apiUrl, { method: "GET", headers });
      if (!response.ok) {
        if (response.status === 404) {
          setProjectFound(false);
          setError(`Project with ID ${id} not found.`);
        } else {
          const errorData = await response.json().catch(() => ({
            message: "Failed to parse error response from server.",
          }));
          setError(
            `Error ${response.status}: ${
              errorData.message || response.statusText
            }`
          );
          setProjectFound(false);
        }
        setLoading(false);
        return;
      }
      const fetchedProjectData = await response.json();
      const projectData = fetchedProjectData.data || fetchedProjectData;
      if (projectData && projectData.project_name) {
        setProjectDetails(projectData);
        const processedTasks = (projectData.tasks || []).map((task) => ({
          ...task,
          assignees: task.assignees || [],
        }));
        setTasks(processedTasks);
        const processedBriefs = (projectData.all_briefs || []).map((brief) => ({
          ...brief,
          sanitized_description: DOMPurify.sanitize(
            brief.brief_description || ""
          ),
          attachments: (brief.attachments || []).map((att) => ({
            ...att,
            url: getAttachmentUrl(att.file_path),
          })),
        }));
        setBriefs(processedBriefs);
        setProjectFound(true);
      } else {
        setProjectFound(false);
        setError(
          "Invalid project data received. Expected a 'project_name' field."
        );
        setProjectDetails(null);
        setTasks([]);
        setBriefs([]);
      }
    } catch (err) {
      setError(
        err.message ||
          "An unknown error occurred while fetching project details."
      );
      setProjectFound(false);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

  const handleOpenAssigneesModal = () => {
    dispatch(
      toggleUpdateAssigneesModal({ open: true, project: projectDetails })
    );
  };

  const handleOpenAddTaskModal = () => setIsAddTaskModalOpen(true);
  const handleCloseAddTaskModal = () => setIsAddTaskModalOpen(false);
  const handleTaskAdded = () => {
    setIsAddTaskModalOpen(false);
    fetchProjectAndTasks();
  };
  const handleOpenEditTaskModal = (task) => {
    setTaskToEdit(task);
    setIsEditTaskModalOpen(true);
  };
  const handleCloseEditTaskModal = () => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  };
  const handleTaskUpdated = () => {
    fetchProjectAndTasks();
    Swal.fire({
      icon: "success",
      title: "Task Updated!",
      text: "The task has been successfully updated.",
      timer: 1500,
      showConfirmButton: false,
    });
  };
  const handleKanbanBoard = () => navigate(`/project/${id}/kanban`);
  const handleDeleteTask = async (taskId) => {
    if (!taskId) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Cannot delete task: Task ID is missing.",
      });
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
        const token = Cookies.get("token");
        if (!token) {
          Swal.fire({
            icon: "error",
            title: "Authentication Error",
            text: "Authorization token not found. Please log in.",
          }).then(() => navigate("/login"));
          return;
        }
        try {
          const apiPath = getApiBasePathForRole("/project-task");
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${taskId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Server error during deletion." }));
            Swal.fire({
              icon: "error",
              title: "Deletion Failed",
              text:
                errorData.message ||
                `Failed to delete task (Status: ${response.status})`,
            });
            return;
          }
          Swal.fire("Deleted!", "Your task has been deleted.", "success");
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== taskId)
          );
        } catch (err) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.message || "Could not connect to the server.",
          });
        }
      }
    });
  };
  const handleOpenAddBriefModal = () => setIsAddBriefModalOpen(true);
  const handleCloseAddBriefModal = () => setIsAddBriefModalOpen(false);
  const handleBriefAdded = () => {
    setIsAddBriefModalOpen(false);
    fetchProjectAndTasks();
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
    fetchProjectAndTasks();
  };
  const handleDeleteBrief = async (briefId) => {
    if (!briefId) {
      Swal.fire("Error", "Brief ID is missing.", "error");
      return;
    }
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this project brief!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = Cookies.get("token");
        if (!token) {
          Swal.fire(
            "Authentication Error",
            "Please log in again.",
            "error"
          ).then(() => navigate("/login"));
          return;
        }
        try {
          const apiPath = getApiBasePathForRole("/project-brief");
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}/${briefId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: "Server error during brief deletion.",
            }));
            Swal.fire(
              "Deletion Failed",
              errorData.message ||
                `Failed to delete brief (Status: ${response.status})`,
              "error"
            );
            return;
          }
          Swal.fire(
            "Deleted!",
            "The project brief has been deleted.",
            "success"
          );
          setBriefs((prevBriefs) =>
            prevBriefs.filter((brief) => brief.id !== briefId)
          );
        } catch (err) {
          Swal.fire(
            "Error",
            err.message || "Could not connect to the server to delete brief.",
            "error"
          );
        }
      }
    });
  };
  const handleViewBriefDetails = (briefId) => {
    if (!briefId) {
      Swal.fire("Error", "Brief ID is missing.", "error");
      return;
    }
    navigate(`/project-brief/${briefId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        Loading project details...
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
            Project Not Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            The project with ID: {id} could not be found.
            {error && <span className="block mt-1">Details: {error}</span>}
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }
  if (!projectDetails) {
    return (
      <div className="container mx-auto p-4 text-center text-yellow-500">
        No project data available. Please try refreshing.
      </div>
    );
  }

  const sanitizedProjectDescription = DOMPurify.sanitize(
    projectDetails.project_description || ""
  );
  const projectHasActualDescription =
    sanitizedProjectDescription.replace(/<[^>]*>/g, "").trim().length > 0;

  // +++ FIX: Create a variable to determine if the user can see briefs.
  const canViewBriefs = userRole === "admin" || userRole === "employee";

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
              {projectDetails.project_name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Project #{projectDetails.id}
            </p>
          </div>
          {/* +++ UPDATED SECTION FOR EDITABLE STATUS +++ */}
          <EditableProjectStatus
            projectId={projectDetails.id}
            currentStatus={projectDetails.status}
            onStatusUpdate={fetchProjectAndTasks}
            isEditable={userRole === "admin"}
            apiBaseUrl={API_BASE_URL}
            apiPath={getApiBasePathForRole("/update-project-status")}
            token={token}
          />
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            DESCRIPTION
          </h3>
          {projectHasActualDescription ? (
            <div
              className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300"
              dangerouslySetInnerHTML={{ __html: sanitizedProjectDescription }}
            />
          ) : (
            <p className="italic text-slate-500 dark:text-slate-400">
              No description provided.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              DUE DATE
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Icon
                icon="heroicons-outline:calendar"
                className="w-5 h-5 text-slate-500 dark:text-slate-300"
              />
              <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                {projectDetails.due_date
                  ? new Date(projectDetails.due_date).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" }
                    )
                  : "Not Set"}
              </p>
            </div>
          </div>
          <div
            className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition"
            onClick={handleOpenAssigneesModal}
          >
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              ASSIGNEES
            </p>
            <div className="flex justify-between items-center mt-2">
              {projectDetails.project_assignees &&
              projectDetails.project_assignees.length > 0 ? (
                <div className="flex -space-x-2">
                  {projectDetails.project_assignees
                    .slice(0, 4)
                    .map(
                      ({ user }) =>
                        user && (
                          <img
                            key={user.id}
                            src={
                              user.profile_pic
                                ? `${API_BASE_URL}/storage/${user.profile_pic}`
                                : `https://ui-avatars.com/api/?name=${user.name}&background=random`
                            }
                            alt={user.name}
                            title={user.name}
                            className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                          />
                        )
                    )}
                  {projectDetails.project_assignees.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                      +{projectDetails.project_assignees.length - 4}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No one assigned
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {tasks.length > 0 ? (
       // Farz karein ke ye saari cheezein aapke component mein pehle se import/define hain:
// navigate, tasks, userRole, handleKanbanBoard, handleOpenAddTaskModal, etc.

<div className="bg-white dark:bg-slate-700/50 rounded-lg shadow-lg overflow-hidden">
  {/* === SECTION HEADER: Title and Action Buttons (Responsive) === */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-slate-600 gap-4">
    <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
      Tasks for this Project
    </h2>
    {/* Buttons: Stack on mobile, row on desktop */}
    <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
      <button
        onClick={handleKanbanBoard}
        className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
        Kanban Board
      </button>
      <button
        onClick={handleOpenAddTaskModal}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Add Task
      </button>
    </div>
  </div>

  {/* === DESKTOP TABLE HEADER (Hidden on mobile) === */}
  <div className="hidden sm:grid grid-cols-12 bg-slate-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-300 sticky top-0 z-10">
    <div className="col-span-12 sm:col-span-4 p-3 sm:p-4">Name</div>
    <div className="col-span-12 sm:col-span-2 p-3 sm:p-4">Assignees</div>
    <div className="col-span-6 sm:col-span-2 p-3 sm:p-4">Status</div>
    <div className="col-span-6 sm:col-span-2 p-3 sm:p-4">Due date</div>
    <div className="col-span-6 sm:col-span-1 p-3 sm:p-4">Priority</div>
    <div className="col-span-6 sm:col-span-1 p-3 sm:p-4 text-center">Actions</div>
  </div>

  {/* === SCROLLABLE TASKS CONTAINER === */}
  <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
    {tasks.map((task, index) => {
      const mappedTaskAssignees = (task.assignees || [])
        .map((assigneeEntry) => mapApiAssigneeToLocal(assigneeEntry.user || assigneeEntry))
        .filter(Boolean);
      return (
        <div key={task.id || `task-${index}`} className="border-b border-gray-200 dark:border-slate-600 last:border-b-0">
          
          {/* --- DESKTOP VIEW (Visible on sm screens and up) --- */}
          <div className="hidden sm:grid grid-cols-12 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs sm:text-sm">
            <div className="col-span-12 sm:col-span-4 p-3 sm:p-4 flex items-center cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
              <span className="text-slate-900 dark:text-slate-100 truncate">{task.task_title || "N/A"}</span>
            </div>
            <div className="col-span-12 sm:col-span-2 p-3 sm:p-4 flex items-center" onClick={() => navigate(`/task/${task.id}`)}>
              {/* Assignee Avatars */}
               {mappedTaskAssignees.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden items-center">
                        {mappedTaskAssignees.slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST).map((assignee) =>
                            assignee.profilePic ? (
                              <img key={assignee.id} src={assignee.profilePic} alt={assignee.name} title={assignee.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white dark:ring-slate-700" />
                            ) : (
                              <span key={assignee.id} title={assignee.name} className={`w-7 h-7 sm:w-8 sm:h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-1 ring-white dark:ring-slate-700`}>{assignee.avatar}</span>
                            )
                        )}
                        {mappedTaskAssignees.length > MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-1 ring-white dark:ring-slate-700">+{mappedTaskAssignees.length - MAX_DISPLAY_ASSIGNEES_IN_LIST}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">Unassigned</span>
                )}
            </div>
            <div className="col-span-6 sm:col-span-2 p-3 sm:p-4 flex items-center cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(task.task_status)}`}>{String(task.task_status || "N/A").toUpperCase()}</span>
            </div>
            <div className="col-span-6 sm:col-span-2 p-3 sm:p-4 flex items-center cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
              <span className="text-slate-700 dark:text-slate-300">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="col-span-6 sm:col-span-1 p-3 sm:p-4 flex items-center cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
              <span className={`font-medium ${getPriorityClass(task.priority)}`}>{task.priority || "N/A"}</span>
            </div>
            <div className="col-span-6 sm:col-span-1 p-3 sm:p-4 flex items-center justify-center space-x-1">
              {/* Action Buttons */}
              <button onClick={(e) => { e.stopPropagation(); handleOpenEditTaskModal(task); }} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 p-1 rounded hover:bg-blue-100 dark:hover:bg-slate-700" title="Edit Task"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
              {(userRole === "admin" || userRole === "employee") && (<button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded hover:bg-red-100 dark:hover:bg-slate-700" title="Delete Task"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>)}
            </div>
          </div>
          
          {/* --- MOBILE VIEW (Card Layout, hidden on sm screens and up) --- */}
          <div className="block sm:hidden p-4">
            <div className="flex justify-between items-start gap-3">
                <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2 cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
                    {task.task_title || "Untitled Task"}
                </h3>
                {/* Mobile Actions */}
                <div className="flex-shrink-0 flex items-center space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditTaskModal(task); }} className="text-blue-500 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                    {(userRole === "admin" || userRole === "employee") && (<button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-500 p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>)}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-2 text-sm">
                <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">STATUS</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(task.task_status)}`}>{String(task.task_status || "N/A").toUpperCase()}</span>
                </div>
                <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">DUE DATE</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}</div>
                </div>
                <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">PRIORITY</div>
                    <div className={`font-medium ${getPriorityClass(task.priority)}`}>{task.priority || "N/A"}</div>
                </div>
            </div>
            <div className="mt-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">ASSIGNEES</div>
                {/* Mobile Assignees */}
                {mappedTaskAssignees.length > 0 ? (
                      <div className="flex -space-x-2 overflow-hidden items-center">
                        {mappedTaskAssignees.slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST).map((assignee) =>
                            assignee.profilePic ? (
                              <img key={assignee.id} src={assignee.profilePic} alt={assignee.name} title={assignee.name} className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-700" />
                            ) : (
                              <span key={assignee.id} title={assignee.name} className={`w-8 h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-2 ring-white dark:ring-slate-700`}>{assignee.avatar}</span>
                            )
                        )}
                        {mappedTaskAssignees.length > MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                          <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-2 ring-white dark:ring-slate-700">+{mappedTaskAssignees.length - MAX_DISPLAY_ASSIGNEES_IN_LIST}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400 italic">Unassigned</span>
                )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>
      ) : (
        <div className="text-center p-10 bg-white dark:bg-slate-800 rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
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
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-white">
            No Tasks in this Project Yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get started by adding the first task to "
            {projectDetails?.project_name || "this project"}".
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={handleKanbanBoard}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              View Kanban Board
            </button>
            <button
              type="button"
              onClick={handleOpenAddTaskModal}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add New Task
            </button>
          </div>
        </div>
      )}

      {/* +++ FIX: WRAPPED THE ENTIRE BRIEFS SECTION IN A ROLE CHECK +++ */}
      {projectDetails && canViewBriefs && (
      // Farz karein ke ye saari cheezein aapke component mein pehle se import/define hain:
// briefs, handleOpenAddBriefModal, handleViewBriefDetails, handleOpenEditBriefModal, handleDeleteBrief, isManagerOrAdmin, isImageFile, etc.

<div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-sm">
  {/* === SECTION HEADER (Responsive) === */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 gap-4">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
      <h2 className="text-xl font-bold dark:text-white bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Project Briefs
      </h2>
      <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full">
        {briefs.length} {briefs.length === 1 ? "Brief" : "Briefs"}
      </span>
    </div>
    <button
      onClick={handleOpenAddBriefModal}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center w-full sm:w-auto justify-center"
    >
      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      <span>Add Brief</span>
    </button>
  </div>
  
  {briefs.length > 0 ? (
    <>
      {/* === DESKTOP TABLE HEADER (Hidden on mobile) === */}
      <div className="hidden sm:grid grid-cols-12 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 sticky top-0 z-10">
        <div className="col-span-5 p-4 sm:p-5 flex items-center space-x-2">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            <span>Description</span>
        </div>
        <div className="col-span-2 p-4 sm:p-5 flex items-center space-x-2">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
            <span>Date</span>
        </div>
        <div className="col-span-3 p-4 sm:p-5 flex items-center space-x-2">
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            <span>Attachments</span>
        </div>
        <div className="col-span-2 p-4 sm:p-5 text-center">
            <span>Actions</span>
        </div>
      </div>
      
      {/* === SCROLLABLE BRIEFS CONTAINER === */}
      <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
        {briefs.map((brief, index) => (
          <div key={brief.id || `brief-${index}`} className="border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            
            {/* --- DESKTOP VIEW (Grid Row) --- */}
            <div className={`hidden sm:grid grid-cols-12 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all duration-200 text-xs sm:text-sm group ${ index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/50" }`}>
              <div className="col-span-5 p-4 sm:p-5">
                <div className="relative"><div className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: brief.sanitized_description || "N/A" }} /></div>
              </div>
              <div className="col-span-2 p-4 sm:p-5 flex items-center">
                <div className="flex items-center space-x-2"><div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors duration-300"><svg className="h-3 w-3 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M3 7h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg></div><span className="text-slate-700 dark:text-slate-300 font-medium">{brief.brief_date ? new Date(brief.brief_date).toLocaleDateString() : "N/A"}</span></div>
              </div>
              <div className="col-span-3 p-4 sm:p-5">
                <div className="flex flex-wrap gap-3">
                  {brief.attachments && brief.attachments.length > 0 ? (
                    brief.attachments.map((att) => (
                      <div key={att.id} className="flex items-start space-x-3 group/attachment">
                        {isImageFile(att.file_type) ? (
                            <a href={att.url} target="_blank" rel="noopener noreferrer" title={`View ${att.file_name}`} className="flex-shrink-0 relative overflow-hidden rounded-xl"><img src={att.url} alt={att.file_name} className="w-14 h-14 sm:w-16 sm:h-16 object-cover border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:scale-110 hover:shadow-lg" /><div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center"><svg className="h-5 w-5 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></div></a>
                        ) : (
                            <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-lg group-hover/attachment:from-blue-50 group-hover/attachment:to-indigo-100 dark:group-hover/attachment:from-slate-600 dark:group-hover/attachment:to-slate-700" title={att.file_type}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400 group-hover/attachment:text-blue-600 dark:group-hover/attachment:text-blue-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                        )}
                      </div>
                    ))
                  ) : (<div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 italic"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>No attachments</span></div>)}
                </div>
              </div>
              <div className="col-span-2 p-4 sm:p-5 flex items-center justify-center space-x-1">
                {/* Action Buttons */}
                 <button onClick={(e) => { e.stopPropagation(); handleViewBriefDetails(brief.id); }} className="p-2 text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500 rounded-full hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-300 hover:scale-110 hover:shadow-md" title="View Details"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></button>
                 <button onClick={(e) => { e.stopPropagation(); handleOpenEditBriefModal(brief); }} className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-500 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-all duration-300 hover:scale-110 hover:shadow-md" title="Edit Brief"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                 {isManagerOrAdmin && (<button onClick={(e) => { e.stopPropagation(); handleDeleteBrief(brief.id); }} className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-900/50 transition-all duration-300 hover:scale-110 hover:shadow-md" title="Delete Brief"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>)}
              </div>
            </div>

            {/* --- MOBILE VIEW (Card Layout) --- */}
            <div className={`block sm:hidden p-4 ${ index % 2 === 0 ? "bg-white dark:bg-slate-800" : "bg-slate-50 dark:bg-slate-800/50" }`}>
              {/* Description */}
              <div className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: brief.sanitized_description || "N/A" }} />
              
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {/* Date and Actions */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">BRIEF DATE</div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{brief.brief_date ? new Date(brief.brief_date).toLocaleDateString() : "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    {/* Action Buttons */}
                    <button onClick={(e) => { e.stopPropagation(); handleViewBriefDetails(brief.id); }} className="p-2 text-green-500 rounded-full" title="View Details"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); handleOpenEditBriefModal(brief); }} className="p-2 text-blue-500 rounded-full" title="Edit Brief"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                    {isManagerOrAdmin && (<button onClick={(e) => { e.stopPropagation(); handleDeleteBrief(brief.id); }} className="p-2 text-red-500 rounded-full" title="Delete Brief"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>)}
                  </div>
                </div>

                {/* Attachments */}
                <div className="mt-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">ATTACHMENTS</div>
                    <div className="flex flex-wrap gap-3">
                    {brief.attachments && brief.attachments.length > 0 ? (
                        brief.attachments.map((att) => (
                        <div key={att.id} className="flex items-start space-x-3 group/attachment">
                            {isImageFile(att.file_type) ? (
                                <a href={att.url} target="_blank" rel="noopener noreferrer" title={`View ${att.file_name}`} className="flex-shrink-0 relative overflow-hidden rounded-lg"><img src={att.url} alt={att.file_name} className="w-14 h-14 object-cover border-2 border-slate-200 dark:border-slate-600" /></a>
                            ) : (
                                <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg border-2 border-slate-200 dark:border-slate-600" title={att.file_type}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                            )}
                        </div>
                        ))
                    ) : (<div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 italic text-xs"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>No attachments</span></div>)}
                    </div>
                </div>

              </div>
            </div>
            
          </div>
        ))}
      </div>
    </>
  ) : (
    <div className="p-10 text-center text-slate-500 dark:text-slate-400">
      No briefs have been added to this project yet.
    </div>
  )}
</div>
      )}

      {(userRole === "admin" || userRole === "employee") && (
        <div className="mt-8">
          <div className="h-[700px] relative">
            <ConversationBox
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              attachments={attachments}
              setAttachments={setAttachments}
              onSendMessage={handleSendMessage}
              onUpdateMessage={handleUpdateMessage}
              onDeleteMessage={handleDeleteMessage}
              isSending={isSending}
              isLoading={isMessagesLoading}
              error={messagesError}
              currentUserId={currentUserId}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
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
    </div>
  );
};
export default ProjectDetailsPage;
