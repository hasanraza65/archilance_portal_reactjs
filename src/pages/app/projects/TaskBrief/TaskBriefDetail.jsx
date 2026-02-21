import React, { useState } from "react";
import Cookies from "js-cookie";
import DOMPurify from "dompurify";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AddTaskBriefModal from "./AddTaskBriefModal";
import EditTaskBriefModal from "./EditTaskBriefModal";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const getAttachmentUrl = (filePath, createdAt = null) => {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (!backendBaseUrl || !filePath) return "#";
  const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
  const cleanFilePath = filePath.replace(/^\//, "");

  const cutoffDate = new Date("2026-01-10T00:00:00.000Z");
  const attachmentCreatedAt = createdAt ? new Date(createdAt) : null;

  if (attachmentCreatedAt && attachmentCreatedAt >= cutoffDate) {
    return `${cleanBaseUrl}/onedrive-image?path=${cleanFilePath}`;
  }

  return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};

const getMimeTypeFromFileExtension = (fileName) => {
  if (typeof fileName !== "string") return "application/octet-stream";
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (!extension) return "application/octet-stream";

  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    txt: "text/plain",
    csv: "text/csv",
  };
  return mimeTypes[extension] || "application/octet-stream";
};

const getFileIcon = (fileType) => {
  const iconClasses = "w-4 h-4";
  if (fileType?.startsWith("image/")) {
    return (
      <svg className={`${iconClasses} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  } else if (fileType === "application/pdf") {
    return (
      <svg className={`${iconClasses} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className={`${iconClasses} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const TaskBriefsSection = ({ briefs, taskId, onBriefsUpdated }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [briefToEdit, setBriefToEdit] = useState(null);

  const handleOpenAddModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (brief) => {
    setBriefToEdit(brief);
    setIsEditModalOpen(true);
  };

  const handleDeleteBrief = async (briefId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Authentication token not found.");
        return;
      }
      try {
        const apiPrefix = getApiPrefix();
        const apiPath = `/api/${apiPrefix}/task-brief/${briefId}`;
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_BASE_URL}${apiPath}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete the brief.");
        }

        toast.success("Brief deleted successfully.");
        onBriefsUpdated(); // Refresh data in parent
      } catch (error) {
        toast.error(error.message || "An error occurred.");
      }
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Project Briefs</h2>
            {briefs && briefs.length > 0 && (
              <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {briefs.length} {briefs.length === 1 ? "Brief" : "Briefs"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenAddModal(e);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-2 transition-colors cursor-pointer relative z-10"
            style={{ pointerEvents: 'auto' }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            <span>Add Brief</span>
          </button>
        </div>

        {briefs && briefs.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {briefs.map((brief) => (
              <div
                key={brief.id}
                className="grid grid-cols-12 gap-4 p-6 items-start hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="col-span-12 md:col-span-5">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2">
                    Description
                  </p>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        brief.brief_description || "No description"
                      ),
                    }}
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2">
                    Date
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">
                    {new Date(brief.brief_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="col-span-12 md:col-span-3">
                  <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase mb-2">
                    Attachments
                  </p>
                  {brief.attachments && brief.attachments.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {brief.attachments.map((att) => {
                        const mimeType = getMimeTypeFromFileExtension(att.file_name);
                        return (
                          <a
                            key={att.id}
                            href={getAttachmentUrl(att.file_path, att.created_at)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 group transition-all"
                            title={att.file_name}
                          >
                            <div className="flex-shrink-0">
                              {getFileIcon(mimeType)}
                            </div>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate max-w-[150px]">
                              {att.file_name}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-xs italic">No attachments</p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(brief)}
                    title="Edit Brief"
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBrief(brief.id)}
                    title="Delete Brief"
                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 italic">
              No briefs have been added to this job yet.
            </p>
          </div>
        )}
      </div>

      <AddTaskBriefModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onTaskBriefAdded={onBriefsUpdated}
        taskId={taskId}
      />
      {briefToEdit && (
        <EditTaskBriefModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setBriefToEdit(null);
          }}
          onTaskBriefUpdated={onBriefsUpdated}
          briefData={briefToEdit}
          taskId={taskId}
        />
      )}
    </>
  );
};

export default TaskBriefsSection;
