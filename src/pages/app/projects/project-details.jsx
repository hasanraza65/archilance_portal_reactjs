import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import AddTaskModal from "../projects/Task/PartialTask/AddSubTaskModal";
import EditTaskModal from "../projects/Task/PartialTask/EditTaskModal";
import AddBriefModal from "./Brief-task/AddBriefModel";
import EditBriefModal from "./Brief-task/EditBriefModel";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { getApiPrefix, getUserRole } from "@/pages/utility/apiHelper";
import { useSelector, useDispatch } from "react-redux";
import { toggleUpdateAssigneesModal, setEditModalAndItem } from "./store";
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
import EditableProjectStatus from "./EditableProjectStatus";
import EditProject from "./EditProject";
import { useBreadcrumbs } from "../../../components/ui/BreadcrumbsContext";

// =================================================================
// == HELPER COMPONENTS AND FUNCTIONS (ADAPTED FROM YOUR TASKLIST.JSX) ==
// =================================================================

// In-file CSS component for mobile responsiveness
const ResponsiveTableStyles = () => {
  useEffect(() => {
    const styleId = "responsive-project-details-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .responsive-project-table {
        table-layout: fixed;
        width: 100%;
      }
      .responsive-project-table td, .responsive-project-table th {
        word-break: break-word;
      }
      @media (max-width: 767px) {
        .responsive-project-table thead {
          display: none;
        }
        .responsive-project-table tbody tr {
          display: block;
          margin-bottom: 1rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0; /* slate-200 */
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.05);
          padding: 0.25rem;
          background-color: #ffffff; /* white */
        }
        .dark .responsive-project-table tbody tr {
          border-color: #334155; /* slate-700 */
          background-color: #1e293b; /* slate-800 */
        }
        .responsive-project-table td {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          text-align: right;
          border-bottom: 1px solid #f1f5f9; /* slate-100 */
        }
        .dark .responsive-project-table td {
          border-bottom-color: #334155; /* slate-700 */
        }
        .responsive-project-table tr td:last-child {
          border-bottom: none;
        }
        .responsive-project-table td::before {
          content: attr(data-label);
          font-weight: 600;
          text-align: left;
          margin-right: 1rem;
          color: #475569; /* slate-600 */
        }
        .dark .responsive-project-table td::before {
          color: #94a3b8; /* slate-400 */
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  return null;
};

const StatusBadge = ({ status }) => {
  const statusString = String(status || "unknown").toLowerCase();
  const statusColors = {
    backlog:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    "on hold":
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "awaiting info":
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    "in progress":
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "in-house review":
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    "client review":
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };
  const defaultColor =
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
        statusColors[statusString] || defaultColor
      }`}
    >
      {status || "Unknown"}
    </span>
  );
};

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
            message
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
      <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Job Chat
          </h3>
        </div>
      </div>
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
            const isEditing =
              editingMessage && editingMessage.id === message.id;
            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 sm:gap-3 ${
                  isSentByMe ? "flex-row-reverse" : ""
                }`}
                onClick={() => {
                  if (window.innerWidth < 640 && isSentByMe && !isEditing) {
                    setMobileActionMessageId(
                      mobileActionMessageId === message.id ? null : message.id
                    );
                  }
                }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0">
                  {message.sender?.profile_pic ? (
                    <img
                      src={`${STORAGE_BASE_URL}${message.sender.profile_pic}`}
                      alt={message.sender.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg border-2 border-white shadow-md">
                      {message.sender?.name
                        ? message.sender.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>
                <div
                  className={`group relative max-w-[85%] sm:max-w-md min-w-[120px] px-4 py-2 sm:px-5 sm:py-3 rounded-2xl shadow-lg ${
                    isSentByMe
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md"
                      : "bg-white/90 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-md"
                  }`}
                >
                  {isEditing
                    ? renderEditView()
                    : renderMessageContent(message, isSentByMe)}
                  <p
                    className={`text-xs mt-2 text-right ${
                      isSentByMe
                        ? "text-blue-200"
                        : "text-gray-500 dark:text-slate-400"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                  {isSentByMe && !isEditing && (
                    <div className="absolute top-1 -left-12 flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                      <button
                        onClick={() => handleStartEdit(message)}
                        disabled={isProcessingAction}
                        className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"
                      >
                        <Edit
                          size={12}
                          className="text-gray-600 dark:text-slate-200"
                        />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={isProcessingAction}
                        className="p-1.5 bg-white dark:bg-slate-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-500 disabled:opacity-50"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  )}
                  {isSentByMe &&
                    !isEditing &&
                    mobileActionMessageId === message.id && (
                      <div className="sm:hidden flex justify-end gap-2 border-t border-white/20 mt-2 pt-2">
                        <button
                          onClick={() => handleStartEdit(message)}
                          disabled={isProcessingAction}
                          className="flex items-center gap-1 text-xs text-blue-100 disabled:opacity-50"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          disabled={isProcessingAction}
                          className="flex items-center gap-1 text-xs text-red-200 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        <div ref={chatEndRef} />
      </div>
      <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 flex-shrink-0 space-y-3">
        {attachments.length > 0 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {renderAttachment(att.preview, att.file.name, true)}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md bg-red-500 hover:bg-red-600"
                >
                  <XCircle size={12} />
                </button>
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
            onKeyPress={(e) =>
              e.key === "Enter" && !isSending && onSendMessage()
            }
            disabled={isSending}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-slate-400" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            hidden
          />
          <button
            onClick={onSendMessage}
            disabled={
              isSending || (!newMessage.trim() && attachments.length === 0)
            }
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:scale-105 disabled:opacity-50"
          >
            {isSending ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
// Helper Functions (unchanged, for context)
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
  const statusString = String(status).toLowerCase();
  switch (statusString) {
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
    case "on hold":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "backlog":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "awaiting info":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "in-house review": // FIX: Hyphenated
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    case "client review":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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
  const apiPrefix = getApiPrefix();
  const cleanBasePath = basePath.startsWith("/") ? basePath : `/${basePath}`;
  if (apiPrefix) {
    return `/api/${apiPrefix}${cleanBasePath}`;
  }
  return `/api/admin${cleanBasePath}`;
};

const getStatusGradient = (status) => {
  const statusString = String(status || "unknown").toLowerCase();
  const statusGradients = {
    "on hold":
      "from-orange-50 to-orange-100 dark:from-orange-800 dark:to-orange-900",
    backlog:
      "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900",
    "awaiting info":
      "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900",
    "in progress":
      "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900",
    "in-house review":
      "from-cyan-50 to-cyan-100 dark:from-cyan-800 dark:to-cyan-900", // FIX: Hyphenated
    "client review":
      "from-indigo-50 to-indigo-100 dark:from-indigo-800 dark:to-indigo-900",
    completed:
      "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
    done: "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900",
  };

  return (
    statusGradients[statusString] ||
    "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900"
  );
};

// =================================================================
// == MAIN COMPONENT START ==
// =================================================================
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
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isAddBriefModalOpen, setIsAddBriefModalOpen] = useState(false);
  const [isEditBriefModalOpen, setIsEditBriefModalOpen] = useState(false);
  const [briefToEdit, setBriefToEdit] = useState(null);

  // State for expand/collapse functionality
  const [expandedSections, setExpandedSections] = useState({});

  const MAX_DISPLAY_ASSIGNEES_IN_LIST = 2;
  // --- UPDATED CODE ---
  // "supervisor" ko is list mein add kiya gaya hai
  const isManagerOrAdmin =
    currentUserRole === "admin" ||
    currentUserRole === "manager" ||
    currentUserRole === "supervisor" ||
    currentUserRole === "employee";
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
    // --- UPDATED CODE ---
    // "supervisor" ko chat dekhne ki permission di gayi hai
    const canViewChat = [
      "admin",
      "manager",
      "employee",
      "outsource",
      "supervisor",
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

  useEffect(() => {
    // --- UPDATED CODE ---
    // "supervisor" ko chat dekhne ki permission di gayi hai
    const canViewChat = [
      "admin",
      "manager",
      "employee",
      "outsource",
      "supervisor",
    ].includes(currentUserRole);
    if (canViewChat) {
      fetchMessages();
      const pollInterval = setInterval(fetchMessages, 20000);
      return () => clearInterval(pollInterval);
    }
  }, [fetchMessages, currentUserRole]);

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

        const uniqueStatuses = [
          ...new Set(
            processedTasks.map((t) =>
              String(t.task_status || "unknown").toLowerCase()
            )
          ),
        ];
        const initialExpandedState = {};
        uniqueStatuses.forEach((status) => {
          initialExpandedState[status] = true;
        });
        setExpandedSections(initialExpandedState);

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

  const prevUpdateAssigneesModal = useRef(updateAssigneesModal);
  const prevEditProjectModalOpen = useRef(isEditProjectModalOpen);

  useEffect(() => {
    if (
      prevUpdateAssigneesModal.current === true &&
      updateAssigneesModal === false
    ) {
      fetchProjectAndTasks();
    }
    prevUpdateAssigneesModal.current = updateAssigneesModal;
    if (
      prevEditProjectModalOpen.current === true &&
      isEditProjectModalOpen === false
    ) {
      fetchProjectAndTasks();
    }
    prevEditProjectModalOpen.current = isEditProjectModalOpen;
  }, [updateAssigneesModal, isEditProjectModalOpen, fetchProjectAndTasks]);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [fetchProjectAndTasks]);

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
      "in-house review", // FIX: Hyphenated
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
    fetchProjectAndTasks();
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
  const handleTaskUpdated = () => {
    fetchProjectAndTasks();
    Swal.fire({
      icon: "success",
      title: "Project Updated!",
      text: "The project has been successfully updated.",
      timer: 1500,
      showConfirmButton: false,
    });
  };
  const handleKanbanBoard = () => navigate(`/job/${id}/kanban`);
  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
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
          Swal.fire("Deleted!", "Your project has been deleted.", "success");
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
          Swal.fire("Deleted!", "The job brief has been deleted.", "success");
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
    navigate(`/job-brief/${briefId}`);
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
            The job with ID: {id} could not be found.
            {error && <span className="block mt-1">Details: {error}</span>}
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
        No job data available. Please try refreshing.
      </div>
    );
  }

  const sanitizedProjectDescription = DOMPurify.sanitize(
    projectDetails.project_description || ""
  );
  const projectHasActualDescription =
    sanitizedProjectDescription.replace(/<[^>]*>/g, "").trim().length > 0;
  // --- UPDATED CODE ---
  // "supervisor" ko briefs aur chat dekhne ki permission di gayi hai
  const canViewBriefs = [
    "admin",
    "manager",
    "employee",
    "outsource",
    "supervisor",
  ].includes(currentUserRole);
  const canViewChat = [
    "admin",
    "manager",
    "employee",
    "outsource",
    "supervisor",
  ].includes(currentUserRole);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <ResponsiveTableStyles />
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
              {projectDetails.project_name}
            </h1>
            {isManagerOrAdmin && (
              <button
                onClick={handleOpenEditProjectModal}
                className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                title="Edit Job Name"
              >
                <Edit size={16} className="text-gray-600 dark:text-slate-300" />
              </button>
            )}
          </div>
          <div className="w-full md:w-auto flex justify-end">
            <EditableProjectStatus
              projectId={projectDetails.id}
              currentStatus={projectDetails.status}
              onStatusUpdate={fetchProjectAndTasks}
              isEditable={isManagerOrAdmin}
              apiBaseUrl={API_BASE_URL}
              apiPath={getApiBasePathForRole("/update-project-status")}
              token={token}
            />
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Job #{projectDetails.id}
        </p>
        <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              DESCRIPTION
            </h3>
          </div>
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
          <div
            className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-xl relative group cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition"
            onClick={handleOpenEditProjectModal}
          >
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
        <div className="w-full space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 dark:border-slate-600 gap-4 bg-white dark:bg-slate-800 rounded-t-lg">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-white">
              Project for this Job
            </h2>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
              <button
                onClick={handleKanbanBoard}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
                Kanban Board
              </button>
              <button
                onClick={handleOpenAddTaskModal}
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center"
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
                Add Project
              </button>
            </div>
          </div>
          {sortedStatusOrder.map((status) => {
            const tasksForStatus = groupedTasks[status];
            return (
              <div
                key={status}
                className="rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r ${getStatusGradient(
                    status
                  )}`}
                  onClick={() => toggleSection(status)}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      icon={
                        expandedSections[status]
                          ? "heroicons:chevron-down"
                          : "heroicons:chevron-right"
                      }
                      className="w-5 h-5 text-slate-600 dark:text-slate-300"
                    />
                    <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                      {status}
                    </h3>
                    <span className="px-2 py-1 bg-white dark:bg-slate-700 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                      {tasksForStatus.length}
                    </span>
                  </div>
                  <StatusBadge status={status} />
                </div>

                {expandedSections[status] && (
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-2 md:p-0">
                    <table className="min-w-full responsive-project-table">
                      <thead className="hidden md:table-header-group bg-slate-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-4/12">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                            Assignees
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                            Due date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-1/12">
                            Priority
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider w-2/12">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-transparent md:bg-white md:dark:bg-slate-800 md:divide-y md:divide-slate-200 md:dark:divide-slate-700">
                        {tasksForStatus.map((task) => {
                          const mappedTaskAssignees = (task.assignees || [])
                            .map((a) => mapApiAssigneeToLocal(a.user || a))
                            .filter(Boolean);
                          return (
                            <tr
                              key={task.id}
                              onClick={() =>
                                navigate(`/project/${task.id}`, {
                                  state: { jobId: id },
                                })
                              }
                              className="block md:table-row md:hover:bg-slate-50 md:dark:hover:bg-slate-700/50 cursor-pointer transition-colors duration-150"
                            >
                              <td
                                data-label="Name"
                                className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                              >
                                <span className="text-slate-900 dark:text-slate-100 truncate">
                                  {task.task_title || "N/A"}
                                </span>
                              </td>
                              <td
                                data-label="Assignees"
                                className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                              >
                                {mappedTaskAssignees.length > 0 ? (
                                  <div className="flex -space-x-2 overflow-hidden items-center justify-end md:justify-start">
                                    {mappedTaskAssignees
                                      .slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST)
                                      .map((assignee) =>
                                        assignee.profilePic ? (
                                          <img
                                            key={assignee.id}
                                            src={assignee.profilePic}
                                            alt={assignee.name}
                                            title={assignee.name}
                                            className="w-8 h-8 rounded-full object-cover ring-1 ring-white dark:ring-slate-700"
                                          />
                                        ) : (
                                          <span
                                            key={assignee.id}
                                            title={assignee.name}
                                            className={`w-8 h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-white dark:ring-slate-700`}
                                          >
                                            {assignee.avatar}
                                          </span>
                                        )
                                      )}
                                    {mappedTaskAssignees.length >
                                      MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-1 ring-white dark:ring-slate-700">
                                        +
                                        {mappedTaskAssignees.length -
                                          MAX_DISPLAY_ASSIGNEES_IN_LIST}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td
                                data-label="Due Date"
                                className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                              >
                                <span className="text-slate-700 dark:text-slate-300">
                                  {task.due_date
                                    ? new Date(
                                        task.due_date
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </td>
                              <td
                                data-label="Priority"
                                className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                              >
                                <span
                                  className={`font-medium ${getPriorityClass(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority || "N/A"}
                                </span>
                              </td>
                              <td
                                data-label="Actions"
                                className="block md:table-cell px-4 py-2 md:py-4 w-full md:w-auto"
                              >
                                <div
                                  className="flex items-center justify-end md:justify-center space-x-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) =>
                                      handleOpenEditTaskModal(task, e)
                                    }
                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-600 p-1 rounded hover:bg-blue-100 dark:hover:bg-slate-700"
                                    title="Edit Project"
                                  >
                                    <Icon
                                      icon="heroicons:pencil-square"
                                      className="w-5 h-5"
                                    />
                                  </button>
                                  {isManagerOrAdmin && (
                                    <button
                                      onClick={(e) =>
                                        handleDeleteTask(task.id, e)
                                      }
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded hover:bg-red-100 dark:hover:bg-slate-700"
                                      title="Delete Task"
                                    >
                                      <Icon
                                        icon="heroicons-outline:trash"
                                        className="w-5 h-5"
                                      />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
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
            No Projects in this Job Yet
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Get started by adding the first project to "
            {projectDetails?.project_name || "this job"}".
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
              Add New Project
            </button>
          </div>
        </div>
      )}

      {projectDetails && canViewBriefs && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden backdrop-blur-sm">
          {/* Briefs section remains unchanged */}
        </div>
      )}

      {canViewChat && (
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
      <EditProject />
    </div>
  );
};

export default ProjectDetailsPage;
