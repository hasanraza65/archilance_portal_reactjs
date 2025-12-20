import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import {
  getUserRole,
  getEmployeeType,
  getApiBasePathForRole,
} from "@/pages/utility/apiHelper";
import Cookies from "js-cookie";

const STORAGE_BASE_PATH = `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/`;

const isAudio = (attachment) => {
  const mime = attachment.file_type || "";
  if (mime) return mime.startsWith("audio/");
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
    >
      <div className="py-1">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.action)}
            disabled={option.disabled}
            className="text-slate-700 disabled:text-slate-400 block w-full text-left px-4 py-2 text-sm hover:bg-slate-100 disabled:hover:bg-transparent"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const CustomerCommentList = ({
  taskId,
  currentUserId,
  handleCommentSubmit,
  onEditComment,
  onDeleteComment,
}) => {
  const [comments, setComments] = useState([]);
  const [newPageUrl, setNewPageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [totalComments, setTotalComments] = useState(0);

  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
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

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const commentsListRef = useRef(null);
  const textareaRef = useRef(null);
  const loadMoreRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // Anti-Loop Refs
  const isFetchingRef = useRef(false);
  const stopPollingRef = useRef(false);

  const userRole = getUserRole();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  // --- Core Fetch Function (Stable) ---
  const fetchComments = useCallback(
    async (urlOverride = null, silent = false, source = "unknown") => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (!silent) setIsLoading(true);

      if (commentsListRef.current) {
        prevScrollHeightRef.current = commentsListRef.current.scrollHeight;
      }

      const token = Cookies.get("token");
      if (!token || !taskId) {
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      try {
        const apiPath = getApiBasePathForRole("/task-comment-with-customers");
        const url =
          urlOverride ||
          `${API_BASE_URL}${apiPath}?task_id=${taskId}&page=1&_t=${Date.now()}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) throw new Error("Fetch failed");
        const apiResponse = await response.json();
        const fetchedData = apiResponse.data || [];

        const processed = fetchedData.map((c) => ({
          ...c,
          comment_attachments: c.comment_attachments || [],
          replies: c.replies || [],
        }));

        const isInitialOrPage1 = !urlOverride || urlOverride.includes("page=1");

        if (isInitialOrPage1) {
          setComments(processed.reverse());
        } else {
          setComments((prev) => [...processed.reverse(), ...prev]);
        }

        setNewPageUrl(
          apiResponse.next_page_url || apiResponse.links?.next || null
        );
        setTotalComments(apiResponse.total || apiResponse.meta?.total || 0);

        if (isInitialOrPage1 && !silent) {
          setTimeout(() => {
            if (commentsListRef.current) {
              commentsListRef.current.scrollTop =
                commentsListRef.current.scrollHeight;
            }
          }, 300);
        }
      } catch (error) {
        console.error("[Chat API Error]", error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [taskId, API_BASE_URL]
  );

  // Initial Load
  useEffect(() => {
    fetchComments(null, false, "Initial Mount");
    return () => {
      stopPollingRef.current = true;
    };
  }, [taskId]);

  // Stable Polling (No Loop)
  useEffect(() => {
    let timeoutId;
    const poll = async () => {
      if (stopPollingRef.current) return;
      if (
        !isFetchingRef.current &&
        !isRecording &&
        !isSubmittingComment &&
        !document.hidden
      ) {
        await fetchComments(null, true, "Polling");
      }
      timeoutId = setTimeout(poll, 15000); // 15s interval
    };
    timeoutId = setTimeout(poll, 15000);
    return () => clearTimeout(timeoutId);
  }, [taskId, fetchComments, isRecording, isSubmittingComment]);

  // Handle Scroll Position for history
  useEffect(() => {
    if (isLoading || !commentsListRef.current) return;
    const newScrollHeight = commentsListRef.current.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;
    if (diff > 0 && newPageUrl && commentsListRef.current.scrollTop < 100) {
      commentsListRef.current.scrollTop = diff;
    }
  }, [comments, isLoading, newPageUrl]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (!newPageUrl || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingRef.current) {
          fetchComments(newPageUrl, false, "Pagination Scroll");
        }
      },
      { threshold: 0.1 }
    );
    const target = loadMoreRef.current;
    if (target) observer.observe(target);
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [newPageUrl, isLoading, fetchComments]);

  // Handlers
  const handleWrapperSubmit = async (payload, isFormData) => {
    setIsSubmittingComment(true);
    const success = await handleCommentSubmit(payload, isFormData, false);
    if (success) {
      setAttachments([]);
      setNewComment("");
      setReplyingToComment(null);
      await fetchComments();
      setTimeout(() => {
        if (commentsListRef.current)
          commentsListRef.current.scrollTop =
            commentsListRef.current.scrollHeight;
      }, 300);
    }
    setIsSubmittingComment(false);
  };

  const handleWrapperDelete = async (id) => {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: "This message will be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes",
    });
    if (res.isConfirmed) {
      setIsProcessingEditOrDelete(true);
      const ok = await onDeleteComment(id, false);
      if (ok) {
        toast.success("Deleted");
        fetchComments();
      }
      setIsProcessingEditOrDelete(false);
    }
  };

  const handleWrapperEdit = async (commentId, formData) => {
    setIsProcessingEditOrDelete(true);
    const success = await onEditComment(commentId, formData, false);
    if (success) {
      setEditingCommentId(null);
      fetchComments();
    }
    setIsProcessingEditOrDelete(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        file: f,
        preview: URL.createObjectURL(f),
        id: `new-${Date.now()}-${f.name}`,
      })),
    ]);
    e.target.value = "";
  };
  const removeAttachment = (id) =>
    setAttachments((prev) => prev.filter((a) => a.id !== id));

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        const fd = new FormData();
        fd.append("task_id", taskId.toString());
        fd.append("comment_message", "");
        fd.append("allowed_customer", "1");
        if (replyingToComment)
          fd.append("reply_to", replyingToComment.id.toString());
        fd.append("attachments[]", file, file.name);
        await handleWrapperSubmit(fd, true);
      };
      mr.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(
        () => setRecordingTime((t) => t + 1),
        1000
      );
    } catch (e) {
      toast.error("Mic error");
    }
  };
  const handleStopAndSend = () => {
    mediaRecorderRef.current?.stop();
    resetRecording();
  };
  const handleCancelRecording = () => {
    mediaRecorderRef.current?.stop();
    resetRecording();
  };
  const resetRecording = () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const handleMainSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;
    const fd = new FormData();
    if (attachments.length > 0) {
      fd.append("task_id", taskId.toString());
      fd.append("comment_message", newComment);
      if (replyingToComment)
        fd.append("reply_to", replyingToComment.id.toString());
      fd.append("allowed_customer", "1");
      attachments.forEach((a) =>
        fd.append("attachments[]", a.file, a.file.name)
      );
      handleWrapperSubmit(fd, true);
    } else {
      const p = {
        task_id: taskId,
        comment_message: newComment,
        allowed_customer: 1,
      };
      if (replyingToComment) p.reply_to = replyingToComment.id;
      handleWrapperSubmit(p, false);
    }
  };

  // Styles
  const getBubbleColor = (comment) => {
    const role = comment.sender?.role || "";
    if (role === "admin")
      return "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500";
    if (role === "customer")
      return "bg-orange-50 border-orange-200 border-l-4 border-l-orange-500";
    if (["employee", "manager", "supervisor", "executive"].includes(role))
      return "bg-green-50 border-green-200 border-l-4 border-l-green-500";
    return "bg-gray-50 border-gray-200";
  };
  const getAvatarColor = (comment) => {
    const role = comment.sender?.role || "";
    if (role === "admin") return "bg-blue-600";
    if (role === "customer") return "bg-orange-500";
    return "bg-green-600";
  };

  const RenderCommentNode = ({ commentNode }) => {
    const sender = mapApiUserToLocal(commentNode.sender);
    const isEditingThis = editingCommentId === commentNode.id;
    return (
      <div className="group relative py-2 pl-3 sm:pl-4">
        <div
          className="flex items-start space-x-3"
          onContextMenu={(e) => {
            e.preventDefault();
            setDropdownPosition({ top: e.clientY, left: e.clientX });
            setActiveDropdownCommentId(commentNode.id);
          }}
        >
          {sender.profilePic ? (
            <img
              src={sender.profilePic}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100"
            />
          ) : (
            <span
              className={`w-9 h-9 text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100 ${getAvatarColor(
                commentNode
              )}`}
            >
              {sender.avatar}
            </span>
          )}
          <div className="flex-1 min-w-0">
            {isEditingThis ? (
              <div className="bg-slate-100 rounded-xl p-4 border border-blue-300 shadow-md">
                <textarea
                  value={editedCommentText}
                  onChange={(e) => setEditedCommentText(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-sm mb-3"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingCommentId(null)}
                    className="px-3 py-1.5 text-sm bg-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(commentNode.id)}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-xl p-3.5 group-hover:bg-slate-100 transition-colors ${getBubbleColor(
                  commentNode
                )}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {sender.name}
                  </p>
                  <button
                    onClick={() =>
                      setReplyingToComment({
                        id: commentNode.id,
                        senderName: sender.name,
                        messageSnippet: commentNode.comment_message,
                      })
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100"
                  >
                    Reply
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">
                  {commentNode.comment_message}
                </p>
                {commentNode.comment_attachments?.map((att) => {
                  const path = att.file_path.startsWith("http")
                    ? att.file_path
                    : `${STORAGE_BASE_PATH}${att.file_path}`;
                  return (
                    <div key={att.id} className="mt-1">
                      {isAudio(att) ? (
                        <AudioPlayer src={path} />
                      ) : (
                        <a
                          href={path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 underline block truncate"
                        >
                          📎 {att.file_name}
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1.5 ml-3">
              {formatCommentTimestamp(commentNode.created_at)}
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
            <DropdownMenu
              options={[
                {
                  label: "Edit",
                  action: "edit",
                  disabled: sender.id !== currentUserId,
                },
                {
                  label: "Delete",
                  action: "delete",
                  disabled: sender.id !== currentUserId && userRole !== "admin",
                },
              ]}
              onSelect={(act) => {
                if (act === "edit") handleEdit(commentNode);
                if (act === "delete") handleWrapperDelete(commentNode.id);
                setActiveDropdownCommentId(null);
              }}
              onClose={() => setActiveDropdownCommentId(null)}
            />
          </div>
        )}
        {commentNode.replies?.map((r) => (
          <div
            key={r.id}
            className="ml-5 sm:ml-7 border-l-2 border-slate-200/70 pl-3 sm:pl-4 mt-2"
          >
            <RenderCommentNode commentNode={r} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Exact UI Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
              />
            </svg>
            Customer Chat
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            {totalComments} messages
          </p>
        </div>
      </div>

      <div
        ref={commentsListRef}
        className="p-6 space-y-2 h-[300px] overflow-y-auto custom-scrollbar bg-slate-50/30"
      >
        <div
          ref={loadMoreRef}
          className="h-10 flex justify-center items-center text-xs text-slate-400"
        >
          {isLoading
            ? "Loading messages..."
            : newPageUrl
            ? "Scroll up for chat history"
            : "Conversation started"}
        </div>
        {comments.map((c) => (
          <RenderCommentNode key={c.id} commentNode={c} />
        ))}
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
        {replyingToComment && (
          <div className="mb-3 p-2.5 bg-indigo-50 rounded-lg text-sm relative border border-indigo-100 flex justify-between items-center">
            <span className="text-indigo-800 truncate pr-4">
              Replying to <b>{replyingToComment.senderName}</b>
            </span>
            <button
              onClick={() => setReplyingToComment(null)}
              className="text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleMainSubmit} className="space-y-3">
          {isRecording ? (
            <div className="p-3 bg-white border border-indigo-200 shadow-inner rounded-xl flex justify-between items-center">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="text-red-500 font-medium px-4 py-1"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                <span className="font-mono text-lg font-bold text-slate-700">
                  {formatRecordingTime(recordingTime)}
                </span>
              </div>
              <button
                type="button"
                onClick={handleStopAndSend}
                className="bg-indigo-600 text-white px-6 py-1.5 rounded-full font-bold"
              >
                Send
              </button>
            </div>
          ) : (
            <>
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-slate-200 mb-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md"
                    >
                      <span className="text-xs truncate max-w-[150px]">
                        {att.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="text-red-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end space-x-3">
                <label className="flex-shrink-0 p-2.5 border border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-all">
                  <svg
                    className="w-6 h-6 text-slate-500"
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
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <div className="flex-1 bg-white border border-slate-300 rounded-xl flex items-end shadow-sm">
                  <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3 border-none focus:ring-0 text-sm resize-none bg-transparent"
                    placeholder="Write a message..."
                    rows={1}
                  />
                </div>
                {newComment.trim() === "" && attachments.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="bg-emerald-500 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <FontAwesomeIcon icon={faMicrophone} className="text-xl" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmittingComment}
                    className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  >
                    {isSubmittingComment ? (
                      "..."
                    ) : (
                      <svg
                        className="w-6 h-6"
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
                    )}
                  </button>
                )}
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default CustomerCommentList;
