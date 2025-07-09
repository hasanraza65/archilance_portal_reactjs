import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Clock,
  MessageCircle,
  CheckCircle,
  Paperclip,
  Send,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Calendar,
  LayoutGrid,
  BookText,
  AlertTriangle,
  Loader,
  ListTodo,
  Star,
  Briefcase,
  ArrowLeft,
  Users,
  TrendingUp,
  Zap,
  Target,
  Award,
  Activity,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit,
  XCircle,
  FileText,
  ImageIcon,
  Undo2,
} from "lucide-react";

// Helper to remove HTML tags for truncation
const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

// Animated Background Component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden">
    {" "}
    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />{" "}
    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />{" "}
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-500" />{" "}
  </div>
);

// OrderRequirements Component
const OrderRequirements = ({ htmlContent }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textContent = stripHtml(htmlContent);
  const maxLength = 200;
  const isTruncatable = textContent.length > maxLength;
  if (!htmlContent) return null;
  return (
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-8 mb-8 hover:shadow-3xl transition-all duration-500 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
            <ClipboardList className="w-6 h-6" />
          </div>
          Project Description
        </h2>
      </div>
      <div
        className={`prose max-w-none text-gray-700 leading-relaxed transition-all duration-700 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[1000px] opacity-100" : "max-h-24 opacity-90"
        }`}
        dangerouslySetInnerHTML={{
          __html:
            isTruncatable && !isExpanded
              ? `${htmlContent.slice(0, 250)}...`
              : htmlContent,
        }}
      />
      {isTruncatable && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold mt-4 px-6 py-2 rounded-full text-sm flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg"
        >
          {isExpanded ? "Show Less" : "Show More"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
};

// OrderStatusStep Component
const OrderStatusStep = ({ status, text, isLast = false }) => {
  const statusConfig = {
    done: {
      Icon: <CheckCircle className="w-8 h-8 text-emerald-500" />,
      textClass: "text-gray-800 font-semibold",
      lineClass: "border-emerald-300",
    },
    progress: {
      Icon: (
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
          <Clock className="w-4 h-4 text-white" />
        </div>
      ),
      textClass: "text-blue-700 font-bold",
      lineClass: "border-blue-300",
    },
    pending: {
      Icon: (
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
        </div>
      ),
      textClass: "text-gray-500",
      lineClass: "border-gray-300",
    },
  };
  const { Icon, textClass, lineClass } = statusConfig[status];
  return (
    <div className="flex items-start group">
      <div className="flex flex-col items-center mr-6 relative">
        <div className="transition-transform duration-300 group-hover:scale-110">
          {Icon}
        </div>
        {!isLast && (
          <div
            className={`mt-3 h-12 w-px border-l-2 border-dashed ${lineClass} transition-colors duration-300`}
          ></div>
        )}
      </div>
      <div className="pt-1">
        <span className={`text-lg ${textClass} transition-colors duration-300`}>
          {text}
        </span>
      </div>
    </div>
  );
};

// ProjectTasksList Component
const ProjectTasksList = ({ tasks, apiBaseUrl }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 4;
  if (!tasks || tasks.length === 0) {
    return (
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-8 text-center flex flex-col justify-center h-full">
        <div className="p-4 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl text-white mx-auto mb-4 w-fit">
          <Briefcase className="w-12 h-12" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          No Tasks Assigned
        </h3>
        <p className="text-gray-500 text-lg">
          There are currently no tasks for this project.
        </p>
      </div>
    );
  }
  const indexOfLastTask = currentPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalPages = Math.ceil(tasks.length / tasksPerPage);
  const getStatusBadge = (status) => {
    switch (status) {
      case "Completed":
        return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg";
      case "In Progress":
        return "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg";
      case "Todo":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg";
      default:
        return "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg";
    }
  };
  return (
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden h-full">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white">
            <ListTodo className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Project Tasks
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {currentTasks.map((task, index) => (
          <div
            key={task.id}
            className="group p-6 bg-white/80 backdrop-blur-sm border border-white/40 rounded-2xl hover:shadow-xl hover:bg-white/90 transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4 gap-4">
              <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
                {task.task_title}
              </h4>
              <span
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1 text-sm font-bold rounded-full ${getStatusBadge(
                  task.task_status
                )} transition-transform duration-300 group-hover:scale-105`}
              >
                {task.task_status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div
                  className="flex items-center gap-2 text-gray-600"
                  title={`${task.attachments.length} attachments`}
                >
                  <Paperclip size={16} className="text-gray-500" />
                  <span className="font-medium">{task.attachments.length}</span>
                </div>
                <div
                  className="flex items-center gap-2 text-gray-600"
                  title={`Priority: ${task.priority}`}
                >
                  <Star
                    size={16}
                    className={`${
                      task.priority === "Urgent" || task.priority === "High"
                        ? "text-red-500"
                        : "text-amber-500"
                    } transition-colors`}
                  />
                  <span className="font-medium">{task.priority}</span>
                </div>
              </div>
              <div
                className="flex items-center -space-x-2"
                title={`Assigned to: ${task.assignees
                  .map((a) => a.user.name)
                  .join(", ")}`}
              >
                {task.assignees.map((assignee) =>
                  assignee.user.profile_pic ? (
                    <img
                      key={assignee.id}
                      src={`${apiBaseUrl}/storage/${assignee.user.profile_pic}`}
                      alt={assignee.user.name}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div
                      key={assignee.id}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-md hover:scale-110 transition-transform duration-300"
                    >
                      {assignee.user.name.charAt(0)}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex-shrink-0 p-4 bg-slate-50/50 flex items-center justify-center gap-4 border-t border-white/20">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-md hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="font-bold text-gray-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg text-gray-700 font-semibold shadow-md hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

// ===============================================
//         ADVANCED ConversationBox Component
// ===============================================
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (
      !window.confirm(
        "Are you sure you want to delete this message? This action cannot be undone."
      )
    )
      return;
    setIsProcessingAction(true);
    await onDeleteMessage(messageId);
    setIsProcessingAction(false);
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
              {renderAttachment(att.file_path, att.file_name)}
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
    <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 h-full flex flex-col overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Project Chat
          </h3>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
                className={`flex items-end gap-3 ${
                  isSentByMe ? "flex-row-reverse" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0">
                  {message.sender?.profile_pic ? (
                    <img
                      src={`${STORAGE_BASE_URL}${message.sender.profile_pic}`}
                      alt={message.sender.name}
                      className="w-full h-full rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
                      {message.sender?.name
                        ? message.sender.name.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                  )}
                </div>
                <div
                  className={`group relative max-w-md min-w-[150px] px-5 py-3 rounded-2xl shadow-lg ${
                    isSentByMe
                      ? "bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-br-md"
                      : "bg-white/90 text-gray-800 rounded-bl-md"
                  }`}
                >
                  {isEditing
                    ? renderEditView()
                    : renderMessageContent(message, isSentByMe)}
                  <p
                    className={`text-xs mt-2 text-right ${
                      isSentByMe ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {formatTime(message.created_at)}
                  </p>
                  {isSentByMe && !isEditing && (
                    <div className="absolute top-1 -right-12 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(message)}
                        disabled={isProcessingAction}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Edit size={12} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        disabled={isProcessingAction}
                        className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        <div ref={chatEndRef} />
      </div>
      <div className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 flex-shrink-0 space-y-3">
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
            className="w-full bg-white/80 border border-gray-200 rounded-2xl pl-12 pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) =>
              e.key === "Enter" && !isSending && onSendMessage()
            }
            disabled={isSending}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-200"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
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
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg hover:scale-105 disabled:opacity-50"
          >
            {isSending ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}{" "}
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for timer
const calculateTimeLeft = (dueDate) => {
  if (!dueDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const difference = +new Date(dueDate) - +new Date();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

// ===============================================
//           MAIN OrderDetailsPage Component
// ===============================================
const OrderDetailsPage = () => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const API_BASE_URL = "https://demo.aentora.com/backend/public";
  const token = Cookies.get("token");

  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // !! IMPORTANT: Replace '20' with the actual logged-in user's ID.    !!
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const CURRENT_USER_ID = 20;

  const [projectData, setProjectData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState({});

  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const fetchMessages = async () => {
    if (!token || !projectId) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/customer/project-chat/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch messages.");
      const data = await response.json();
      setMessages(data.chats || []);
      setMessagesError(null);
    } catch (err) {
      setMessagesError(err.message);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;
    setIsSending(true);
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("message", newMessage.trim());
    attachments.forEach((att) => formData.append("attachments[]", att.file));
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/customer/project-chat`,
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
        throw new Error(errData.message || "Failed to send message.");
      }
      const result = await response.json();
      setMessages((prev) => [...prev, result.chat]);
      setNewMessage("");
      setAttachments([]);
    } catch (err) {
      alert(`Error: ${err.message}`);
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
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/customer/project-chat/${messageId}`,
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
      return true;
    } catch (err) {
      alert(`Error: ${err.message}`);
      return false;
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/customer/project-chat/${messageId}`,
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
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("Authorization Error: No token found.");
      setIsLoading(false);
      return;
    }
    if (!projectId) {
      setError("Error: No Project ID provided.");
      setIsLoading(false);
      return;
    }
    const fetchInitialData = async () => {
      setIsLoading(true);
      setIsMessagesLoading(true);
      try {
        const projectResponse = await fetch(
          `${API_BASE_URL}/api/customer/project/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!projectResponse.ok) {
          const errData = await projectResponse.json().catch(() => ({}));
          throw new Error(
            errData.message ||
              `Failed to fetch project data. Status: ${projectResponse.status}`
          );
        }
        const projectData = await projectResponse.json();
        setProjectData(projectData);
        setTimeLeft(calculateTimeLeft(projectData.due_date));
        await fetchMessages();
        setError(null);
      } catch (err) {
        console.error("Initial Data Fetch Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsMessagesLoading(false);
      }
    };
    fetchInitialData();
    const pollInterval = setInterval(fetchMessages, 20000);
    return () => clearInterval(pollInterval);
  }, [projectId, token]);

  useEffect(() => {
    if (!projectData) return;
    const timer = setInterval(
      () => setTimeLeft(calculateTimeLeft(projectData.due_date)),
      1000
    );
    return () => clearInterval(timer);
  }, [projectData]);

  const getStatusSteps = (status) => {
    const steps = {
      placed: "pending",
      requirements: "pending",
      working: "pending",
      delivery: "pending",
    };
    if (!status) return steps;
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        steps.placed = "done";
        steps.requirements = "done";
        steps.working = "done";
        steps.delivery = "done";
        break;
      case "in progress":
        steps.placed = "done";
        steps.requirements = "done";
        steps.working = "progress";
        break;
      case "todo":
        steps.placed = "done";
        steps.requirements = "progress";
        break;
      default:
        steps.placed = "progress";
        break;
    }
    return steps;
  };
  const statusSteps = projectData ? getStatusSteps(projectData.status) : {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center relative">
        <AnimatedBackground />
        <div className="text-center">
          <div className="inline-block p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <Loader className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800">
              Loading Project...
            </h2>
            <p className="text-gray-600 mt-2">
              Please wait while we fetch your project details
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex justify-center items-center relative">
        <AnimatedBackground />
        <div className="text-center p-8 max-w-md">
          <div className="inline-block p-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <div className="p-4 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl text-white mx-auto mb-6 w-fit">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!projectData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      <AnimatedBackground />
      <div className="relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="p-3 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <div className="flex-1">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
                  {projectData.project_name}
                </h1>
                <p className="text-gray-600 text-lg">
                  Project #{projectData.id}
                </p>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  <Calendar size={16} />
                  <span>
                    Due:{" "}
                    {new Date(projectData.due_date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                  <Activity size={16} />
                  <span>{projectData.status}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/kanban/${projectData.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <LayoutGrid size={16} />
                  <span>Kanban Board</span>
                </button>
                <button
                  onClick={() => navigate(`/work-diary/${projectData.id}`)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <BookText size={16} />
                  <span>Work Diary</span>
                </button>
              </div>
            </div>
          </div>
          <OrderRequirements htmlContent={projectData.project_description} />
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              <div className="xl:col-span-3">
                <ProjectTasksList
                  tasks={projectData.tasks}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>
              <div className="xl:col-span-1 flex flex-col gap-6">
                <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 p-6 hover:shadow-3xl transition-all duration-500">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Time Remaining
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Days",
                        value: timeLeft.days || 0,
                        color: "from-blue-500 to-purple-500",
                      },
                      {
                        label: "Hours",
                        value: timeLeft.hours || 0,
                        color: "from-emerald-500 to-teal-500",
                      },
                      {
                        label: "Minutes",
                        value: timeLeft.minutes || 0,
                        color: "from-amber-500 to-orange-500",
                      },
                      {
                        label: "Seconds",
                        value: timeLeft.seconds || 0,
                        color: "from-pink-500 to-rose-500",
                      },
                    ].map((time) => (
                      <div key={time.label} className="text-center">
                        <div
                          className={`bg-gradient-to-br ${time.color} rounded-xl py-3 px-2 shadow-lg`}
                        >
                          <div className="text-2xl font-bold text-white">
                            {String(time.value).padStart(2, "0")}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2 font-medium">
                          {time.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-2xl border border-white/20 flex-1 hover:shadow-3xl transition-all duration-500">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        Project Progress
                      </h2>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        <span className="w-fit min-w-[100px] text-center whitespace-nowrap bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-1 rounded-full text-sm font-bold">
                          {projectData.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <OrderStatusStep
                        status={statusSteps.placed}
                        text="Project Created"
                      />
                      <OrderStatusStep
                        status={statusSteps.requirements}
                        text="Requirements Reviewed"
                      />
                      <OrderStatusStep
                        status={statusSteps.working}
                        text="Work in Progress"
                      />
                      <OrderStatusStep
                        status={statusSteps.delivery}
                        text="Project Delivered"
                        isLast={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              <div className="h-[calc(100vh-8rem)] min-h-[700px]">
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
                  currentUserId={CURRENT_USER_ID}
                  apiBaseUrl={API_BASE_URL}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
