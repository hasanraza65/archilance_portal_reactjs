import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

const STORAGE_BASE_PATH = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const isAudio = (attachment) => {
  const mime = attachment.file_type || "";
  if (mime) {
    return mime.startsWith("audio/");
  }
  // Use 'name' which is derived from file_name from API
  const name = attachment.name || "";
  if (name) {
    const extension = name.split(".").pop().toLowerCase();
    return ["mp3", "wav", "ogg", "webm", "m4a", "aac"].includes(extension);
  }
  return false;
};

const AudioPlayer = ({ src }) => {
  if (!src) return null;
  return (
    <div className="w-full my-1">
      <audio controls className="w-full h-10">
        <source src={src} type="audio/webm" />
        <source src={src} type="audio/mp3" />
        <source src={src} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};

const formatRecordingTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

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

const buildCommentTree = (commentsList) => {
  if (!commentsList || commentsList.length === 0) return [];

  const validComments = commentsList.filter(
    (c) => c && typeof c === "object" && c.id !== undefined
  );

  const commentsMap = new Map();
  validComments.forEach((comment) => {
    commentsMap.set(comment.id, { ...comment, children: [] });
  });

  const rootComments = [];
  for (const comment of commentsMap.values()) {
    if (comment.reply_to && commentsMap.has(comment.reply_to)) {
      const parent = commentsMap.get(comment.reply_to);
      if (parent) {
        parent.children.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  }

  const sortComments = (arr) =>
    arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  for (const node of commentsMap.values()) {
    if (node.children.length > 0) {
      sortComments(node.children);
    }
  }

  return sortComments(rootComments);
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
  onLoadOlderComments,
  isLoadingOlderComments,
  allCommentsLoaded,
  totalCommentsFromApi,
  onLoadRepliesForComment,
}) => {
  const [attachments, setAttachments] = useState([]);
  const [activeDropdownCommentId, setActiveDropdownCommentId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [currentEditingAttachments, setCurrentEditingAttachments] = useState(
    []
  );
  const [newAttachmentsForEdit, setNewAttachmentsForEdit] = useState([]);
  const [attachmentIdsToDeleteInEdit, setAttachmentIdsToDeleteInEdit] =
    useState([]);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [isProcessingEditOrDelete, setIsProcessingEditOrDelete] =
    useState(false);
  const [loadingRepliesForCommentId, setLoadingRepliesForCommentId] =
    useState(null);
  const [hiddenRepliesParentIds, setHiddenRepliesParentIds] = useState([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);

  const commentRefs = useRef({});
  const newCommentFormRef = useRef(null);
  const commentsListRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const textareaRef = useRef(null);

  const prevCommentsLength = useRef(comments ? comments.length : 0);
  const initialLoadScrollAttempted = useRef(false);
  const prevScrollHeight = useRef(0);

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
    "audio/webm",
    "audio/mp3",
    "audio/wav",
    "audio/ogg",
    "audio/aac",
    "audio/m4a",
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
    webm: "audio/webm",
    mp3: "audio/mp3",
    wav: "audio/wav",
    ogg: "audio/ogg",
    aac: "audio/aac",
    m4a: "audio/m4a",
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newComment]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Max 10MB.`);
        return false;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      const mime = file.type || allowedExtensionsMap[ext];
      if (allowedMimeTypes.includes(mime)) return true;
      toast.error(
        `File type of ${file.name} (${mime || "unknown"}) not allowed.`
      );
      return false;
    });
    setAttachments((prev) => [
      ...prev,
      ...validFiles.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        id: `new-main-${Date.now()}-${f.name}`,
      })),
    ]);
    e.target.value = "";
  };

  const removeAttachment = (tempId) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === tempId);
      if (att?.preview?.startsWith("blob:")) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== tempId);
    });
  };

  useEffect(() => {
    const currentAtts = attachments;
    return () =>
      currentAtts.forEach((att) => {
        if (att.preview?.startsWith("blob:")) URL.revokeObjectURL(att.preview);
      });
  }, [attachments]);

  const resetRecordingState = () => {
    if (recordingIntervalRef.current)
      clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    mediaRecorderRef.current = null;
    recordingIntervalRef.current = null;
    audioChunksRef.current = [];
  };

  const handleStartRecording = async () => {
    if (isSubmittingComment || isProcessingEditOrDelete) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) =>
        audioChunksRef.current.push(event.data);

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (audioChunksRef.current.length === 0) return;

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioFile = new File(
          [audioBlob],
          `voice-comment-${Date.now()}.webm`,
          { type: "audio/webm" }
        );

        const payload = new FormData();
        payload.append("task_id", taskId.toString());
        payload.append("comment_message", "");
        if (replyingToComment)
          payload.append("reply_to", replyingToComment.id.toString());
        payload.append("attachments[]", audioFile, audioFile.name);

        const success = await handleCommentSubmit(payload, true);
        if (success) {
          handleCancelReply();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const handleStopAndSend = () => {
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === "recording" ||
        mediaRecorderRef.current.state === "paused")
    ) {
      mediaRecorderRef.current.stop();
    }
    resetRecordingState();
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    resetRecordingState();
  };

  const handleTogglePauseResume = () => {
    if (isPaused) {
      mediaRecorderRef.current.resume();
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      clearInterval(recordingIntervalRef.current);
    }
    setIsPaused(!isPaused);
  };

  const handleFileSelectForEdit = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large (max 10MB).`);
        return false;
      }
      const ext = file.name.split(".").pop().toLowerCase();
      const mime = file.type || allowedExtensionsMap[ext];
      if (allowedMimeTypes.includes(mime)) return true;
      toast.error(
        `File type of ${file.name} (${mime || "unknown"}) not allowed.`
      );
      return false;
    });
    setNewAttachmentsForEdit((prev) => [
      ...prev,
      ...validFiles.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        id: `new-edit-${Date.now()}-${f.name}`,
      })),
    ]);
    e.target.value = null;
  };

  const removeNewAttachmentForEdit = (tempId) => {
    setNewAttachmentsForEdit((prev) => {
      const att = prev.find((a) => a.id === tempId);
      if (att?.preview?.startsWith("blob:")) URL.revokeObjectURL(att.preview);
      return prev.filter((a) => a.id !== tempId);
    });
  };

  const markExistingAttachmentForDeletionInEdit = (dbId) =>
    setAttachmentIdsToDeleteInEdit((prev) =>
      prev.includes(dbId) ? prev.filter((id) => id !== dbId) : [...prev, dbId]
    );

  useEffect(() => {
    const currentNewAtts = newAttachmentsForEdit;
    return () =>
      currentNewAtts.forEach((att) => {
        if (att.preview?.startsWith("blob:")) URL.revokeObjectURL(att.preview);
      });
  }, [newAttachmentsForEdit]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024,
      sizes = ["Bytes", "KB", "MB", "GB"],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (mimeTypeParam, isSmall = false) => {
    const c = isSmall ? "w-4 h-4" : "w-5 h-5";
    let mt = mimeTypeParam;
    if (mt && !mt.includes("/") && allowedExtensionsMap[mt.toLowerCase()])
      mt = allowedExtensionsMap[mt.toLowerCase()];
    if (mt?.startsWith("audio/"))
      return (
        <svg
          className={`${c} text-purple-500`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M18 3a1 1 0 00-1.447-.894L4 6.424V2.5a1 1 0 00-2 0v15a1 1 0 002 0V13.576l12.553 4.37A1 1 0 0018 17V3z"></path>
        </svg>
      );
    if (mt?.startsWith("image/"))
      return (
        <svg
          className={`${c} text-green-500`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {" "}
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />{" "}
        </svg>
      );
    if (mt === "application/pdf")
      return (
        <svg
          className={`${c} text-red-500`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {" "}
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />{" "}
        </svg>
      );
    return (
      <svg
        className={`${c} text-blue-500`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        {" "}
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
          clipRule="evenodd"
        />{" "}
      </svg>
    );
  };

  const handleStartReply = (commentToReplyTo) => {
    const sender = commentToReplyTo.sender
      ? mapApiUserToLocal(commentToReplyTo.sender)
      : mapApiUserToLocal(null);
    let snippet;
    const numAtt = (commentToReplyTo.comment_attachments || []).length;
    if (commentToReplyTo.comment_message)
      snippet =
        commentToReplyTo.comment_message.length > 70
          ? `${commentToReplyTo.comment_message.substring(0, 67)}...`
          : commentToReplyTo.comment_message;
    else if (numAtt > 0)
      snippet = `${numAtt} attachment${numAtt > 1 ? "s" : ""}`;
    else snippet = "Original comment";
    setReplyingToComment({
      id: commentToReplyTo.id,
      senderName: sender.name,
      messageSnippet: snippet,
    });
    setEditingCommentId(null);
    if (textareaRef.current) textareaRef.current.focus();
  };
  const handleCancelReply = () => setReplyingToComment(null);

  const handleSubmitNewCommentForm = async (e) => {
    e.preventDefault();
    if ((!newComment || !newComment.trim()) && attachments.length === 0) {
      toast.error("Please add a comment or attachment.");
      return;
    }
    if (!taskId) {
      toast.error("Task ID is missing.");
      return;
    }
    const numTaskId = parseInt(taskId, 10);
    if (isNaN(numTaskId)) {
      toast.error("Invalid Task ID format.");
      return;
    }
    if (isSubmittingComment || isProcessingEditOrDelete) return;

    let payload,
      isFormData = false;
    if (attachments.length > 0) {
      isFormData = true;
      payload = new FormData();
      payload.append("task_id", numTaskId.toString());
      payload.append("comment_message", newComment || "");
      if (replyingToComment)
        payload.append("reply_to", replyingToComment.id.toString());
      attachments.forEach((att) =>
        payload.append("attachments[]", att.file, att.file.name)
      );
    } else {
      payload = { task_id: numTaskId, comment_message: newComment || "" };
      if (replyingToComment) payload.reply_to = replyingToComment.id;
    }
    const success = await handleCommentSubmit(payload, isFormData);
    if (success) {
      setAttachments([]);
      setNewComment("");
      handleCancelReply();
    }
  };

  const handleSaveEdit = async (commentId) => {
    setIsProcessingEditOrDelete(true);
    const keptAttCount = currentEditingAttachments.filter(
      (att) => !attachmentIdsToDeleteInEdit.includes(att.id)
    ).length;
    if (
      (!editedCommentText || !editedCommentText.trim()) &&
      keptAttCount === 0 &&
      newAttachmentsForEdit.length === 0
    ) {
      toast.error("Comment cannot be empty if there are no attachments.");
      setIsProcessingEditOrDelete(false);
      return;
    }
    const formData = new FormData();
    formData.append("_method", "PUT");
    formData.append("comment_message", (editedCommentText || "").trim());
    if (attachmentIdsToDeleteInEdit.length > 0)
      attachmentIdsToDeleteInEdit.forEach((id) =>
        formData.append("delete_attachments[]", id.toString())
      );
    if (newAttachmentsForEdit.length > 0)
      newAttachmentsForEdit.forEach((att) =>
        formData.append("attachments[]", att.file, att.file.name)
      );

    const success = await onEditComment(commentId, formData);
    setIsProcessingEditOrDelete(false);
    if (success) handleCancelEdit();
  };

  const handleContextMenu = (event, commentId) => {
    event.preventDefault();
    const menuW = 128,
      menuH = 80,
      buf = 10;
    let top = event.clientY,
      left = event.clientX;
    if (top + menuH + buf > window.innerHeight)
      top = window.innerHeight - menuH - buf;
    if (left + menuW + buf > window.innerWidth)
      left = window.innerWidth - menuW - buf;
    if (top < buf) top = buf;
    if (left < buf) left = buf;
    setDropdownPosition({ top, left });
    setActiveDropdownCommentId(commentId);
    setEditingCommentId(null);
    setReplyingToComment(null);
  };

  const handleEdit = (comment) => {
    setActiveDropdownCommentId(null);
    setEditingCommentId(comment.id);
    setEditedCommentText(comment.comment_message || "");
    let attSetup = [];
    if (comment.comment_attachments?.length > 0) {
      attSetup = comment.comment_attachments
        .map((att, idx) => {
          if (!att) return null;
          const fp = att.file_path;
          const fn =
            att.file_name || // UPDATED: Use file_name from API
            (fp
              ? fp.substring(fp.lastIndexOf("/") + 1)
              : `att_edit_${idx + 1}`);
          let ft = att.file_type || "application/octet-stream";
          const ext = fn.substring(fn.lastIndexOf(".") + 1).toLowerCase();
          if (
            !att.file_type ||
            ft === "application/octet-stream" ||
            !ft.includes("/")
          ) {
            if (allowedExtensionsMap[ext]) ft = allowedExtensionsMap[ext];
            else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
              ft = `image/${ext === "jpg" ? "jpeg" : ext}`;
            else if (ext === "pdf") ft = "application/pdf";
          } else ft = att.file_type;
          if (typeof att.id === "undefined")
            console.warn("Attachment missing 'id':", att);
          return {
            id: att.id,
            file_path: fp,
            file_name: fn, // UPDATED: Keep consistent
            name: fn,
            file_type: ft,
            file_size: att.file_size || null,
          };
        })
        .filter(Boolean);
    }
    setCurrentEditingAttachments(attSetup);
    setNewAttachmentsForEdit([]);
    setAttachmentIdsToDeleteInEdit([]);
    setReplyingToComment(null);
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
    const res = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (res.isConfirmed) {
      setIsProcessingEditOrDelete(true);
      const ok = await onDeleteComment(commentId);
      setIsProcessingEditOrDelete(false);
      if (ok) toast.success("Comment has been deleted.");
    }
  };

  const dropdownOptions = (cmt) => [
    {
      label: "Edit",
      action: "edit",
      disabled:
        !(currentUserId && cmt.sender?.id === currentUserId) ||
        isProcessingEditOrDelete ||
        isSubmittingComment,
    },
    {
      label: "Delete",
      action: "delete",
      disabled:
        !(currentUserId && cmt.sender?.id === currentUserId) ||
        isProcessingEditOrDelete ||
        isSubmittingComment,
    },
  ];

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  useEffect(() => {
    if (!commentsListRef.current) return;
    const listEl = commentsListRef.current,
      len = comments.length;
    if (
      !initialLoadScrollAttempted.current &&
      len > 0 &&
      listEl.scrollHeight > listEl.clientHeight
    ) {
      listEl.scrollTop = listEl.scrollHeight;
      initialLoadScrollAttempted.current = true;
    } else if (len > prevCommentsLength.current) {
      if (prevCommentsLength.current === 0)
        listEl.scrollTop = listEl.scrollHeight;
      else {
        const olderLoaded =
          comments[0]?.id !== comments[len - prevCommentsLength.current]?.id &&
          prevCommentsLength.current > 0;
        if (olderLoaded) {
          const newH = listEl.scrollHeight,
            diff = newH - prevScrollHeight.current;
          if (diff > 0) listEl.scrollTop += diff;
        } else {
          const nearBottom =
            listEl.scrollHeight - listEl.clientHeight <= listEl.scrollTop + 150;
          if (nearBottom)
            requestAnimationFrame(() => {
              listEl.scrollTop = listEl.scrollHeight;
            });
        }
      }
    }
    prevCommentsLength.current = len;
    prevScrollHeight.current = listEl.scrollHeight;
  }, [comments]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (e) => {
        if (
          e[0].isIntersecting &&
          !isLoadingOlderComments &&
          !allCommentsLoaded &&
          comments.length > 0
        )
          onLoadOlderComments();
      },
      { root: commentsListRef.current, threshold: 0.1 }
    );
    if (loadMoreTriggerRef.current) obs.observe(loadMoreTriggerRef.current);
    return () => {
      if (loadMoreTriggerRef.current) obs.unobserve(loadMoreTriggerRef.current);
    };
  }, [
    isLoadingOlderComments,
    allCommentsLoaded,
    onLoadOlderComments,
    comments.length,
  ]);

  const handleKeyDownOnNewComment = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      newCommentFormRef.current.requestSubmit();
    }
  };

  const handleLoadRepliesClick = async (commentId) => {
    if (loadingRepliesForCommentId || !onLoadRepliesForComment) return;
    if (hiddenRepliesParentIds.includes(commentId)) {
      setHiddenRepliesParentIds((prev) =>
        prev.filter((id) => id !== commentId)
      );
      return;
    }
    setLoadingRepliesForCommentId(commentId);
    try {
      await onLoadRepliesForComment(commentId);
      setHiddenRepliesParentIds((prev) =>
        prev.filter((id) => id !== commentId)
      );
    } catch (error) {
      console.error(`Err loading replies for ${commentId}:`, error);
      toast.error("Failed to load replies.");
    } finally {
      setLoadingRepliesForCommentId(null);
    }
  };

  const toggleRepliesVisibility = (parentId) =>
    setHiddenRepliesParentIds((prev) =>
      prev.includes(parentId)
        ? prev.filter((id) => id !== parentId)
        : [...prev, parentId]
    );

  const RenderCommentNode = ({ commentNode, level }) => {
    const sender = commentNode.sender
      ? mapApiUserToLocal(commentNode.sender)
      : mapApiUserToLocal(null);
    const isEditingThis = editingCommentId === commentNode.id;
    const attToDisp = useMemo(() => {
      if (!commentNode.comment_attachments?.length) return [];
      return commentNode.comment_attachments
        .map((att, idx) => {
          if (!att) return null;
          const fp = att.file_path;
          const fn =
            att.file_name || // UPDATED: Use file_name from API
            (fp
              ? fp.substring(fp.lastIndexOf("/") + 1)
              : `att_${commentNode.id}_${idx + 1}`);
          let ft = att.file_type || "application/octet-stream";
          const ext = fn.substring(fn.lastIndexOf(".") + 1).toLowerCase();
          if (
            !att.file_type ||
            ft === "application/octet-stream" ||
            !ft.includes("/")
          ) {
            if (allowedExtensionsMap[ext]) ft = allowedExtensionsMap[ext];
            else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
              ft = `image/${ext === "jpg" ? "jpeg" : ext}`;
            else if (ext === "pdf") ft = "application/pdf";
          } else ft = att.file_type;
          return {
            id: att.id
              ? `att-disp-${att.id}`
              : `att-disp-idx-${commentNode.id}-${idx}`,
            db_id: att.id,
            file_path: fp,
            file_name: fn, // UPDATED: Keep consistent
            name: fn,
            file_type: ft,
            file_size: att.file_size || null,
          };
        })
        .filter(Boolean);
    }, [commentNode.comment_attachments, commentNode.id]);

    const numLoadedChildren = commentNode.children?.length || 0;
    const totalServerReplies = commentNode.replies_count || 0;
    const isHidden = hiddenRepliesParentIds.includes(commentNode.id);

    const canLoadMore =
      totalServerReplies > 0 &&
      numLoadedChildren < totalServerReplies &&
      !isHidden;
    const toLoadCount = totalServerReplies - numLoadedChildren;
    const canHide = numLoadedChildren > 0 && !isHidden;
    const canShow = numLoadedChildren > 0 && isHidden;

    return (
      <div
        className={`${
          level > 0
            ? "ml-5 sm:ml-7 border-l-2 border-slate-200/70 pl-3 sm:pl-4"
            : ""
        }`}
      >
        <div
          key={commentNode.id}
          className="group relative py-2"
          ref={(el) => {
            if (el) commentRefs.current[commentNode.id] = el;
          }}
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
                {" "}
                {sender.avatar}{" "}
              </span>
            )}
            <div className="flex-1 min-w-0">
              {isEditingThis ? (
                <div className="bg-slate-100 rounded-xl p-4 border border-blue-300 shadow-md">
                  <textarea
                    value={editedCommentText}
                    onChange={(e) => setEditedCommentText(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow mb-3"
                    rows={3}
                    autoFocus
                    placeholder="Edit comment..."
                    disabled={isProcessingEditOrDelete}
                  />
                  {currentEditingAttachments.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-slate-600 mb-1.5">
                        {" "}
                        Current attachments:{" "}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {currentEditingAttachments.map((att) => {
                          if (typeof att.id === "undefined") return null;
                          const del = attachmentIdsToDeleteInEdit.includes(
                            att.id
                          );
                          let url = att.file_path;
                          if (
                            url &&
                            !(url.startsWith("http") || url.startsWith("blob"))
                          ) {
                            const base = STORAGE_BASE_PATH.endsWith("/")
                              ? STORAGE_BASE_PATH
                              : STORAGE_BASE_PATH + "/";
                            const seg = url.startsWith("/")
                              ? url.substring(1)
                              : url;
                            url = base + seg;
                          }
                          const img = att.file_type?.startsWith("image/");
                          const name = att.name || `Attachment`; // Use name which is set from file_name
                          return (
                            <div
                              key={att.id}
                              className={`relative p-1 border rounded-md group transition-all ${
                                del
                                  ? "border-red-400 bg-red-50 opacity-60"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {img && url ? (
                                <img
                                  src={url}
                                  alt={name}
                                  className="w-14 h-14 object-cover rounded"
                                />
                              ) : (
                                <div className="w-14 h-14 flex flex-col items-center justify-center bg-slate-200 rounded text-slate-600 p-1 text-center">
                                  {" "}
                                  {getFileIcon(att.file_type, true)}{" "}
                                  <span
                                    className="text-[10px] leading-tight truncate w-full mt-0.5"
                                    title={name}
                                  >
                                    {" "}
                                    {name}{" "}
                                  </span>{" "}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  markExistingAttachmentForDeletionInEdit(
                                    att.id
                                  )
                                }
                                className={`absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shadow-md ${
                                  del
                                    ? "bg-green-500 hover:bg-green-600"
                                    : "bg-red-500 hover:bg-red-600"
                                } opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
                                title={del ? "Keep" : "Mark for deletion"}
                                disabled={isProcessingEditOrDelete}
                              >
                                {" "}
                                {del ? "↩" : "×"}{" "}
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
                        {" "}
                        New files to add:{" "}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {newAttachmentsForEdit.map((att) => (
                          <div
                            key={att.id}
                            className="relative p-1 border border-blue-300 bg-blue-50 rounded-md group"
                          >
                            {att.file.type.startsWith("image/") &&
                            att.preview ? (
                              <img
                                src={att.preview}
                                alt={att.file.name}
                                className="w-14 h-14 object-cover rounded"
                              />
                            ) : (
                              <div className="w-14 h-14 flex flex-col items-center justify-center bg-slate-200 rounded text-slate-600 p-1 text-center">
                                {" "}
                                {getFileIcon(att.file.type, true)}{" "}
                                <span
                                  className="text-[10px] leading-tight truncate w-full mt-0.5"
                                  title={att.file.name}
                                >
                                  {" "}
                                  {att.file.name}{" "}
                                </span>{" "}
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeNewAttachmentForEdit(att.id)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              title="Don't add this file"
                              disabled={isProcessingEditOrDelete}
                            >
                              {" "}
                              ×{" "}
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
                        {" "}
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />{" "}
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
                      {" "}
                      Cancel{" "}
                    </button>
                    <button
                      onClick={() => handleSaveEdit(commentNode.id)}
                      disabled={isProcessingEditOrDelete}
                      className="px-4 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:bg-slate-300"
                    >
                      {" "}
                      {isProcessingEditOrDelete
                        ? "Saving..."
                        : "Save Changes"}{" "}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`bg-slate-50 rounded-xl ${
                    level === 0 ? "rounded-tl-sm" : "rounded-md"
                  } p-3.5 group-hover:bg-slate-100 transition-colors cursor-context-menu`}
                  onContextMenu={(e) => handleContextMenu(e, commentNode.id)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {" "}
                      {sender.name}{" "}
                    </p>
                    {!isEditingThis && (
                      <button
                        onClick={() => handleStartReply(commentNode)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-0.5 rounded hover:bg-blue-100/70"
                        aria-label={`Reply to ${sender.name}`}
                        disabled={
                          isSubmittingComment || isProcessingEditOrDelete
                        }
                      >
                        {" "}
                        Reply{" "}
                      </button>
                    )}
                  </div>
                  {commentNode.comment_message || attToDisp.length > 0 ? (
                    <>
                      {commentNode.comment_message && (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">
                          {" "}
                          {commentNode.comment_message}{" "}
                        </p>
                      )}
                      {attToDisp.length > 0 && (
                        <div
                          className={`pt-2 ${
                            commentNode.comment_message && attToDisp.length > 0
                              ? "border-t border-slate-200"
                              : ""
                          } flex flex-wrap gap-2`}
                        >
                          {attToDisp.map((att) => {
                            let url = att.file_path;
                            if (
                              url &&
                              (url.startsWith("http") || url.startsWith("blob"))
                            )
                              url = att.file_path;
                            else if (url) {
                              const base = STORAGE_BASE_PATH.endsWith("/")
                                ? STORAGE_BASE_PATH
                                : STORAGE_BASE_PATH + "/";
                              const seg = url.startsWith("/")
                                ? url.substring(1)
                                : url;
                              url = base + seg;
                            } else url = "";
                            const name = att.name || `Attachment`; // Use name which is set from file_name

                            if (isAudio(att)) {
                              return <AudioPlayer key={att.id} src={url} />;
                            }

                            const img = att.file_type?.startsWith("image/");

                            return (
                              <div
                                key={att.id}
                                className={`${
                                  img
                                    ? "inline-block align-top"
                                    : "block w-full p-2.5 bg-white rounded-lg border"
                                } border-slate-200 hover:shadow-sm transition-shadow`}
                              >
                                {img && url ? (
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                    title={`View ${name}`}
                                  >
                                    {" "}
                                    <img
                                      src={url}
                                      alt={name}
                                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border border-slate-200 shadow-sm bg-slate-100"
                                    />{" "}
                                  </a>
                                ) : (
                                  <div className="flex items-center space-x-3">
                                    {" "}
                                    <div className="flex-shrink-0 p-2 bg-slate-100 rounded-md">
                                      {" "}
                                      {getFileIcon(att.file_type, false)}{" "}
                                    </div>{" "}
                                    <div className="flex-1 min-w-0">
                                      {" "}
                                      <p
                                        className="text-sm font-medium text-slate-800 truncate"
                                        title={name}
                                      >
                                        {" "}
                                        {name}{" "}
                                      </p>{" "}
                                      <p className="text-xs text-slate-500">
                                        {" "}
                                        {att.file_size
                                          ? formatFileSize(att.file_size)
                                          : "Unknown size"}{" "}
                                      </p>{" "}
                                    </div>{" "}
                                    {url && (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 ml-2 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                                      >
                                        {" "}
                                        View{" "}
                                      </a>
                                    )}{" "}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      {" "}
                      No message or attachments.{" "}
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between mt-1.5 ml-3">
                <p className="text-xs text-slate-500">
                  {" "}
                  {formatCommentTimestamp(commentNode.created_at)}{" "}
                </p>
                {!isEditingThis && (
                  <>
                    {loadingRepliesForCommentId === commentNode.id ? (
                      <div className="flex items-center text-xs text-slate-500">
                        <svg
                          className="animate-spin -ml-1 mr-1 h-4 w-4 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          {" "}
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>{" "}
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>{" "}
                        </svg>
                        Loading...
                      </div>
                    ) : (
                      <div className="space-x-2">
                        {canLoadMore && (
                          <button
                            onClick={() =>
                              handleLoadRepliesClick(commentNode.id)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50"
                            disabled={
                              isSubmittingComment ||
                              isProcessingEditOrDelete ||
                              loadingRepliesForCommentId !== null
                            }
                          >
                            {" "}
                            View {toLoadCount} more repl
                            {toLoadCount > 1 ? "ies" : "y"}{" "}
                          </button>
                        )}
                        {canHide && (
                          <button
                            onClick={() =>
                              toggleRepliesVisibility(commentNode.id)
                            }
                            className="text-xs text-slate-500 hover:text-slate-700 font-medium hover:underline disabled:opacity-50"
                            disabled={
                              isSubmittingComment ||
                              isProcessingEditOrDelete ||
                              loadingRepliesForCommentId !== null
                            }
                          >
                            {" "}
                            Hide {numLoadedChildren} repl
                            {numLoadedChildren > 1 ? "ies" : "y"}{" "}
                          </button>
                        )}
                        {canShow && (
                          <button
                            onClick={() =>
                              toggleRepliesVisibility(commentNode.id)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline disabled:opacity-50"
                            disabled={
                              isSubmittingComment ||
                              isProcessingEditOrDelete ||
                              loadingRepliesForCommentId !== null
                            }
                          >
                            {" "}
                            Show {numLoadedChildren} repl
                            {numLoadedChildren > 1 ? "ies" : "y"}{" "}
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {activeDropdownCommentId === commentNode.id && (
            <div
              style={{
                position: "fixed",
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                zIndex: 100,
              }}
            >
              {" "}
              <DropdownMenu
                options={dropdownOptions(commentNode)}
                onSelect={(act) => {
                  if (act === "edit") handleEdit(commentNode);
                  if (act === "delete") handleDelete(commentNode.id);
                }}
                onClose={() => setActiveDropdownCommentId(null)}
              />{" "}
            </div>
          )}
        </div>
        {!isHidden && commentNode.children?.length > 0 && (
          <div className="replies-container mt-1 space-y-1">
            {" "}
            {commentNode.children.map((child) => (
              <RenderCommentNode
                key={child.id}
                commentNode={child}
                level={level + 1}
              />
            ))}{" "}
          </div>
        )}
      </div>
    );
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
            {" "}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />{" "}
          </svg>
          Activity & Comments
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          {totalCommentsFromApi > 0
            ? `${comments.length} of ${totalCommentsFromApi} comment${
                totalCommentsFromApi !== 1 ? "s" : ""
              } shown`
            : `${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      <div
        ref={commentsListRef}
        className="flex-1 overflow-y-auto p-6 space-y-2"
        style={{ maxHeight: "calc(100vh - 23rem)" }}
      >
        {isLoadingOlderComments && (
          <div className="flex justify-center items-center py-3">
            <svg
              className="animate-spin h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              {" "}
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>{" "}
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>{" "}
            </svg>
          </div>
        )}
        {!allCommentsLoaded && comments.length > 0 && (
          <div ref={loadMoreTriggerRef} className="h-1 w-full"></div>
        )}
        {allCommentsLoaded &&
          !isLoadingOlderComments &&
          comments.length > 0 &&
          totalCommentsFromApi > 0 &&
          comments.length >= totalCommentsFromApi && (
            <p className="text-center text-xs text-slate-400 py-3">
              {" "}
              All comments loaded.{" "}
            </p>
          )}
        {commentTree.length > 0
          ? commentTree.map((node) => (
              <RenderCommentNode key={node.id} commentNode={node} level={0} />
            ))
          : !isLoadingOlderComments && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />{" "}
                  </svg>
                </div>
                <p className="text-sm text-slate-500">No comments yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  {" "}
                  Start the conversation below{" "}
                </p>
              </div>
            )}
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
        {replyingToComment && !isRecording && (
          <div className="mb-3 p-2.5 bg-slate-200/70 rounded-lg text-sm relative shadow-sm border border-slate-300">
            <div className="flex justify-between items-center">
              <p className="text-slate-700 text-xs">
                {" "}
                Replying to{" "}
                <span className="font-semibold">
                  {" "}
                  {replyingToComment.senderName}{" "}
                </span>{" "}
              </p>
              <button
                type="button"
                onClick={handleCancelReply}
                className="text-slate-500 hover:text-slate-700 text-lg p-0.5 leading-none rounded-full hover:bg-slate-300/50"
                aria-label="Cancel reply"
              >
                {" "}
                ×{" "}
              </button>
            </div>
            <p
              className="text-slate-600 mt-0.5 text-[11px] italic truncate"
              title={replyingToComment.messageSnippet}
            >
              {" "}
              "{replyingToComment.messageSnippet}"{" "}
            </p>
          </div>
        )}
        <form
          ref={newCommentFormRef}
          onSubmit={handleSubmitNewCommentForm}
          className="space-y-3"
        >
          {isRecording ? (
            <div className="p-3 bg-slate-100 rounded-lg">
              <div className="flex items-center justify-between w-full">
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="h-9 w-9 text-red-500 flex flex-col justify-center items-center text-xl rounded-full hover:bg-red-500/10"
                  aria-label="Cancel Recording"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleTogglePauseResume}
                    className="h-9 w-9 text-slate-600 flex flex-col justify-center items-center text-xl rounded-full hover:bg-slate-200"
                    aria-label={
                      isPaused ? "Resume Recording" : "Pause Recording"
                    }
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {isPaused ? (
                        <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 002 0V6a1 1 0 00-2 0v2.798l-5.445-3.63z" />
                      ) : (
                        <path d="M5 4h3v12H5V4zm7 0h3v12h-3V4z" />
                      )}
                    </svg>
                  </button>
                  <div className="text-slate-600 font-mono font-semibold text-lg">
                    {formatRecordingTime(recordingTime)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleStopAndSend}
                  className="h-9 w-9 bg-blue-600 text-white flex flex-col justify-center items-center text-xl rounded-full hover:bg-blue-700"
                  aria-label="Send Voice Message"
                >
                  <svg
                    className="w-5 h-5"
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
                </button>
              </div>
            </div>
          ) : (
            <>
              {attachments.length > 0 && (
                <div className="space-y-2 p-2 bg-slate-100 rounded-md">
                  <p className="text-xs font-medium text-slate-600">
                    {" "}
                    Files to upload:{" "}
                  </p>
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        {att.file.type.startsWith("image/") && att.preview ? (
                          <img
                            src={att.preview}
                            alt={att.file.name}
                            className="w-8 h-8 object-cover rounded border border-slate-200"
                          />
                        ) : (
                          <div className="flex-shrink-0 p-1 bg-slate-100 rounded">
                            {" "}
                            {getFileIcon(att.file.type, true)}{" "}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-medium text-slate-900 truncate"
                            title={att.file.name}
                          >
                            {" "}
                            {att.file.name}{" "}
                          </p>
                          <p className="text-xs text-slate-500">
                            {" "}
                            {formatFileSize(att.file.size)}{" "}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                        disabled={
                          isSubmittingComment || isProcessingEditOrDelete
                        }
                      >
                        {" "}
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          {" "}
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />{" "}
                        </svg>{" "}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end space-x-3">
                <label
                  className={`flex-shrink-0 self-center flex items-center justify-center p-2 border border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm ${
                    !taskId || isSubmittingComment || isProcessingEditOrDelete
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {" "}
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                    />{" "}
                  </svg>
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
                <div className="flex-1 bg-white border border-slate-300 rounded-lg flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                  <textarea
                    ref={textareaRef}
                    id="new-comment-textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                   
                    placeholder="Add a comment..."
                    className="w-full p-2.5 border-none focus:ring-0 text-sm resize-none bg-transparent"
                    rows={1}
                    disabled={isSubmittingComment || isProcessingEditOrDelete}
                  />
                </div>
                {newComment.trim() === "" && attachments.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    disabled={
                      !taskId || isSubmittingComment || isProcessingEditOrDelete
                    }
                    className="bg-green-500 hover:bg-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                    aria-label="Record a voice comment"
                  >
                    <FontAwesomeIcon icon={faMicrophone} className="text-lg" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      isSubmittingComment ||
                      isProcessingEditOrDelete ||
                      newComment.length > 5000 ||
                      !taskId
                    }
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center transition-colors"
                    aria-label="Post Comment"
                  >
                    <svg
                      className="w-5 h-5"
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
                  </button>
                )}
              </div>
              {commentError && (
                <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md mt-2">
                  {" "}
                  {commentError}{" "}
                </div>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CommentList;