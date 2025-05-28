import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils"; // Assuming utils file

// A simple dropdown component
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
              onSelect(option.action); /* onClose(); // Decide when to close */
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
  handleCommentSubmit,
  isSubmittingComment,
  commentError,
  taskId,
  onEditComment,
  onDeleteComment,
  currentUserId,
}) => {
  const [attachments, setAttachments] = useState([]);
  const [activeDropdownCommentId, setActiveDropdownCommentId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [isProcessingEditOrDelete, setIsProcessingEditOrDelete] =
    useState(false);
  const commentRefs = useRef({});
 console.log(comments, "comments Hello");
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
      })),
    ]);
    e.target.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const newAttachments = prev.filter((_, i) => i !== index);
      if (
        prev[index] &&
        prev[index].preview &&
        prev[index].preview.startsWith("blob:")
      ) {
        URL.revokeObjectURL(prev[index].preview);
      }
      return newAttachments;
    });
  };

  useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.preview && attachment.preview.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, [attachments]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
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

  const handleSubmitNewComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) {
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

    let payload;
    let isFormData = false;
    if (attachments.length > 0) {
      isFormData = true;
      payload = new FormData();
      payload.append("task_id", numericTaskId.toString());
      payload.append("comment_message", newComment);
      attachments.forEach((attachmentObj) =>
        payload.append(
          "attachments[]",
          attachmentObj.file,
          attachmentObj.file.name
        )
      );
    } else {
      payload = { task_id: numericTaskId, comment_message: newComment };
    }
    const success = await handleCommentSubmit(payload, isFormData);
    if (success) {
      attachments.forEach((attachment) => {
        if (attachment.preview && attachment.preview.startsWith("blob:")) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      setAttachments([]);
    }
  };

  const handleContextMenu = (event, commentId) => {
    event.preventDefault();
    const menuWidth = 128;
    const menuHeight = 80;
    const buffer = 10;
    let top = event.clientY;
    let left = event.clientX;
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
    setEditedCommentText(comment.comment_message);
  };
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedCommentText("");
  };
  const handleSaveEdit = async (commentId) => {
    if (!editedCommentText.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }
    setIsProcessingEditOrDelete(true);
    const success = await onEditComment(commentId, editedCommentText);
    setIsProcessingEditOrDelete(false);
    if (success) {
      setEditingCommentId(null);
      setEditedCommentText("");
    }
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
    const canModify =
      currentUserId && comment.sender && comment.sender.id === currentUserId;
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
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
                      <div className="bg-slate-50 rounded-xl p-3.5">
                        <textarea
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          autoFocus
                          disabled={isProcessingEditOrDelete}
                        />
                        <div className="mt-2 flex items-center justify-end space-x-2">
                          <button
                            onClick={handleCancelEdit}
                            disabled={isProcessingEditOrDelete}
                            className="px-3 py-1 text-sm text-slate-600 hover:bg-slate-200 rounded-md disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={
                              isProcessingEditOrDelete ||
                              !editedCommentText.trim()
                            }
                            className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:bg-slate-300"
                          >
                            {isProcessingEditOrDelete ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="bg-slate-50 rounded-xl rounded-tl-sm p-3.5 group-hover:bg-slate-100 transition-colors cursor-context-menu"
                        onContextMenu={(e) => handleContextMenu(e, comment.id)}
                      >
                        <p className="text-sm font-semibold text-slate-800 mb-1">
                          {sender.name}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {comment.comment_message}
                        </p>

                        {/* MODIFIED: DISPLAY SAVED ATTACHMENTS HERE */}
                        {comment.attachments &&
                          comment.attachments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                              {comment.attachments.map((file, index) => {
                                const isImage =
                                  file.mime_type &&
                                  file.mime_type.startsWith("image/");
                                const attachmentUrl =
                                  file.url || file.download_url;
                                const attachmentName =
                                  file.original_name ||
                                  file.name ||
                                  `Attachment ${index + 1}`;

                                return (
                                  <div
                                    key={file.id || `saved-file-${index}`}
                                    className="p-2.5 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow"
                                  >
                                    {isImage && attachmentUrl ? (
                                      // IMAGE ATTACHMENT
                                      <div>
                                        <a
                                          href={attachmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block mb-1.5"
                                          title={`View ${attachmentName}`}
                                        >
                                          <img
                                            src={attachmentUrl}
                                            alt={attachmentName}
                                            className="max-w-full h-auto max-h-48 object-contain rounded border border-slate-300 shadow-sm bg-slate-50" // Added bg-slate-50 for placeholder during load
                                          />
                                        </a>
                                        <div className="flex items-center justify-between text-xs">
                                          <span
                                            className="text-slate-700 font-medium truncate pr-2"
                                            title={attachmentName}
                                          >
                                            {attachmentName}
                                          </span>
                                          <span className="text-slate-500 flex-shrink-0">
                                            {file.size
                                              ? formatFileSize(file.size)
                                              : "Unknown size"}
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      // NON-IMAGE ATTACHMENT
                                      <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0 p-2 bg-slate-100 rounded-md">
                                          {getFileIcon(
                                            file.mime_type || file.type,
                                            false // Use slightly larger icon
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
                                            {file.size
                                              ? formatFileSize(file.size)
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
                                            View Attachment
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
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
            </div>
            <p className="text-sm text-slate-500">No comments yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Start the conversation below
            </p>
          </div>
        )}
      </div>

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
              <p className="text-xs font-medium text-slate-600">
                Files to upload:
              </p>
              {attachments.map((attachmentObj, index) => (
                <div
                  key={`preview-${index}-${attachmentObj.file.name}`}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-2 min-w-0">
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
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium text-slate-900 truncate"
                        title={attachmentObj.file.name}
                      >
                        {attachmentObj.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(attachmentObj.file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
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
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <label
                className={`flex items-center justify-center px-3 py-2 border border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm ${
                  !taskId || isSubmittingComment || isProcessingEditOrDelete
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
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
                </svg>
                <span className="text-slate-600">Attach files</span>
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
                />
              </label>
              <span className="text-xs text-slate-400">Max 10MB per file</span>
            </div>
          </div>

          {commentError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md">
              {commentError}
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {newComment.length > 5000 ? (
                <span className="text-red-500">{newComment.length}/5000</span>
              ) : (
                `${newComment.length}/5000`
              )}
              {attachments.length > 0 && (
                <span className="ml-2 text-blue-600">
                  • {attachments.length} file
                  {attachments.length !== 1 ? "s" : ""} attached
                </span>
              )}
            </span>
            <button
              type="submit"
              disabled={
                (!newComment.trim() && attachments.length === 0) ||
                isSubmittingComment ||
                isProcessingEditOrDelete ||
                newComment.length > 5000 ||
                !taskId
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-1.5"
            >
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
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentList;
