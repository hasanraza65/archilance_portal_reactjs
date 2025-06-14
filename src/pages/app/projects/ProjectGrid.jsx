import React from "react";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import { MenuItem } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteProjectAPI, setEditModalAndItem } from "./store";
import Swal from 'sweetalert2';
import DOMPurify from 'dompurify';
import { getApiPrefix } from "@/pages/utility/apiHelper"; // --- CHANGE IS HERE ---

const ProjectGrid = ({ project }) => {
  const { id, name, des, startDate, endDate } = project;
  const dispatch = useDispatch();
  const { isDeleting, isUpdating } = useSelector(state => state.project);
  const navigate = useNavigate();
  const userRole = getApiPrefix(); // --- CHANGE IS HERE ---

  const handleCardNavigation = () => id && navigate(`/projects/${id}`);
  const handleViewClick = (proj) => proj?.id && navigate(`/projects/${proj.id}`);
  const handleEditClick = (proj) => {
    dispatch(setEditModalAndItem({ open: true, project: proj }));
  };

  const handleDeleteClick = (projectId, projectName) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the project "${projectName || 'this project'}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProjectAPI(projectId)).unwrap()
          .then(() => { Swal.fire('Deleted!', `Project "${projectName || 'this project'}" has been deleted.`, 'success'); })
          .catch((error) => { Swal.fire('Failed!', `Could not delete project. ${error || 'Please try again.'}`, 'error'); });
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return "Invalid Date";
    }
  };

  const sanitizedDescriptionHtml = DOMPurify.sanitize(des || "");
  const hasActualContent = sanitizedDescriptionHtml.replace(/<[^>]*>/g, '').trim().length > 0;
  const actionsDisabled = isDeleting || isUpdating;

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-150" onClick={handleCardNavigation}>
      <header className="flex justify-between items-end">
        <div className="flex space-x-4 items-center rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {(name ? (name.charAt(0) + (name.charAt(1) || "")).toUpperCase() : "NA")}
            </div>
          </div>
          <div className="font-medium text-base leading-6">
            <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate" title={name}>
              {name || "Untitled Project"}
            </div>
          </div>
        </div>
        {/* --- CHANGE IS HERE: Conditionally render the entire actions dropdown --- */}
        {userRole !== 'employee' && userRole !== 'customer' && (
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
                <MenuItem as="div" disabled={actionsDisabled}>
                  {({ active }) => (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleViewClick(project); }}
                      className={`${active ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}
                      ${actionsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse`}
                    >
                      <span className="text-base"><Icon icon="heroicons:eye" /></span>
                      <span>View</span>
                    </div>
                  )}
                </MenuItem>
                <MenuItem as="div" disabled={actionsDisabled}>
                  {({ active }) => (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleEditClick(project); }}
                      className={`${active ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}
                      ${actionsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse`}
                    >
                      <span className="text-base"><Icon icon="heroicons-outline:pencil-alt" /></span>
                      <span>Edit</span>
                    </div>
                  )}
                </MenuItem>
                <MenuItem as="div" disabled={isDeleting}>
                  {({ active }) => (
                    <div
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(project.id, project.name); }}
                      className={`${active ? "bg-red-500 bg-opacity-20 text-red-600 dark:text-red-400 dark:bg-opacity-30" : "text-red-500 dark:text-red-400"}
                      ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse`}
                    >
                      <span className="text-base"><Icon icon="heroicons-outline:trash" /></span>
                      <span>Delete</span>
                    </div>
                  )}
                </MenuItem>
              </div>
            </Dropdown>
          </div>
        )}
      </header>

      <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-6 min-h-[50px] break-words prose prose-sm max-w-none dark:prose-invert">
        {hasActualContent ? <div dangerouslySetInnerHTML={{ __html: sanitizedDescriptionHtml }} /> : <p>No description provided.</p>}
      </div>

      <div className="flex space-x-4 rtl:space-x-reverse mt-4">
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-xs font-normal mb-0.5">Start date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">{formatDate(startDate)}</span>
        </div>
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-xs font-normal mb-0.5">End date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">{formatDate(endDate)}</span>
        </div>
      </div>
    </Card>
  );
};

export default ProjectGrid;