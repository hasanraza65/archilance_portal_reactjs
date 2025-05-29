import React, { useEffect, useState } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
// import menu form headless ui
import { MenuItem } from "@headlessui/react";
import ProgressBar from "@/components/ui/ProgressBar";
import { deleteTask, toggleEditModal } from "./store";
import { useDispatch } from "react-redux";
const Task = ({ task }) => {
  const {
    name,
   
    des,
    startDate,
    endDate,
    id,
  } = task;

  const [start, setStart] = useState(new Date(startDate));
  const [end, setEnd] = useState(new Date(endDate));
  const [totaldays, setTotaldays] = useState(0);

  useEffect(() => {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setTotaldays(diffDays);
  }, [start, end]);

  const dispatch = useDispatch();

  return (
    <Card className="cursor-move">
      {/* header */}
      <header className="flex justify-between items-end">
        <div className="flex space-x-4 items-center rtl:space-x-reverse">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name.charAt(0) + name.charAt(1)}
            </div>
          </div>
          <div className="font-medium text-base leading-6">
            <div className="dark:text-slate-200 text-slate-900 max-w-[160px] truncate">
              {name}
            </div>
          </div>
        </div>
        <div>
          <Dropdown
            classMenuItems="w-[130px]"
            label={
              <span className="text-xs inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-900 dark:text-slate-400 focus-visible:outline-none">
                <Icon icon="heroicons-outline:dots-vertical"/>
              </span>
            }
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              <MenuItem
                onClick={() =>
                  dispatch(
                    toggleEditModal({
                      editModal: true,
                      task,
                    })
                  )
                }
              >
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
              <MenuItem onClick={() => dispatch(deleteTask(id))}>
                <div
                  className="hover:bg-slate-900 dark:hover:bg-slate-600/70 hover:text-white
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
        {des}
      </div>
      {/* assignee */}
      <div className="flex space-x-4 rtl:space-x-reverse">
        {/* start date */}
      
        <div>
          <span className="block date-label">Due date</span>
          <span className="block date-text">{endDate}</span>
        </div>
      </div>
    
     
    </Card>
  );
};

export default Task;
