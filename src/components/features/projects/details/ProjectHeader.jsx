import React from "react";
import Icon from "@/components/ui/Icon";
import { Edit } from "lucide-react";
import EditableProjectStatus from "@/pages/app/projects/EditableProjectStatus";
import DOMPurify from "dompurify";
import { getApiBasePathForRole } from "./utils";
import NotesContainer from "@/components/features/notes/NotesContainer";
import { getMediaUrl } from "@/pages/utility/apiHelper";

const ProjectHeader = ({
  projectDetails,
  isManagerOrAdmin,
  handleOpenEditProjectModal,
  fetchProjectData,
  API_BASE_URL,
  token,
  handleOpenAssigneesModal,
}) => {
  // Check if projectDetails exists to prevent "Cannot read properties of null"
  if (!projectDetails) {
    return (
      <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl animate-pulse h-40">
        Loading details...
      </div>
    );
  }

  const sanitizedProjectDescription = DOMPurify.sanitize(
    projectDetails.project_description || ""
  );
  const projectHasActualDescription =
    sanitizedProjectDescription.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-slate-700 h-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-white">
            {projectDetails.project_name}
          </h1>
          {isManagerOrAdmin && (
            <button
              onClick={handleOpenEditProjectModal}
              className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-full shadow-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              title="Edit Job Name"
            >
              <Edit size={16} className="text-gray-600 dark:text-slate-300" />
            </button>
          )}
        </div>
        <div className="w-full md:w-auto flex justify-end">
          <EditableProjectStatus
            projectId={projectDetails.id}
            currentStatus={projectDetails.status}
            onStatusUpdate={fetchProjectData}
            isEditable={isManagerOrAdmin}
            apiBaseUrl={API_BASE_URL}
            apiPath={getApiBasePathForRole("/update-project-status")}
            token={token}
          />
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Job #{projectDetails.id}
      </p>
      <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            DESCRIPTION
          </h3>
        </div>
        {projectHasActualDescription ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300"
            dangerouslySetInnerHTML={{
              __html: sanitizedProjectDescription,
            }}
          />
        ) : (
          <p className="italic text-slate-500 dark:text-slate-400">
            No description provided.
          </p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div
          className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-xl relative group cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition"
          onClick={handleOpenEditProjectModal}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            DUE DATE
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Icon
              icon="heroicons-outline:calendar"
              className="w-5 h-5 text-slate-500 dark:text-slate-300"
            />
            <p className="text-base font-medium text-slate-700 dark:text-slate-200">
              {projectDetails.due_date
                ? new Date(projectDetails.due_date).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" }
                  )
                : "Not Set"}
            </p>
          </div>
        </div>
        <div
          className="bg-white/50 dark:bg-slate-700/50 p-4 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition"
          onClick={handleOpenAssigneesModal}
        >
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            ASSIGNEES
          </p>
          <div className="flex justify-between items-center mt-2">
            {projectDetails.project_assignees &&
            projectDetails.project_assignees.length > 0 ? (
              <div className="flex -space-x-2">
                {projectDetails.project_assignees
                  .slice(0, 4)
                  .map(({ user }) =>
                    user ? (
                      <img
                        key={user.id}
                        src={
                          user.profile_pic
                            ? getMediaUrl(user.profile_pic)
                            : `https://ui-avatars.com/api/?name=${user.name}&background=random`
                        }
                        alt={user.name}
                        title={user.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                      />
                    ) : null
                  )}
                {projectDetails.project_assignees.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                    +{projectDetails.project_assignees.length - 4}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No one assigned
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
         <NotesContainer
            initialNotes={projectDetails.all_notes || []}
            parentId={projectDetails.id}
            type="project"
          />
      </div>
    </div>
  );
};

export default ProjectHeader;
