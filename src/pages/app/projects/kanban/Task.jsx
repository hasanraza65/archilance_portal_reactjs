import React, { useEffect, useState } from "react";
import Dropdown from "@/components/ui/Dropdown"; // Your custom Dropdown
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import { Menu } from "@headlessui/react"; // Using Headless UI Menu directly for clarity
import { deleteTask } from "./store";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const Task = ({ task }) => {
  const {
    name = "Untitled Task",
    des = "No description.",
    startDate,
    endDate,
    id,
    apiData,
  } = task || {};

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const taskIdForNavigation = apiData?.id || id;

  const handleEdit = () => {
    if (taskIdForNavigation) {
      navigate(`/task/${taskIdForNavigation}`);
    } else {
      console.error("Task.jsx: Cannot navigate to edit task, ID is missing or invalid.", task);
    }
  };

  const handleDelete = () => {
    if (id !== undefined) {
      dispatch(deleteTask(id));
    } else {
      console.error("Task.jsx: Cannot delete task, ID is undefined.", task);
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (!task || id === undefined) {
    return (
        <Card className="bg-red-50 p-3">
            <p className="text-red-600 text-sm">Invalid task data provided.</p>
        </Card>
    );
  }

  return (
    <Card className="cursor-move group">
      <header className="flex justify-between items-start">
        <div className="flex space-x-4 items-center rtl:space-x-reverse flex-1 min-w-0">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name && name.length >= 2 ? name.charAt(0) + name.charAt(1) : (name ? name.charAt(0) : 'N/A')}
            </div>
          </div>
          <div className="font-medium text-base leading-6 flex-1 min-w-0">
            <div className="dark:text-slate-200 text-slate-900 truncate" title={name}>
              {name}
            </div>
          </div>
        </div>
        <div>
          {/* Using Headless UI Menu directly */}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="text-xs inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <Icon icon="heroicons-outline:dots-vertical"/>
              </Menu.Button>
            </div>
            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-slate-100 dark:divide-slate-700 rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1 "> {/* This div is often used for padding around items */}
                <Menu.Item>
                  {({ active }) => ( // Children as a function to get active state
                    <button
                      onClick={handleEdit}
                      className={`${
                        active ? 'bg-slate-900 dark:bg-slate-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                    >
                      <Icon icon="heroicons-outline:eye" className="h-5 w-5" />
                      <span>View</span>
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
                        active ? 'bg-slate-900 dark:bg-slate-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                    >
                      <Icon icon="heroicons-outline:trash" className="h-5 w-5" />
                      <span>Delete</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </header>
      {des && (
        <div className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-6 line-clamp-3" title={des}>
            {des}
        </div>
      )}
      <div className="flex justify-between items-end pt-2 mt-auto border-t border-slate-100 dark:border-slate-700">
        <div></div>
        {endDate && (
            <div>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Due date</span>
            <span className="block text-sm text-slate-700 dark:text-slate-300">{formatDate(endDate)}</span>
            </div>
        )}
      </div>
    </Card>
  );
};

export default Task;