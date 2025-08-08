import React from "react";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import { MenuItem } from "@headlessui/react";
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

// Helper function from your file for consistent styling
const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done")
    return "bg-green-100 text-green-800 border-green-200";
  if (s.includes("progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("pending"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
  if (s.includes("backlog"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
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

const ProjectGrid = ({ project, userRole }) => {
  const {
    id,
    name,
    des,
    startDate,
    endDate,
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
      className="cursor-pointer hover:shadow-lg transition-shadow duration-150 relative"
      onClick={handleCardClick}
    >
      <header className="flex justify-between items-end">
        <div className="flex space-x-4 items-center rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex items-center justify-center font-normal capitalize">
              {name
                ? (name.charAt(0) + (name.charAt(1) || "")).toUpperCase()
                : "NA"}
            </div>
          </div>
          <div className="font-medium text-base leading-6">
            <div
              className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate"
              title={name}
            >
              {name || "Untitled Project"}
            </div>
          </div>
        </div>
        {userRole !== "customer" && (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              classMenuItems="w-[130px]"
              label={
                <span className="text-lg inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-gray-500/10 dark:bg-slate-900 dark:text-slate-400">
                  <Icon icon="heroicons-outline:dots-vertical" />
                </span>
              }
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                <MenuItem as="div">
                  {({ active }) => (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick();
                      }}
                      className={`${
                        active
                          ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200"
                          : "text-slate-600 dark:text-slate-300"
                      } cursor-pointer w-full px-4 py-2 text-sm flex space-x-2 items-center capitalize`}
                    >
                      <span className="text-base">
                        <Icon icon="heroicons:eye" />
                      </span>
                      <span>View</span>
                    </div>
                  )}
                </MenuItem>
                {userRole === "admin" && (
                  <>
                    <MenuItem as="div" disabled={actionsDisabled}>
                      {({ active }) => (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(project);
                          }}
                          className={`${
                            active
                              ? "bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200"
                              : "text-slate-600 dark:text-slate-300"
                          } ${
                            actionsDisabled
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          } w-full px-4 py-2 text-sm flex space-x-2 items-center capitalize`}
                        >
                          <span className="text-base">
                            <Icon icon="heroicons-outline:pencil-alt" />
                          </span>
                          <span>Edit</span>
                        </div>
                      )}
                    </MenuItem>
                    <MenuItem as="div" disabled={isDeleting}>
                      {({ active }) => (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project.id, project.name);
                          }}
                          className={`${
                            active
                              ? "bg-red-500/20 text-red-600"
                              : "text-red-500"
                          } ${
                            isDeleting
                              ? "opacity-50 cursor-not-allowed"
                              : "cursor-pointer"
                          } w-full px-4 py-2 text-sm flex space-x-2 items-center capitalize`}
                        >
                          <span className="text-base">
                            <Icon icon="heroicons-outline:trash" />
                          </span>
                          <span>Delete</span>
                        </div>
                      )}
                    </MenuItem>
                  </>
                )}
              </div>
            </Dropdown>
          </div>
        )}
      </header>

      {status && (
        <div className="mt-4">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${getStatusClass(
              status
            )}`}
          >
            {status}
          </span>
        </div>
      )}

      <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-6 min-h-[50px] break-words prose prose-sm max-w-none dark:prose-invert">
        {hasActualContent ? (
          <div dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }} />
        ) : (
          <p>No description provided.</p>
        )}
      </div>

      <div className="flex justify-between items-end">
        <div className="flex space-x-4 rtl:space-x-reverse">
          <div>
            <span className="block text-slate-400 text-xs font-normal mb-0.5">
              Start date
            </span>
            <span className="block text-slate-600 dark:text-slate-300 font-medium text-sm">
              {formatDate(startDate)}
            </span>
          </div>
          <div>
            <span className="block text-slate-400 text-xs font-normal mb-0.5">
              End date
            </span>
            <span className="block text-slate-600 dark:text-slate-300 font-medium text-sm">
              {formatDate(endDate)}
            </span>
          </div>
        </div>
        {project_assignees && project_assignees.length > 0 && (
          <div
            className="flex items-center cursor-pointer"
            onClick={handleOpenAssigneesModal}
          >
            {project_assignees
              .slice(0, 3)
              .map(
                (assignee) =>
                  assignee.user && (
                    <Avatar key={assignee.id} user={assignee.user} />
                  )
              )}
            {project_assignees.length > 3 && (
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 ring-2 ring-white dark:ring-slate-800 flex items-center justify-center text-xs font-bold -ml-2">
                +{project_assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProjectGrid;
