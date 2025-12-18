import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { getUserRole, getEmployeeType, getApiBasePathForRole } from "@/pages/utility/apiHelper";
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
      role="menu"
    >
      <div className="py-1" role="none">
        {options.map((option) => (
          <button
            key={option.label}
            onClick={() => onSelect(option.action)}
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

  // Input states
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [activeDropdownCommentId, setActiveDropdownCommentId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedCommentText, setEditedCommentText] = useState("");
  const [currentEditingAttachments, setCurrentEditingAttachments] = useState([]);
  const [newAttachmentsForEdit, setNewAttachmentsForEdit] = useState([]);
  const [attachmentIdsToDeleteInEdit, setAttachmentIdsToDeleteInEdit] = useState([]);
  const [replyingToComment, setReplyingToComment] = useState(null);
  const [isProcessingEditOrDelete, setIsProcessingEditOrDelete] = useState(false);
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const audioChunksRef = useRef([]);
  const commentsListRef = useRef(null);
  const textareaRef = useRef(null);
  const loadMoreRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  const userRole = getUserRole();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  // Constants
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  const allowedExtensionsMap = {
     jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", pdf: "application/pdf"
  };

  // --- Fetch Logic (Latest at bottom) ---
  const fetchComments = useCallback(async (urlOverride = null, silent = false) => {
    if (!silent) setIsLoading(true);
    
    if (commentsListRef.current) {
        prevScrollHeightRef.current = commentsListRef.current.scrollHeight;
    }

    const token = Cookies.get("token");
    if (!token || !taskId) {
        setIsLoading(false);
        return;
    }

    try {
      const apiPath = getApiBasePathForRole("/task-comment-with-customers");
      const url = urlOverride || `${API_BASE_URL}${apiPath}?task_id=${taskId}&page=1&_t=${Date.now()}`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
          // Latest messages go to bottom
          setComments(processed.reverse());
      } else {
          // Prepend older messages at the top
          setComments(prev => [...processed.reverse(), ...prev]);
      }

      setNewPageUrl(apiResponse.next_page_url || apiResponse.links?.next);
      setTotalComments(apiResponse.total || apiResponse.meta?.total);

      // Auto scroll to bottom on initial load
      if (isInitialOrPage1 && !silent) {
          setTimeout(() => {
              if (commentsListRef.current) {
                  commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
              }
          }, 200);
      }
    } catch (error) {
       console.error("Error fetching chat:", error);
       if (!silent) toast.error("Failed to refresh chat.");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, API_BASE_URL]);

  useEffect(() => { 
    fetchComments(); 
  }, [fetchComments]);

  // Polling every 10 seconds for new messages
  useEffect(() => {
    const interval = setInterval(() => {
        if (!editingCommentId && !isRecording && !isSubmittingComment) {
            fetchComments(null, true); 
        }
    }, 10000); 
    return () => clearInterval(interval);
  }, [fetchComments, editingCommentId, isRecording, isSubmittingComment]);

  // Maintain scroll position when loading history
  useEffect(() => {
     if (isLoading || !commentsListRef.current) return;
     const newScrollHeight = commentsListRef.current.scrollHeight;
     const diff = newScrollHeight - prevScrollHeightRef.current;
     if (diff > 0 && newPageUrl && commentsListRef.current.scrollTop < 100) {
        commentsListRef.current.scrollTop = diff;
     }
  }, [comments, isLoading, newPageUrl]);

  // Observer for top scroll (Load older)
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && newPageUrl && !isLoading) {
          fetchComments(newPageUrl);
        }
      }, { threshold: 0.1 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [newPageUrl, isLoading, fetchComments]);

  // Submit Logic
  const handleWrapperSubmit = async (payload, isFormData) => {
      setIsSubmittingComment(true);
      const success = await handleCommentSubmit(payload, isFormData, false);
      if (success) {
          setAttachments([]); 
          setNewComment(""); 
          handleCancelReply(); 
          await fetchComments();
          setTimeout(() => {
              if (commentsListRef.current) {
                  commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
              }
          }, 300);
      }
      setIsSubmittingComment(false);
      return success;
  };

  const handleWrapperDelete = async (id) => {
     const res = await Swal.fire({ title: "Delete Message?", text: "This will remove the message for everyone.", icon: "warning", showCancelButton: true, confirmButtonText: "Delete" });
     if (res.isConfirmed) {
         setIsProcessingEditOrDelete(true);
         const ok = await onDeleteComment(id, false);
         if (ok) { toast.success("Deleted"); fetchComments(); }
         setIsProcessingEditOrDelete(false);
     }
  };

  const handleWrapperEdit = async (commentId, formData) => {
      setIsProcessingEditOrDelete(true);
      const success = await onEditComment(commentId, formData, false);
      if (success) { handleCancelEdit(); fetchComments(); }
      setIsProcessingEditOrDelete(false);
  }

  // Files
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), id: `new-${Date.now()}-${f.name}` }))]);
    e.target.value = "";
  };
  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));
  
  // Voice
  const handleStartRecording = async () => {
     if (isSubmittingComment) return;
     try {
         const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
         const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
         mediaRecorderRef.current = mr;
         audioChunksRef.current = [];
         mr.ondataavailable = e => audioChunksRef.current.push(e.data);
         mr.onstop = async () => {
             stream.getTracks().forEach(t => t.stop());
             if (audioChunksRef.current.length === 0) return;
             const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
             const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
             const fd = new FormData();
             fd.append("task_id", taskId.toString());
             fd.append("comment_message", "");
             if (replyingToComment) fd.append("reply_to", replyingToComment.id.toString());
             fd.append("allowed_customer", "1");
             fd.append("attachments[]", file, file.name);
             await handleWrapperSubmit(fd, true);
         };
         mr.start(); setIsRecording(true);
         recordingIntervalRef.current = setInterval(() => setRecordingTime(t => t+1), 1000);
     } catch (e) { toast.error("Mic access failed."); }
  };
  const handleStopAndSend = () => { mediaRecorderRef.current?.stop(); resetRecording(); };
  const handleCancelRecording = () => { mediaRecorderRef.current?.stop(); resetRecording(); };
  const resetRecording = () => { clearInterval(recordingIntervalRef.current); setIsRecording(false); setRecordingTime(0); audioChunksRef.current = []; };

  // UI Handlers
  const handleContextMenu = (e, id) => {
      e.preventDefault();
      setDropdownPosition({ top: e.clientY, left: e.clientX });
      setActiveDropdownCommentId(id);
      setEditingCommentId(null);
  };
  const handleEdit = (c) => {
      setActiveDropdownCommentId(null); setEditingCommentId(c.id); setEditedCommentText(c.comment_message || "");
      setCurrentEditingAttachments(c.comment_attachments || []); setNewAttachmentsForEdit([]); setAttachmentIdsToDeleteInEdit([]);
  };
  const handleCancelEdit = () => { setEditingCommentId(null); setEditedCommentText(""); };
  const handleCancelReply = () => setReplyingToComment(null);

  const handleSaveEdit = (id) => {
      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("comment_message", editedCommentText);
      attachmentIdsToDeleteInEdit.forEach(aid => fd.append("delete_attachments[]", aid.toString()));
      newAttachmentsForEdit.forEach(att => fd.append("attachments[]", att.file, att.file.name));
      handleWrapperEdit(id, fd);
  };
  
  const handleMainSubmit = (e) => {
      if (e) e.preventDefault();
      if (!newComment.trim() && attachments.length === 0) return;
      if (attachments.length > 0) {
          const fd = new FormData();
          fd.append("task_id", taskId.toString());
          fd.append("comment_message", newComment);
          if (replyingToComment) fd.append("reply_to", replyingToComment.id.toString());
          fd.append("allowed_customer", "1");
          attachments.forEach(a => fd.append("attachments[]", a.file, a.file.name));
          handleWrapperSubmit(fd, true);
      } else {
          const p = { task_id: taskId, comment_message: newComment, allowed_customer: 1 };
          if (replyingToComment) p.reply_to = replyingToComment.id;
          handleWrapperSubmit(p, false);
      }
  }

  // Appearance
  const getBubbleColor = (comment) => {
    const role = comment.sender?.role || "";
    if (role === "admin") return "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500";
    if (role === "customer") return "bg-orange-50 border-orange-200 border-l-4 border-l-orange-500";
    if (["employee", "manager", "supervisor", "executive"].includes(role)) return "bg-green-50 border-green-200 border-l-4 border-l-green-500";
    return "bg-gray-50 border-gray-200";
  };
  const getAvatarColor = (comment) => {
      const role = comment.sender?.role || "";
      if (role === "admin") return "bg-blue-600";
      if (role === "customer") return "bg-orange-500";
      return "bg-green-600";
  }

  const RenderCommentNode = ({ commentNode }) => {
      const sender = mapApiUserToLocal(commentNode.sender);
      const isEditingThis = editingCommentId === commentNode.id;
      
      return (
        <div className={`group relative py-2 pl-3 sm:pl-4`}>
             <div className="flex items-start space-x-3" onContextMenu={(e) => handleContextMenu(e, commentNode.id)}>
                {sender.profilePic ? (
                  <img src={sender.profilePic} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" alt="avatar" />
                ) : (
                  <span className={`w-9 h-9 text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100 ${getAvatarColor(commentNode)}`}>
                      {sender.avatar}
                  </span>
                )}
                
                <div className="flex-1 min-w-0">
                    {isEditingThis ? (
                        <div className="bg-slate-100 rounded-xl p-4 border border-blue-300 shadow-md">
                            <textarea value={editedCommentText} onChange={e=>setEditedCommentText(e.target.value)} className="w-full p-2.5 border rounded-lg text-sm mb-3" rows={3}/>
                            <div className="flex justify-end gap-2">
                                <button onClick={handleCancelEdit} className="px-3 py-1.5 text-sm bg-slate-200 rounded-lg">Cancel</button>
                                <button onClick={()=>handleSaveEdit(commentNode.id)} className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className={`rounded-xl p-3.5 group-hover:bg-slate-100 transition-colors ${getBubbleColor(commentNode)}`}>
                             <div className="flex justify-between items-center mb-1">
                                 <p className="text-sm font-semibold text-slate-800">{sender.name}</p>
                                 <div className="flex space-x-2">
                                    <button onClick={()=>setReplyingToComment({id:commentNode.id, senderName: sender.name, messageSnippet: commentNode.comment_message})} className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100">Reply</button>
                                 </div>
                             </div>
                             {commentNode.comment_message && (
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-2">{commentNode.comment_message}</p>
                             )}
                             {commentNode.comment_attachments?.map(att => {
                                 const fullPath = att.file_path.startsWith('http') ? att.file_path : `${STORAGE_BASE_PATH}${att.file_path}`;
                                 return (
                                     <div key={att.id} className="mt-1">
                                         {isAudio(att) ? <AudioPlayer src={fullPath} /> : (
                                             <a href={fullPath} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline block truncate">
                                                📎 {att.file_name}
                                             </a>
                                         )}
                                     </div>
                                 );
                             })}
                        </div>
                    )}
                    <div className="text-xs text-slate-500 mt-1.5 ml-3">{formatCommentTimestamp(commentNode.created_at)}</div>
                </div>
             </div>
             
             {activeDropdownCommentId === commentNode.id && (
                <div style={{ position: "fixed", top: dropdownPosition.top, left: dropdownPosition.left, zIndex: 100 }}>
                    <DropdownMenu
                        options={[
                            { label: "Edit", action: "edit", disabled: sender.id !== currentUserId },
                            { label: "Delete", action: "delete", disabled: sender.id !== currentUserId && userRole !== 'admin' }
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
            
            {commentNode.replies && commentNode.replies.length > 0 && (
                <div className="ml-5 sm:ml-7 border-l-2 border-slate-200/70 pl-3 sm:pl-4 mt-2">
                    {commentNode.replies.map(r => <RenderCommentNode key={r.id} commentNode={r} />)}
                </div>
            )}
        </div>
      );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
         <h3 className="text-lg font-bold text-slate-800 flex items-center">
             <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
             </svg>
             Customer Chat
         </h3>
         <p className="text-sm text-slate-600 mt-1">{totalComments} messages</p>
      </div>

      {/* Chat History List */}
      <div ref={commentsListRef} className="p-6 space-y-2 h-[400px] overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div ref={loadMoreRef} className="h-10 flex justify-center items-center text-xs text-slate-400">
             {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    Loading chat...
                </div>
             ) : newPageUrl ? "Scroll up to see previous messages" : "Conversation started"}
          </div>
          {/* Messages rendered here, sorted so that newest is at the bottom */}
          {comments.map(c => <RenderCommentNode key={c.id} commentNode={c} />)}
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          {replyingToComment && (
              <div className="mb-3 p-2.5 bg-indigo-50 rounded-lg text-sm relative border border-indigo-100 flex justify-between items-center">
                  <span className="text-indigo-800 truncate pr-4">Replying to <b>{replyingToComment.senderName}</b></span>
                  <button onClick={handleCancelReply} className="text-indigo-400 hover:text-indigo-600 text-xl font-bold">×</button>
              </div>
          )}
          
          <form onSubmit={handleMainSubmit} className="space-y-3">
              {isRecording ? (
                  <div className="p-3 bg-white border border-indigo-200 shadow-inner rounded-xl flex justify-between items-center">
                      <button type="button" onClick={handleCancelRecording} className="text-red-500 font-medium px-4 py-1">Cancel</button>
                      <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-ping"></div>
                          <span className="font-mono text-lg font-bold text-slate-700">{formatRecordingTime(recordingTime)}</span>
                      </div>
                      <button type="button" onClick={handleStopAndSend} className="bg-indigo-600 text-white px-6 py-1.5 rounded-full font-bold">Send</button>
                  </div>
              ) : (
                <>
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg border border-slate-200">
                        {attachments.map(att => (
                            <div key={att.id} className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-md max-w-xs">
                                <span className="text-xs truncate text-slate-600">{att.file.name}</span>
                                <button type="button" onClick={()=>removeAttachment(att.id)} className="text-red-500">×</button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex items-end space-x-3">
                    <label className="flex-shrink-0 p-2.5 border border-slate-300 rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-all">
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <input type="file" multiple onChange={handleFileSelect} className="hidden" />
                    </label>
                    
                    <div className="flex-1 bg-white border border-slate-300 rounded-xl flex items-end overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            // Removed the Enter-to-submit logic here
                            className="w-full p-3 border-none focus:ring-0 text-sm resize-none bg-transparent"
                            placeholder="Type a message..."
                            rows={1}
                        />
                    </div>

                    {newComment.trim() === "" && attachments.length === 0 ? (
                        <button
                            type="button"
                            onClick={handleStartRecording}
                            disabled={isSubmittingComment}
                            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all shadow-lg shadow-emerald-100"
                        >
                            <FontAwesomeIcon icon={faMicrophone} className="text-xl" />
                        </button>
                    ) : (
                        <button 
                            type="submit" 
                            disabled={isSubmittingComment} 
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center transition-all shadow-lg"
                        >
                            {isSubmittingComment ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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