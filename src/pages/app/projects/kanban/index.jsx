import React, { useEffect } from "react";
import Button from "@/components/ui/Button";
import Tooltip from "@/components/ui/Tooltip";
import Icon from "@/components/ui/Icon";

import { useSelector, useDispatch } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  sort,
  toggleColumnModal,
  deleteColumnBoard,
  toggleTaskModal,
  fetchKanbanData,
} from "./store"; // Or your actual slice path e.g. "./appKanbanSlice"
import Task from "./Task";
import AddColumn from "./AddColumn";
import AddTaskModal from "./AddTaskModal";
import { ToastContainer } from "react-toastify";
import EditTaskModal from "./EditTask";
import { useParams } from "react-router-dom";

const KanbanPage = () => {
  const { columns, taskModal, isLoading, error } = useSelector(
    (state) => state.kanban
  );
  const dispatch = useDispatch();
  const { id: projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      console.log(
        "KanbanPage: Dispatching fetchKanbanData for project ID:",
        projectId
      );
      dispatch(fetchKanbanData(projectId));
    }
  }, [dispatch, projectId]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      return;
    }
    dispatch(sort({ source, destination, draggableId, type }));
  };

  if (isLoading) {
    return <div className="text-center p-10">Loading Kanban board...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-500">
        Error loading Kanban board: {error}
      </div>
    );
  }

  if (!isLoading && columns && columns.length === 0 && projectId) {
    console.log("KanbanPage: columns array is empty after fetch attempt.");
    // You could show a "No tasks found for this project" message here
  }

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Kanban Board
        </h4>
        <div className="flex space-x-4 justify-end items-center rtl:space-x-reverse">
          <Button
            icon="heroicons-outline:plus"
            text="Add Board"
            className="bg-slate-800 dark:hover:bg-opacity-70 h-min text-sm font-medium text-slate-50 hover:ring-2 hover:ring-opacity-80 ring-slate-900 hover:ring-offset-1 dark:hover:ring-0 dark:hover:ring-offset-0"
            iconclassName="text-lg"
            onClick={() => dispatch(toggleColumnModal(true))}
          />
        </div>
      </div>

      <div>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" direction="horizontal" type="list">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-6 overflow-hidden overflow-x-auto pb-4 rtl:space-x-reverse"
              >
                {columns?.map((column, i) => {
                  return (
                    <Draggable
                      key={String(column.id)}
                      draggableId={String(column.id)}
                      index={i}
                    >
                      {(providedDraggable, snapshotDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                        >
                          <div
                            className={`w-[320px] flex-none h-full rounded transition-all duration-100 ${
                              snapshotDraggable.isDragging
                                ? "shadow-xl bg-primary-300"
                                : "shadow-none bg-slate-200 dark:bg-slate-700"
                            }`}
                          >
                            <div
                              className="relative flex justify-between items-center bg-white dark:bg-slate-800 rounded shadow-base px-6 py-5"
                              {...providedDraggable.dragHandleProps}
                            >
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[2px]"
                                style={{
                                  backgroundColor: column.color,
                                }}
                              ></div>
                              <div className="text-lg text-slate-900 dark:text-white font-medium capitalize">
                                {column.name}
                              </div>
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Tooltip
                                  placement="top"
                                  theme="danger"
                                  content="Delete Board"
                                >
                                  <button
                                    className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600"
                                    onClick={() =>
                                      dispatch(deleteColumnBoard(column.id))
                                    }
                                  >
                                    <Icon icon="heroicons-outline:trash" />
                                  </button>
                                </Tooltip>

                                <Tooltip placement="top" content="Add Card">
                                  <button
                                    className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600"
                                    onClick={() =>
                                      dispatch(
                                        toggleTaskModal({
                                          open: true,
                                          columnId: column.id,
                                        })
                                      )
                                    }
                                  >
                                    <Icon icon="heroicons-outline:plus-sm" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                            <Droppable
                              droppableId={String(column.id)}
                              type="task"
                              direction="vertical"
                            >
                              {(providedDroppable, snapshotDroppable) => (
                                <div
                                  ref={providedDroppable.innerRef}
                                  {...providedDroppable.droppableProps}
                                  className={`px-2 py-4 h-full min-h-[100px] space-y-4  ${
                                    snapshotDroppable.isDraggingOver
                                      ? "bg-primary-400/50"
                                      : ""
                                  }`}
                                >
                                  {column.tasks?.map((task, j) => (
                                    <Draggable
                                      key={String(task.id)}
                                      draggableId={String(task.id)}
                                      index={j}
                                    >
                                      {(providedTask) => (
                                        <div
                                          ref={providedTask.innerRef}
                                          {...providedTask.draggableProps}
                                          {...providedTask.dragHandleProps}
                                        >
                                          <Task
                                            task={task}
                                            columnId={column.id}
                                          />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {providedDroppable.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <AddColumn />
      {taskModal && <AddTaskModal />}
      <EditTaskModal />
    </div>
  );
};

export default KanbanPage;
