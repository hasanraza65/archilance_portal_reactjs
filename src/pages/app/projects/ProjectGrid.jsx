import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import { MenuItem } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
// ProgressBar is imported but not used in the provided JSX. Will keep it if needed later.
// import ProgressBar from "@/components/ui/ProgressBar";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { deleteProjectAPI, updateProject } from "./store"; // 'updateProject' is for initiating edit

// Import SweetAlert2
import Swal from 'sweetalert2';
// Import SweetAlert2 CSS.
// It's often better to import this in a global CSS file (e.g., App.css, index.css)
// or your main application entry point (e.g., main.jsx or App.jsx)
// to ensure styles are loaded correctly and only once.
// If you choose to import it here, ensure your bundler handles CSS imports.
// For example: import 'sweetalert2/dist/sweetalert2.min.css';
// If you are using Tailwind, you might want to use SweetAlert2's theming capabilities
// or use a Tailwind-compatible SweetAlert2 plugin if one exists.
// For now, let's assume the CSS is globally available or you'll add the import.


const ProjectGrid = ({ project }) => {
  const { id, name, progress = 0, des, startDate, endDate, members } = project;
  const dispatch = useDispatch();
  const { isDeleting } = useSelector(state => state.project);
  const navigate = useNavigate();

  // Local state for dates (can be simplified if not strictly needed for calculations in this component)
  const [start, setStart] = useState(startDate ? new Date(startDate) : null);
  const [end, setEnd] = useState(endDate ? new Date(endDate) : null);
  const [_totaldays, setTotaldays] = useState(0); // Renamed to avoid conflict if API provides totaldays

  useEffect(() => {
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
      try {
        const diffTime = Math.abs(end.getTime() - start.getTime()); // Use getTime() for robust comparison
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTotaldays(diffDays);
      } catch (err) {
        // console.error("Error calculating date difference in ProjectGrid:", err);
        setTotaldays(0);
      }
    } else {
        setTotaldays(0);
    }
  }, [start, end]);

  useEffect(() => { // Sync local date state if project prop changes
    setStart(startDate ? new Date(startDate) : null);
    setEnd(endDate ? new Date(endDate) : null);
  }, [startDate, endDate]);

  // Navigate to project detail page when card is clicked
  const handleCardNavigation = () => {
    if (id) {
      navigate(`/projects/${id}`);
    }
  };

  // Handler for "View" action from dropdown (keeps existing functionality)
  const handleViewClick = (proj) => {
    if (proj && proj.id) {
      navigate(`/projects/${proj.id}`);
    }
  };

  const handleEditClick = (proj) => {
    dispatch(updateProject(proj)); // Dispatches action to set editItem and open editModal
  };

  const handleDeleteClick = (projectId, projectName) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the project "${projectName || 'this project'}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Red color for delete button
      cancelButtonColor: '#3085d6', // Blue color for cancel button (optional, can be default)
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      // Custom class for theming if needed, e.g., for dark mode
      // customClass: {
      //   popup: 'dark:bg-slate-800 dark:text-slate-200',
      //   title: 'dark:text-slate-100',
      //   htmlContainer: 'dark:text-slate-300',
      //   confirmButton: 'your-confirm-button-tailwind-classes',
      //   cancelButton: 'your-cancel-button-tailwind-classes',
      // },
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteProjectAPI(projectId))
          .unwrap() // Use unwrap if your thunk is created with createAsyncThunk for better promise handling
          .then(() => {
            Swal.fire(
              'Deleted!',
              `Project "${projectName || 'this project'}" has been deleted.`,
              'success'
            );
          })
          .catch((error) => {
            // console.error("Deletion failed:", error);
            Swal.fire(
              'Failed!',
              `Could not delete project "${projectName || 'this project'}". ${error?.message || 'Please try again.'}`,
              'error'
            );
          });
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric"
      });
    } catch (err) {
      // console.error("Error formatting date in ProjectGrid:", err, dateString);
      return "Invalid Date";
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-150"
      onClick={handleCardNavigation} // Make the entire card clickable
    >
      <header className="flex justify-between items-end">
        <div className="flex space-x-4 items-center rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name ? (name.charAt(0) + (name.charAt(1) || "")).toUpperCase() : "NA"}
            </div>
          </div>
          <div className="font-medium text-base leading-6">
            <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate" title={name}>
              {name || "Untitled Project"}
            </div>
          </div>
        </div>
        {/* Wrapper div for Dropdown to stop event propagation */}
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
              <MenuItem disabled={isDeleting}>
                {({ active }) => (
                  <div
                    onClick={(e) => { e.stopPropagation(); handleViewClick(project); }}
                    className={`${active ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}
                     ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                     w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse`}
                  >
                    <span className="text-base"><Icon icon="heroicons:eye" /></span>
                    <span>View</span>
                  </div>
                )}
              </MenuItem>
              <MenuItem disabled={isDeleting}>
                {({ active }) => (
                  <div
                    onClick={(e) => { e.stopPropagation(); handleEditClick(project); }} // Stop propagation
                    className={`${active ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-200" : "text-slate-600 dark:text-slate-300"}
                    ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                     w-full px-4 py-2 text-sm last:mb-0 first:rounded-t last:rounded-b flex space-x-2 items-center capitalize rtl:space-x-reverse`}
                  >
                    <span className="text-base"><Icon icon="heroicons-outline:pencil-alt" /></span>
                    <span>Edit</span>
                  </div>
                )}
              </MenuItem>
              <MenuItem disabled={isDeleting}>
                 {({ active }) => (
                  <div
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(project.id, project.name); }} // Stop propagation
                    className={`${active ? "bg-red-500 bg-opacity-20 text-white" : "text-red-500"}
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
      </header>
      <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-6 min-h-[50px] break-words">
        {des || "No description provided."}
      </div>

      <div className="flex space-x-4 rtl:space-x-reverse mt-4">
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-xs font-normal mb-0.5">Start date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">
            {formatDate(startDate)}
          </span>
        </div>
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-xs font-normal mb-0.5">End date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">
            {formatDate(endDate)}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProjectGrid;