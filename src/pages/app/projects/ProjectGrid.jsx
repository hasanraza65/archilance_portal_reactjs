import React from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  deleteProjectAPI,
  setEditModalAndItem,
  toggleUpdateAssigneesModal,
} from "./store";
import Swal from "sweetalert2";
import DOMPurify from "dompurify";

// Helper function for status badge styling
const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done") return "bg-green-100 text-green-800";
  if (s.includes("progress")) return "bg-blue-100 text-blue-800";
  if (s.includes("pending")) return "bg-yellow-100 text-yellow-800";
  if (s.includes("cancel")) return "bg-red-100 text-red-800";
  if (s.includes("backlog")) return "bg-purple-100 text-purple-800";
  return "bg-slate-100 text-slate-800";
};

// Helper function for the status-colored top border
const getStatusBorderClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done") return "border-t-green-500";
  if (s.includes("progress")) return "border-t-blue-500";
  if (s.includes("pending")) return "border-t-yellow-500";
  if (s.includes("cancel")) return "border-t-red-500";
  if (s.includes("backlog")) return "border-t-purple-500";
  return "border-t-slate-300";
};

const Avatar = ({ user }) => {
  const initials = user.name ? user.name.charAt(0).toUpperCase() : "U";
  const avatarUrl = user.profile_pic
    ? `${import.meta.env.VITE_BACKEND_BASE_URL}/storage/${user.profile_pic}`
    : null;
  return (
    <div
      title={user.name}
      className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 -ml-2 first:ml-0"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.name}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

// +++ CHANGE #1: Add 'employeeType' to the component's props +++
const ProjectGrid = ({ project, userRole, employeeType }) => {
  const {
  id,
  name,
  customer,
  project_description: des, 
  start_date: startDate,    
  due_date: endDate,        
  status,
  project_assignees = [],
} = project;
  const dispatch = useDispatch();
  const { isDeleting, isUpdating } = useSelector((state) => state.project);
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (!id) return;
    if (userRole === "customer" || userRole === "member") {
      navigate(`/order-details/${id}`);
    } else {
      navigate(`/jobs/${id}`);
    }
  };

  const handleOpenAssigneesModal = (e) => {
    e.stopPropagation();
    dispatch(toggleUpdateAssigneesModal({ open: true, project }));
  };
  const handleEditClick = (proj) => {
    dispatch(setEditModalAndItem({ open: true, project: proj }));
  };

  const handleDeleteClick = (projectId, projectName) => {
    Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${projectName || "this project"}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProjectAPI(projectId))
          .unwrap()
          .then(() =>
            Swal.fire(
              "Deleted!",
              `Project "${projectName}" has been deleted.`,
              "success"
            )
          )
          .catch((error) =>
            Swal.fire(
              "Failed!",
              `Could not delete. ${error || "Try again."}`,
              "error"
            )
          );
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime())
        ? "Invalid Date"
        : d.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    } catch (e) {
      return "Invalid Date";
    }
  };
  
  const sanitizedDescriptionHtml = DOMPurify.sanitize(des || "");
  const hasActualContent =
    sanitizedDescriptionHtml.replace(/<[^>]*>/g, "").trim().length > 0;
  const actionsDisabled = isDeleting || isUpdating;

  return (
    <Card
      bodyClass="p-0"
      className={`
        group relative cursor-pointer border-t-4 hover:shadow-xl transition-all duration-300 ease-in-out
        ${getStatusBorderClass(status)}
      `}
      onClick={handleCardClick}
    >
      <div className="p-6 flex flex-col h-full">
        {userRole !== "customer" && (
          <div
            className="absolute top-4 right-4 flex items-center space-x-1 rtl:space-x-reverse
                       opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="View Project"
              onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
              className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            >
              <Icon icon="heroicons:eye" />
            </button>
            
                       {/* Edit Button ki Condition */}
            {(userRole === "admin" || employeeType === "Manager" || userRole === "employee") && (
                <button
                  type="button"
                  title="Edit Project"
                  disabled={actionsDisabled}
                  onClick={(e) => { e.stopPropagation(); handleEditClick(project); }}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="heroicons-outline:pencil-alt" />
                </button>
            )}
            
            {/* Delete Button ki Condition */}
            {(userRole === "admin" || employeeType === "Manager") && (
                <button
                  type="button"
                  title="Delete Project"
                  disabled={isDeleting}
                  onClick={(e) => { e.stopPropagation(); handleDeleteClick(id, name); }}
                  className="h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200 bg-red-100 text-red-500 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="heroicons-outline:trash" />
                </button>
            )}
          </div>
        )}

        <header>
          <h4 className="font-bold text-lg leading-6 text-slate-900 dark:text-white truncate" title={name}>
            {name || "Untitled Project"}
          </h4>
          {customer?.name && (
            <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 truncate">
              {customer.name}
            </div>
          )}
        </header>

        <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 flex-grow break-words prose prose-sm max-w-none dark:prose-invert">
          {hasActualContent ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }} />
          ) : (
            <p className="italic text-slate-400">No description provided.</p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <div className="flex justify-between items-end">
            {status && (
              <div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusClass(status)}`}>
                  {status}
                </span>
              </div>
            )}
            {project_assignees && project_assignees.length > 0 && (
              <div
                className="flex items-center"
                title={`Assigned to: ${project_assignees.map(a => a.user?.name).join(', ')}`}
                onClick={handleOpenAssigneesModal}
              >
                {project_assignees.slice(0, 3).map((assignee) =>
                  assignee.user && <Avatar key={assignee.id} user={assignee.user} />
                )}
                {project_assignees.length > 3 && (
                  <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold -ml-2">
                    +{project_assignees.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex space-x-6 rtl:space-x-reverse mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div>
              <span className="block text-slate-400 text-xs font-normal mb-0.5">Start date</span>
              <span className="block text-slate-600 dark:text-slate-300 font-medium text-sm">
                {formatDate(startDate)}
              </span>
            </div>
            <div>
              <span className="block text-slate-400 text-xs font-normal mb-0.5">End date</span>
              <span className="block text-slate-600 dark:text-slate-300 font-medium text-sm">
                {formatDate(endDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProjectGrid;