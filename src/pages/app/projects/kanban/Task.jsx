import React from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Menu } from "@headlessui/react";
import DOMPurify from 'dompurify';
import { useNavigate } from "react-router-dom";
import { deleteTaskFromBackend } from "./store";
import { useDispatch } from "react-redux";

import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const Task = ({ task, onOpenEditModal }) => { 
  const {
    name = "Untitled Task",
    des = "",
    endDate,
    id: frontendId, 
    apiData,  
  } = task || {};

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const backendTaskId = apiData?.id;
  const taskIdForNavigation = backendTaskId || frontendId;

  const sanitizedDescription = DOMPurify.sanitize(des);
  const hasActualDescription = sanitizedDescription.replace(/<[^>]*>/g, '').trim().length > 0;

  const handleEdit = () => {
    if (onOpenEditModal) {
      onOpenEditModal(task);
    } else {
      console.error("Task.jsx: onOpenEditModal prop is not defined!");
      Swal.fire("Error", "Edit function not available.", "error");
    }
  };

  const handleDelete = () => {
    if (frontendId === undefined) {
      console.error("Task.jsx: Cannot delete task, frontend ID (task.id) is undefined.", task);
      Swal.fire("Error!", "Task data is incomplete. Cannot delete.", "error");
      return;
    }

    if (backendTaskId === undefined) {
      console.error("Task.jsx: Cannot delete task from backend, backend ID (apiData.id) is missing.", task);
      Swal.fire(
        "Error!",
        "Task's server ID is missing. Deletion from server failed. Try refreshing.",
        "error"
      );
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: 'dark:bg-slate-800 dark:text-slate-200',
        title: 'dark:text-slate-100',
        htmlContainer: 'dark:text-slate-300',
      }
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(
          deleteTaskFromBackend({
            backendTaskId: backendTaskId, 
            frontendTaskId: frontendId, 
          })
        );
      }
    });
  };

  const handleViewDetails = () => {
    if (taskIdForNavigation) {
      navigate(`/task/${taskIdForNavigation}`);
    } else {
      console.error("Task.jsx: Cannot view task details, Task ID for navigation is missing.", task);
      Swal.fire("Error", "Cannot open task details: Task ID is missing.", "error");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      console.warn("Invalid date string for formatDate:", dateString, e);
      return "Invalid Date";
    }
  };

  if (!task || frontendId === undefined) {
    return (
      <Card className="bg-red-100 dark:bg-red-900 p-3">
        <p className="text-red-600 dark:text-red-300 text-sm">
          Invalid task data (frontend ID missing).
        </p>
      </Card>
    );
  }

  return (
    <Card className="cursor-move group dark:bg-slate-800">
      <header className="flex justify-between items-start">
        <div className="flex space-x-4 items-center rtl:space-x-reverse flex-1 min-w-0">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name && name.length >= 2
                ? name.charAt(0) + name.charAt(1)
                : name
                ? name.charAt(0)
                : "T"}
            </div>
          </div>
          <div className="font-medium text-base leading-6 flex-1 min-w-0">
            <div
              className="dark:text-slate-200 text-slate-900 truncate"
              title={name}
            >
              {name}
            </div>
          </div>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="text-xs inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Icon icon="heroicons-outline:dots-vertical" />
              </Menu.Button>
            </div>
            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-slate-100 dark:divide-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1 ">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleViewDetails}
                      className={`${
                        active
                          ? "bg-slate-700 dark:bg-slate-600 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                      disabled={!taskIdForNavigation}
                    >
                      <Icon icon="heroicons-outline:eye" className="h-5 w-5" />
                      <span>View Details</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1"> 
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleEdit} 
                      className={`${
                        active
                          ? "bg-blue-500 text-white" 
                          : "text-slate-700 dark:text-slate-300"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                    
                      disabled={!onOpenEditModal || !task || frontendId === undefined}
                    >
                      <Icon icon="heroicons-outline:pencil-alt" className="h-5 w-5" />
                      <span>Edit Project</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleDelete}
                      className={`${
                        active
                          ? "bg-red-500 text-white"
                          : "text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                      disabled={!backendTaskId || frontendId === undefined}
                    >
                      <Icon
                        icon="heroicons-outline:trash"
                        className="h-5 w-5"
                      />
                      <span>Delete</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </header>

      {hasActualDescription ? (
        <div
          className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-6 prose prose-sm max-w-none dark:prose-invert line-clamp-3"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      ) : (
        <div className="text-slate-500 dark:text-slate-500 text-sm pt-4 pb-6 italic">
          No description.
        </div>
      )}

      <div className="flex justify-between items-end pt-2 mt-auto border-t border-slate-100 dark:border-slate-700">
        <div></div> 
        {endDate && (
          <div className="text-right">
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Due date
            </span>
            <span className="block text-sm text-slate-700 dark:text-slate-300">
              {formatDate(endDate)}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Task;