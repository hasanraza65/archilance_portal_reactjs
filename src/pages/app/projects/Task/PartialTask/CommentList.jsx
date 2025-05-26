// src/components/TaskDetails/CommentList.jsx
import React from "react";
import { mapApiUserToLocal, formatCommentTimestamp } from "./taskDetailsUtils";

const CommentList = ({
  comments,
  newComment,
  setNewComment,
  handleCommentSubmit,
  isSubmittingComment,
  commentError,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 sticky top-6 max-h-[calc(100vh-3rem)] flex flex-col">
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
        <h3 className="text-lg font-bold text-slate-800 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
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
                  {sender.profilePic ? (<img src={sender.profilePic} alt={sender.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100" />
                  ) : (<span className={`w-9 h-9 ${sender.color} text-white rounded-full flex items-center justify-center text-sm font-semibold ring-1 ring-slate-100`}>{sender.avatar}</span>)}
                  <div className="flex-1 min-w-0">
                    <div className="bg-slate-50 rounded-xl rounded-tl-sm p-3.5 group-hover:bg-slate-100 transition-colors">
                      <p className="text-sm font-semibold text-slate-800 mb-1">{sender.name}</p>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.comment_message}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 ml-3">{formatCommentTimestamp(comment.created_at)}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg></div>
            <p className="text-sm text-slate-500">No comments yet</p>
            <p className="text-xs text-slate-400 mt-1">Start the conversation below</p>
          </div>
        )}
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50/50 rounded-b-2xl">
        <form onSubmit={handleCommentSubmit} className="space-y-3">
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="w-full p-3 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm transition-colors" rows={3} disabled={isSubmittingComment} maxLength={500} />
          {commentError && (<div className="text-red-600 text-xs bg-red-50 p-2 rounded-md">{commentError}</div>)}
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">{newComment.length > 500 ? (<span className="text-red-500">{newComment.length}/500</span>) : (`${newComment.length}/500`)}</span>
            <button type="submit" disabled={!newComment.trim() || isSubmittingComment || newComment.length > 500} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors flex items-center space-x-1.5">
              {isSubmittingComment ? (<><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Posting...</span></>) : (<><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg><span>Post</span></>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentList;