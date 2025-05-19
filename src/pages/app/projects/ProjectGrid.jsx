import React, { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import { MenuItem } from "@headlessui/react";
import Icon from "@/components/ui/Icon";
import ProgressBar from "@/components/ui/ProgressBar";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeProject, updateProject } from "./store";

const ProjectGrid = ({ project }) => {
  const { id, name, progress, status, members, assignee, des, startDate, endDate } = project;
  const dispatch = useDispatch();

  const [start, setStart] = useState(new Date(startDate));
  const [end, setEnd] = useState(new Date(endDate));
  const [totaldays, setTotaldays] = useState(0);

  useEffect(() => {
    if (startDate && endDate) {
      try {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setTotaldays(diffDays);
      } catch (err) {
        console.error("Error calculating dates:", err);
        setTotaldays(0);
      }
    }
  }, [start, end]);

  const navigate = useNavigate();
  
  // handleClick to view project single page
  const handleClick = (project) => {
    navigate(`/projects/${project.id}`);
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  return (
    <Card>
      {/* header */}
      <header className="flex justify-between items-end">
        <div className="flex space-x-4 items-center rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name ? (name.charAt(0) + (name.charAt(1) || "")) : "NA"}
            </div>
          </div>
          <div className="font-medium text-base leading-6">
            <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate">
              {name || "Untitled Project"}
            </div>
          </div>
        </div>
        <div>
          <Dropdown
            classMenuItems=" w-[130px]"
            label={
              <span className="text-lg inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-gray-500/15 dark:bg-slate-900 dark:text-slate-400">
                <Icon icon="heroicons-outline:dots-vertical" />
              </span>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-700!">
              <MenuItem onClick={() => handleClick(project)}>
                <div
                  className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white
                   w-full px-4 py-2 text-sm dark:text-slate-300  last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex  space-x-2 items-center
                     capitalize rtl:space-x-reverse"
                >
                  <span className="text-base">
                    <Icon icon="heroicons:eye" />
                  </span>
                  <span>View</span>
                </div>
              </MenuItem>
              <MenuItem onClick={() => dispatch(updateProject(project))}>
                <div
                  className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white
                   w-full px-4 py-2 text-sm dark:text-slate-300  last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex  space-x-2 items-center
                     capitalize rtl:space-x-reverse"
                >
                  <span className="text-base">
                    <Icon icon="heroicons-outline:pencil-alt" />
                  </span>
                  <span>Edit</span>
                </div>
              </MenuItem>
              <MenuItem onClick={() => dispatch(removeProject(project.id))}>
                <div
                  className="hover:bg-slate-900 dark:hover:bg-slate-600 dark:hover:bg-opacity-70 hover:text-white
                   w-full px-4 py-2 text-sm dark:text-slate-300  last:mb-0 cursor-pointer first:rounded-t last:rounded-b flex  space-x-2 items-center
                     capitalize rtl:space-x-reverse"
                >
                  <span className="text-base">
                    <Icon icon="heroicons-outline:trash" />
                  </span>
                  <span>Delete</span>
                </div>
              </MenuItem>
            </div>
          </Dropdown>
        </div>
      </header>
      {/* description */}
      <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-8">
        {des || "No description provided"}
      </div>
      {/* dates */}
      <div className="flex space-x-4 rtl:space-x-reverse">
        {/* start date */}
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-sm font-normal mb-1">Start date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">
            {formatDate(startDate)}
          </span>
        </div>
        {/* end date */}
        <div>
          <span className="block date-label text-slate-400 dark:text-slate-400 text-sm font-normal mb-1">End date</span>
          <span className="block date-text text-slate-600 dark:text-slate-300 font-medium text-sm">
            {formatDate(endDate)}
          </span>
        </div>
      </div>
      {/* progress bar */}
      {/* <div className="mt-6">
        <div className="ltr:text-right rtl:text-left text-xs text-slate-600 dark:text-slate-300 mb-1 font-medium">
          {progress || 0}%
        </div>
        <ProgressBar value={progress || 0} className="bg-primary-500" />
      </div> */}
      {/* assignee and total date */}
      {/* <div className="grid grid-cols-2 gap-4 mt-6">
      
        <div>
          <div className="text-slate-400 dark:text-slate-400 text-sm font-normal mb-3">
            Assigned to
          </div>
          <div className="flex justify-start -space-x-1.5 rtl:space-x-reverse">
            {assignee && assignee.map((user, userIndex) => (
              <div
                className="h-6 w-6 rounded-full ring-1 ring-slate-100"
                key={userIndex}
              >
                <img
                  src={user.image}
                  alt={user.label}
                  className="w-full h-full rounded-full"
                />
              </div>
            ))}
            {assignee && assignee.length > 0 && (
              <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-300 text-xs ring-2 ring-slate-100 dark:ring-slate-700! rounded-full h-6 w-6 flex flex-col justify-center items-center">
                +{assignee.length > 2 ? assignee.length - 2 : 0}
              </div>
            )}
          </div>
        </div>

      
        <div className="ltr:text-right rtl:text-left">
          <span className="inline-flex items-center space-x-1 bg-danger-500/15 text-danger-500 text-xs font-normal px-2 py-1 rounded-full rtl:space-x-reverse">
            <span>
              <Icon icon="heroicons-outline:clock" />
            </span>
            <span>{totaldays}</span>
            <span>days left</span>
          </span>
        </div>
      </div> */}
    </Card>
  );
};

export default ProjectGrid;