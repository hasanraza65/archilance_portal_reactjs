// src/components/TaskDetails/CommentList.jsx
import React, { useState } from "react";
import { toast } from 'react-toastify';
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils";

const CommentList = ({
  comments,
  newComment,
  setNewComment,
  handleCommentSubmit,
  isSubmittingComment,
  commentError,
}) => {
  const [attachments, setAttachments] = useState([]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not allowed for ${file.name}.`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
    e.target.value = ''; // Reset input
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  const handleCommentSubmitWithAttachments = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim() && attachments.length === 0) {
      toast.error("Please add a comment or attachment.");
      return;
    }

    // Create FormData if there are attachments
    if (attachments.length > 0) {
      const formData = new FormData();
      formData.append('comment_message', newComment);
      
      // Append files
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });

      // Pass formData to the parent's submit handler
      await handleCommentSubmit(e, formData);
    } else {
      // Regular comment submission without files
      await handleCommentSubmit(e);
    }

    // Clear attachments after successful submission
    setAttachments([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Activity & Comments
        </h3>
        <p className="text-sm text-slate-600 mt-1">{comments.length} comment{comments.length !== 1 ? "s" : ""}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ maxHeight: "calc(100vh - 22rem)" }}>
        {comments.length > 0 ? (
          comments.map((comment) => {
            const sender = comment.sender ? mapApiUserToLocal(comment.sender, "commenter") : mapApiUserToLocal(null, "commenter");
            return (
              <div key={comment.id} className="group">
                <div className="flex items-start space-x-3">
                  {sender.profilePic ? (
                    <img src={sender.profilePic} alt={sender.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" />
                  ) : (
                    <span className={`w-9 h-9 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100`}>
                      {sender.avatar}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-xl rounded-tl-sm p-3.5 group-hover:bg-slate-100 transition-colors">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{sender.name}</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.comment_message}</p>
                      
                      {/* Display comment attachments if they exist */}
                      {comment.attachments && comment.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {comment.attachments.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200">
                              {getFileIcon(file.type || file.mime_type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate">
                                  {file.name || file.original_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {file.size ? formatFileSize(file.size) : 'Unknown size'}
                                </p>
                              </div>
                              {file.url && (
                                <a 
                                  href={file.url} 
                                  download 
                                  className="text-blue-600 hover:text-blue-700 p-1"
                                  title="Download"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 ml-3">{formatCommentTimestamp(comment.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500">No comments yet</p>
            <p className="text-xs text-slate-400 mt-1">Start the conversation below</p>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
        <form onSubmit={handleCommentSubmitWithAttachments} className="space-y-3">
          <textarea 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            placeholder="Add a comment..." 
            className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm transition-colors" 
            rows={3} 
            disabled={isSubmittingComment} 
            maxLength={500} 
          />
          
          {/* File Attachment Section */}
          <div className="space-y-3">
            {/* File Input */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center justify-center px-3 py-2 border border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors text-sm">
                <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-slate-600">Attach files</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isSubmittingComment}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                />
              </label>
              <span className="text-xs text-slate-400">Max 10MB per file</span>
            </div>

            {/* Attachment List */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isSubmittingComment}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {commentError && (
            <div className="text-red-600 text-xs bg-red-50 p-2 rounded-md">{commentError}</div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">
              {newComment.length > 500 ? (
                <span className="text-red-500">{newComment.length}/500</span>
              ) : (
                `${newComment.length}/500`
              )}
              {attachments.length > 0 && (
                <span className="ml-2 text-blue-600">
                  • {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
                </span>
              )}
            </span>
            <button 
              type="submit" 
              disabled={(!newComment.trim() && attachments.length === 0) || isSubmittingComment || newComment.length > 500} 
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-1.5"
            >
              {isSubmittingComment ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>{attachments.length > 0 ? 'Post with files' : 'Post'}</span>
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