import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils"; // Assuming utils file

// Define your base storage URL.
const STORAGE_BASE_PATH = "https://demo.aentora.com/backend/public/storage/";

// A simple dropdown component (remains the same)
const DropdownMenu = ({ options, onSelect, onClose }) => {
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      role="menu"
    >
      <div className="py-1" role="none">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => {
              onSelect(option.action);
            }}
            disabled={option.disabled}
            className="text-slate-700 disabled:text-slate-400 block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 hover:text-slate-900 disabled:hover:bg-transparent"
            role="menuitem"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const CommentList = ({
  comments,
  newComment,
  setNewComment,
  handleCommentSubmit, // For new comments
  isSubmittingComment,
  commentError,
  taskId,
  onEditComment, // For editing existing comments
  onDeleteComment,
  currentUserId,
}) => {
  // State for NEW comments
  const [attachments, setAttachments] = useState([]);

  // State for context menu
  const [activeDropdownCommentId, setActiveDropdownCommentId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // State for EDITING comments
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [currentEditingAttachments, setCurrentEditingAttachments] = useState(
    []
  );
  const [newAttachmentsForEdit, setNewAttachmentsForEdit] = useState([]);
  const [attachmentIdsToDeleteInEdit, setAttachmentIdsToDeleteInEdit] =
    useState([]);

  // General processing state
  const [isProcessingEditOrDelete, setIsProcessingEditOrDelete] =
    useState(false);
  const commentRefs = useRef({});

  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];
  const allowedExtensionsMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
  };

  // --- File Handling for NEW Comments ---
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (allowedMimeTypes.includes(file.type)) return true;
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (
        allowedExtensionsMap[fileExtension] &&
        allowedMimeTypes.includes(allowedExtensionsMap[fileExtension])
      )
        return true;
      toast.error(
        `File type of ${file.name} (${file.type || "unknown"}) is not allowed.`
      );
      return false;
    });
    setAttachments((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `new-main-${Date.now()}-${file.name}`,
      })),
    ]);
    e.target.value = "";
  };

  const removeAttachment = (tempId) => {
    setAttachments((prev) => {
      const attachmentToRemove = prev.find((att) => att.id === tempId);
      if (attachmentToRemove?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(attachmentToRemove.preview);
      }
      return prev.filter((att) => att.id !== tempId);
    });
  };

  useEffect(() => {
    // Cleanup for NEW comment attachments
    return () =>
      attachments.forEach((attachment) => {
        if (attachment.preview?.startsWith("blob:"))
          URL.revokeObjectURL(attachment.preview);
      });
  }, [attachments]);

  // --- File Handling for EDITING Comments ---
  const handleFileSelectForEdit = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB).`);
        return false;
      }
      if (allowedMimeTypes.includes(file.type)) return true;
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (
        allowedExtensionsMap[fileExtension] &&
        allowedMimeTypes.includes(allowedExtensionsMap[fileExtension])
      )
        return true;
      toast.error(
        `File type of ${file.name} (${file.type || "unknown"}) is not allowed.`
      );
      return false;
    });

    setNewAttachmentsForEdit((prev) => [
      ...prev,
      ...validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        id: `new-edit-${Date.now()}-${file.name}`,
      })),
    ]);
    e.target.value = null;
  };

  const removeNewAttachmentForEdit = (tempId) => {
    setNewAttachmentsForEdit((prev) => {
      const attachmentToRemove = prev.find((att) => att.id === tempId);
      if (attachmentToRemove?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(attachmentToRemove.preview);
      }
      return prev.filter((att) => att.id !== tempId);
    });
  };

  const markExistingAttachmentForDeletionInEdit = (attachmentId) => {
    setAttachmentIdsToDeleteInEdit((prev) => {
      if (prev.includes(attachmentId)) {
        return prev.filter((id) => id !== attachmentId);
      } else {
        return [...prev, attachmentId];
      }
    });
  };

  useEffect(() => {
    // Cleanup for new attachments selected during EDIT mode
    return () =>
      newAttachmentsForEdit.forEach((attachmentObj) => {
        if (attachmentObj.preview?.startsWith("blob:"))
          URL.revokeObjectURL(attachmentObj.preview);
      });
  }, [newAttachmentsForEdit]);

  // --- Utility Functions ---
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const getFileIcon = (mimeType, isSmall = false) => {
    const iconSizeClass = isSmall ? "w-4 h-4" : "w-5 h-5";
    if (mimeType?.startsWith("image/"))
      return (
        <svg
          className={`${iconSizeClass} text-green-500`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      );
    if (mimeType === "application/pdf")
      return (
        <svg
          className={`${iconSizeClass} text-red-500`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
      );
    return (
      <svg
        className={`${iconSizeClass} text-blue-500`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  // --- Submit Handlers ---
  const handleSubmitNewComment = async (e) => {
    e.preventDefault();
    if ((!newComment || !newComment.trim()) && attachments.length === 0) {
      toast.error("Please add a comment or attachment.");
      return;
    }
    if (!taskId) {
      toast.error("Task ID is missing.");
      return;
    }
    const numericTaskId = parseInt(taskId, 10);
    if (isNaN(numericTaskId)) {
      toast.error("Invalid Task ID format.");
      return;
    }
    let payload,
      isFormData = false;
    if (attachments.length > 0) {
      isFormData = true;
      payload = new FormData();
      payload.append("task_id", numericTaskId.toString());
      payload.append("comment_message", newComment || "");
      attachments.forEach((attachmentObj) =>
        payload.append(
          "attachments[]",
          attachmentObj.file,
          attachmentObj.file.name
        )
      );
    } else {
      payload = { task_id: numericTaskId, comment_message: newComment || "" };
    }
    const success = await handleCommentSubmit(payload, isFormData);
    if (success) {
      setAttachments([]);
      setNewComment("");
    }
  };

  const handleSaveEdit = async (commentId) => {
    setIsProcessingEditOrDelete(true);

    const finalKeptExistingAttachmentsCount = currentEditingAttachments.filter(
      (att) => !attachmentIdsToDeleteInEdit.includes(att.id)
    ).length;

    if (
      (!editedCommentText || !editedCommentText.trim()) &&
      finalKeptExistingAttachmentsCount === 0 &&
      newAttachmentsForEdit.length === 0
    ) {
      toast.error("Comment cannot be empty if there are no attachments.");
      setIsProcessingEditOrDelete(false);
      return;
    }

    const formData = new FormData();
    formData.append("_method", "PUT");

    let messageToAppend = "";
    if (typeof editedCommentText === "string") {
      messageToAppend = editedCommentText;
    }
    // This console.log is crucial for debugging the "must be a string" error
    console.log(
      "CLIENT: Appending to FormData for edit - comment_message:",
      JSON.stringify(messageToAppend),
      "(Type:",
      typeof messageToAppend,
      ")"
    );
    formData.append("comment_message", messageToAppend);

    if (attachmentIdsToDeleteInEdit.length > 0) {
      attachmentIdsToDeleteInEdit.forEach((id) =>
        formData.append("delete_attachments[]", id.toString())
      );
    }

    if (newAttachmentsForEdit.length > 0) {
      newAttachmentsForEdit.forEach((attachmentObj) => {
        formData.append(
          "new_attachments[]",
          attachmentObj.file,
          attachmentObj.file.name
        );
      });
    }

    // For debugging: Log all FormData entries
    // console.log("CLIENT: FormData entries before sending:");
    // for (let pair of formData.entries()) {
    //    console.log(pair[0]+ ': '+ (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
    // }

    const success = await onEditComment(commentId, formData);

    setIsProcessingEditOrDelete(false);
    if (success) {
      handleCancelEdit();
      toast.success("Comment updated successfully!");
    }
  };

  // --- Context Menu and Edit/Delete Action Handlers ---
  const handleContextMenu = (event, commentId) => {
    event.preventDefault();
    const menuWidth = 128,
      menuHeight = 80,
      buffer = 10;
    let top = event.clientY,
      left = event.clientX;
    if (top + menuHeight + buffer > window.innerHeight)
      top = window.innerHeight - menuHeight - buffer;
    if (left + menuWidth + buffer > window.innerWidth)
      left = window.innerWidth - menuWidth - buffer;
    if (top < buffer) top = buffer;
    if (left < buffer) left = buffer;
    setDropdownPosition({ top, left });
    setActiveDropdownCommentId(commentId);
    setEditingCommentId(null);
  };

  const handleEdit = (comment) => {
    setActiveDropdownCommentId(null);
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.comment_message || "");
    setCurrentEditingAttachments(comment.comment_attachments || []);
    setNewAttachmentsForEdit([]);
    setAttachmentIdsToDeleteInEdit([]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
    setCurrentEditingAttachments([]);
    setNewAttachmentsForEdit([]);
    setAttachmentIdsToDeleteInEdit([]);
  };

  const handleDelete = async (commentId) => {
    setActiveDropdownCommentId(null);
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
      setIsProcessingEditOrDelete(true);
      const deleteSuccess = await onDeleteComment(commentId);
      setIsProcessingEditOrDelete(false);
      if (deleteSuccess)
        Swal.fire("Deleted!", "Your comment has been deleted.", "success");
    }
  };

  const dropdownOptions = (comment) => {
    const canModify = currentUserId && comment.sender?.id === currentUserId;
    return [
      {
        label: "Edit",
        action: "edit",
        disabled: !canModify || isProcessingEditOrDelete || isSubmittingComment,
      },
      {
        label: "Delete",
        action: "delete",
        disabled: !canModify || isProcessingEditOrDelete || isSubmittingComment,
      },
    ];
  };

  // --- JSX ---
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Activity & Comments
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Comments List / Edit UI */}
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ maxHeight: "calc(100vh - 23rem)" }}
      >
        {comments.length > 0 ? (
          comments.map((comment) => {
            const sender = comment.sender
              ? mapApiUserToLocal(comment.sender, "commenter")
              : mapApiUserToLocal(null, "commenter");
            const isEditingThisComment = editingCommentId === comment.id;

            return (
              <div
                key={comment.id}
                className="group relative"
                ref={(el) => (commentRefs.current[comment.id] = el)}
              >
                <div className="flex items-start space-x-3">
                  {sender.profilePic ? (
                    <img
                      src={sender.profilePic}
                      alt={sender.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100"
                    />
                  ) : (
                    <span
                      className={`w-9 h-9 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100`}
                    >
                      {sender.avatar}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    {isEditingThisComment ? (
                      // --- EDITING UI ---
                      <div className="bg-slate-100 rounded-xl p-4 border border-blue-300 shadow-md">
                        <textarea
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                          className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mb-3"
                          rows={3}
                          autoFocus
                          placeholder="Edit your comment..."
                          disabled={isProcessingEditOrDelete}
                        />

                        {currentEditingAttachments.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-slate-600 mb-1.5">
                              Current attachments:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {currentEditingAttachments.map((att) => {
                                const isMarkedForDelete =
                                  attachmentIdsToDeleteInEdit.includes(att.id);
                                let displayUrl = att.file_path;
                                if (
                                  displayUrl &&
                                  !(
                                    displayUrl.startsWith("http") ||
                                    displayUrl.startsWith("blob")
                                  )
                                ) {
                                  const base = STORAGE_BASE_PATH.endsWith("/")
                                    ? STORAGE_BASE_PATH
                                    : STORAGE_BASE_PATH + "/";
                                  const segment = displayUrl.startsWith("/")
                                    ? displayUrl.substring(1)
                                    : displayUrl;
                                  displayUrl = base + segment;
                                }
                                const isImage =
                                  att.file_type &&
                                  att.file_type.startsWith("image/");
                                const attachmentName =
                                  att.original_name ||
                                  att.name ||
                                  (att.file_path
                                    ? att.file_path.split("/").pop()
                                    : "") ||
                                  `Attachment`;

                                return (
                                  <div
                                    key={`existing-${att.id}`}
                                    className={`relative p-1 border rounded-md group transition-all duration-150 ease-in-out
                                                ${
                                                  isMarkedForDelete
                                                    ? "border-red-400 bg-red-50 opacity-60"
                                                    : "border-slate-300 bg-white"
                                                }`}
                                  >
                                    {isImage && displayUrl ? (
                                      <img
                                        src={displayUrl}
                                        alt={attachmentName}
                                        className="w-14 h-14 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 flex flex-col items-center justify-center bg-slate-200 rounded text-slate-600 p-1 text-center">
                                        {getFileIcon(att.file_type, true)}
                                        <span
                                          className="text-[10px] leading-tight truncate w-full mt-0.5"
                                          title={attachmentName}
                                        >
                                          {attachmentName}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        markExistingAttachmentForDeletionInEdit(
                                          att.id
                                        )
                                      }
                                      className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md
                                                  ${
                                                    isMarkedForDelete
                                                      ? "bg-green-500 hover:bg-green-600"
                                                      : "bg-red-500 hover:bg-red-600"
                                                  } 
                                                  opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
                                      title={
                                        isMarkedForDelete
                                          ? "Keep"
                                          : "Mark for deletion"
                                      }
                                      disabled={isProcessingEditOrDelete}
                                    >
                                      {isMarkedForDelete ? "↩" : "×"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {newAttachmentsForEdit.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-slate-600 mb-1.5">
                              New files to add:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {newAttachmentsForEdit.map((attObj) => (
                                <div
                                  key={attObj.id}
                                  className="relative p-1 border border-blue-300 bg-blue-50 rounded-md group"
                                >
                                  {attObj.file.type.startsWith("image/") &&
                                  attObj.preview ? (
                                    <img
                                      src={attObj.preview}
                                      alt={attObj.file.name}
                                      className="w-14 h-14 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 flex flex-col items-center justify-center bg-slate-200 rounded text-slate-600 p-1 text-center">
                                      {getFileIcon(attObj.file.type, true)}
                                      <span
                                        className="text-[10px] leading-tight truncate w-full mt-0.5"
                                        title={attObj.file.name}
                                      >
                                        {attObj.file.name}
                                      </span>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeNewAttachmentForEdit(attObj.id)
                                    }
                                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                    title="Don't add this file"
                                    disabled={isProcessingEditOrDelete}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mb-4">
                          <label
                            className={`inline-flex items-center px-3 py-1.5 border border-dashed border-slate-400 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm text-slate-600 ${
                              isProcessingEditOrDelete
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                              />
                            </svg>
                            Add Files
                            <input
                              type="file"
                              multiple
                              onChange={handleFileSelectForEdit}
                              className="hidden"
                              disabled={isProcessingEditOrDelete}
                              accept={
                                Object.keys(allowedExtensionsMap)
                                  .map((ext) => `.${ext}`)
                                  .join(",") +
                                "," +
                                allowedMimeTypes.join(",")
                              }
                            />
                          </label>
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            disabled={isProcessingEditOrDelete}
                            className="px-3 py-1.5 text-sm text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={isProcessingEditOrDelete}
                            className="px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-slate-300"
                          >
                            {isProcessingEditOrDelete
                              ? "Saving..."
                              : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // --- DISPLAY MODE ---
                      <div
                        className="bg-slate-50 rounded-xl rounded-tl-sm p-3.5 group-hover:bg-slate-100 transition-colors cursor-context-menu"
                        onContextMenu={(e) => handleContextMenu(e, comment.id)}
                      >
                        <p className="text-sm font-semibold text-slate-800 mb-1">
                          {sender.name}
                        </p>
                        {comment.comment_message ||
                        (comment.comment_attachments &&
                          comment.comment_attachments.length > 0) ? (
                          <>
                            {comment.comment_message && (
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">
                                {comment.comment_message}
                              </p>
                            )}
                            {comment.comment_attachments &&
                              comment.comment_attachments.length > 0 && (
                                <div
                                  className={`pt-2 ${
                                    comment.comment_message
                                      ? "border-t border-slate-200"
                                      : ""
                                  } flex flex-wrap gap-2`}
                                >
                                  {comment.comment_attachments.map(
                                    (file, index) => {
                                      const isImage =
                                        file.file_type &&
                                        file.file_type.startsWith("image/");
                                      let rawPath = file.file_path;
                                      let attachmentUrl;
                                      if (
                                        rawPath &&
                                        (rawPath.startsWith("http") ||
                                          rawPath.startsWith("blob"))
                                      ) {
                                        attachmentUrl = rawPath;
                                      } else if (rawPath) {
                                        const base = STORAGE_BASE_PATH.endsWith(
                                          "/"
                                        )
                                          ? STORAGE_BASE_PATH
                                          : STORAGE_BASE_PATH + "/";
                                        const segment = rawPath.startsWith("/")
                                          ? rawPath.substring(1)
                                          : rawPath;
                                        attachmentUrl = base + segment;
                                      } else {
                                        attachmentUrl = "";
                                      }
                                      const attachmentName =
                                        file.original_name ||
                                        file.name ||
                                        (rawPath
                                          ? rawPath.split("/").pop()
                                          : "") ||
                                        `Attachment ${index + 1}`;
                                      return (
                                        <div
                                          key={`display-${file.id || index}`}
                                          className={`${
                                            isImage
                                              ? "inline-block align-top"
                                              : "block w-full p-2.5 bg-white rounded-lg border"
                                          } border-slate-200 hover:shadow-sm transition-shadow`}
                                        >
                                          {isImage && attachmentUrl ? (
                                            <a
                                              href={attachmentUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block"
                                              title={`View ${attachmentName}`}
                                            >
                                              <img
                                                src={attachmentUrl}
                                                alt={attachmentName}
                                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-slate-200 shadow-sm bg-slate-100"
                                              />
                                            </a>
                                          ) : (
                                            <div className="flex items-center space-x-3">
                                              <div className="flex-shrink-0 p-2 bg-slate-100 rounded-md">
                                                {getFileIcon(
                                                  file.file_type || file.type,
                                                  false
                                                )}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <p
                                                  className="text-sm font-medium text-slate-800 truncate"
                                                  title={attachmentName}
                                                >
                                                  {attachmentName}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                  {file.file_size
                                                    ? formatFileSize(
                                                        file.file_size
                                                      )
                                                    : "Unknown size"}
                                                </p>
                                              </div>
                                              {attachmentUrl && (
                                                <a
                                                  href={attachmentUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-shrink-0 ml-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                                                >
                                                  View
                                                </a>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                          </>
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            No message or attachments.
                          </p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5 ml-3">
                      {formatCommentTimestamp(comment.created_at)}
                    </p>
                  </div>
                </div>
                {activeDropdownCommentId === comment.id && (
                  <div
                    style={{
                      position: "fixed",
                      top: dropdownPosition.top,
                      left: dropdownPosition.left,
                      zIndex: 100,
                    }}
                  >
                    <DropdownMenu
                      options={dropdownOptions(comment)}
                      onSelect={(action) => {
                        if (action === "edit") handleEdit(comment);
                        if (action === "delete") handleDelete(comment.id);
                      }}
                      onClose={() => setActiveDropdownCommentId(null)}
                    />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            {" "}
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>{" "}
            <p className="text-sm text-slate-500">No comments yet</p>{" "}
            <p className="text-xs text-slate-400 mt-1">
              {" "}
              Start the conversation below{" "}
            </p>{" "}
          </div>
        )}
      </div>

      {/* New Comment Form */}
      <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
        <form onSubmit={handleSubmitNewComment} className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            rows={3}
            disabled={isSubmittingComment || isProcessingEditOrDelete}
          />
          {attachments.length > 0 && (
            <div className="space-y-2 p-2 bg-slate-100 rounded-md">
              {" "}
              <p className="text-xs font-medium text-slate-600">
                {" "}
                Files to upload:{" "}
              </p>{" "}
              {attachments.map((attachmentObj) => (
                <div
                  key={attachmentObj.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                >
                  {" "}
                  <div className="flex items-center space-x-2 min-w-0">
                    {" "}
                    {attachmentObj.file.type.startsWith("image/") &&
                    attachmentObj.preview ? (
                      <img
                        src={attachmentObj.preview}
                        alt={attachmentObj.file.name}
                        className="w-8 h-8 object-cover rounded border border-slate-200"
                      />
                    ) : (
                      <div className="flex-shrink-0 p-1 bg-slate-100 rounded">
                        {getFileIcon(attachmentObj.file.type, true)}
                      </div>
                    )}{" "}
                    <div className="flex-1 min-w-0">
                      {" "}
                      <p
                        className="text-xs font-medium text-slate-900 truncate"
                        title={attachmentObj.file.name}
                      >
                        {attachmentObj.file.name}
                      </p>{" "}
                      <p className="text-xs text-slate-500">
                        {formatFileSize(attachmentObj.file.size)}
                      </p>{" "}
                    </div>{" "}
                  </div>{" "}
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachmentObj.id)}
                    className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                    disabled={isSubmittingComment || isProcessingEditOrDelete}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>{" "}
                </div>
              ))}{" "}
            </div>
          )}
          <div className="space-y-3">
            {" "}
            <div className="flex items-center space-x-2">
              {" "}
              <label
                className={`flex items-center justify-center px-3 py-2 border border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm ${
                  !taskId || isSubmittingComment || isProcessingEditOrDelete
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {" "}
                <svg
                  className="w-4 h-4 text-slate-500 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>{" "}
                <span className="text-slate-600">Attach files</span>{" "}
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={
                    isSubmittingComment || isProcessingEditOrDelete || !taskId
                  }
                  accept={
                    Object.keys(allowedExtensionsMap)
                      .map((ext) => `.${ext}`)
                      .join(",") +
                    "," +
                    allowedMimeTypes.join(",")
                  }
                />{" "}
              </label>{" "}
              <span className="text-xs text-slate-400">Max 10MB per file</span>{" "}
            </div>{" "}
          </div>
          {commentError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md">
              {commentError}
            </div>
          )}
          <div className="flex justify-between items-center">
            {" "}
            <span className="text-xs text-slate-500">
              {" "}
              {newComment.length > 5000 ? (
                <span className="text-red-500">{newComment.length}/5000</span>
              ) : (
                `${newComment.length}/5000`
              )}{" "}
              {attachments.length > 0 && (
                <span className="ml-2 text-blue-600">
                  • {attachments.length} file
                  {attachments.length !== 1 ? "s" : ""} attached
                </span>
              )}{" "}
            </span>{" "}
            <button
              type="submit"
              disabled={
                ((!newComment || !newComment.trim()) &&
                  attachments.length === 0) ||
                isSubmittingComment ||
                isProcessingEditOrDelete ||
                newComment.length > 5000 ||
                !taskId
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-1.5"
            >
              {" "}
              {isSubmittingComment ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>
                    {attachments.length > 0 ? "Post with files" : "Post"}
                  </span>
                </>
              )}{" "}
            </button>{" "}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentList;
