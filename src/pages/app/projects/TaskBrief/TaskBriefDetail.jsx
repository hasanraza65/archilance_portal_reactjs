import React, { useState } from "react";
import Cookies from "js-cookie";
import DOMPurify from "dompurify";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import AddTaskBriefModal from "./AddTaskBriefModal";
import EditTaskBriefModal from "./EditTaskBriefModal";
import { getApiPrefix } from "@/pages/utility/apiHelper";

// Helper functions
const getAttachmentUrl = (filePath) => {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (!backendBaseUrl || !filePath) return "#";
  const cleanBaseUrl = backendBaseUrl.replace(/\/$/, "");
  const cleanFilePath = filePath.replace(/^\//, "");
  return `${cleanBaseUrl}/storage/${cleanFilePath}`;
};

const TaskBriefsSection = ({ briefs, taskId, onBriefsUpdated }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [briefToEdit, setBriefToEdit] = useState(null);

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
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
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
            <h2 className="text-xl font-bold text-slate-800">Project Briefs</h2>
            {briefs && briefs.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {briefs.length} {briefs.length === 1 ? "Brief" : "Briefs"}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm flex items-center space-x-2"
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
          <div className="divide-y divide-slate-100">
            {briefs.map((brief) => (
              <div
                key={brief.id}
                className="grid grid-cols-12 gap-4 p-6 items-start"
              >
                <div className="col-span-12 md:col-span-5">
                  <p className="font-semibold text-slate-500 text-xs uppercase mb-1">
                    Description
                  </p>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        brief.brief_description || "No description"
                      ),
                    }}
                  />
                </div>
                <div className="col-span-6 md:col-span-2">
                  <p className="font-semibold text-slate-500 text-xs uppercase mb-1">
                    Date
                  </p>
                  <p className="text-slate-700">
                    {new Date(brief.brief_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-3">
                  <p className="font-semibold text-slate-500 text-xs uppercase mb-1">
                    Attachments
                  </p>
                  {brief.attachments && brief.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {brief.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={getAttachmentUrl(att.file_path)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {att.file_name}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No attachments</p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => handleOpenEditModal(brief)}
                    title="Edit Brief"
                    className="p-2 text-slate-500 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path>
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBrief(brief.id)}
                    title="Delete Brief"
                    className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-slate-500">
              No briefs have been added to this task yet.
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
