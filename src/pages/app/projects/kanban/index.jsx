// src/pages/app/projects/kanban/KanbanPage.jsx
import React, { useEffect } from "react";
import Button from "../../../../components/ui/Button"; // Adjust path if needed
import Tooltip from "../../../../components/ui/Tooltip"; // Adjust path if needed
import Icon from "../../../../components/ui/Icon"; // Adjust path if needed

import { useSelector, useDispatch } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  sort,
  toggleColumnModal,
  deleteColumnBoard,
  toggleTaskModal, // Kept for AddTaskModal
  fetchKanbanData,
  updateTaskStatusInBackend,
  STATUS_TO_COLUMN_MAP,
} from "./store";

// ***** VERIFY THIS PATH TO YOUR REDUX STORE *****
import store from "@/store/index"; // This path was marked for verification

import Task from "./Task"; 
import AddColumn from "./AddColumn";
import AddTaskModal from "./AddTaskModal"; // For adding new tasks
import { toast, ToastContainer } from "react-toastify";
import { useParams } from "react-router-dom";

const KanbanPage = () => {
  const { columns, taskModal, isLoading, error } = useSelector(
    (state) => state.kanban
  );
  const dispatch = useDispatch();
  const { id: projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      dispatch(fetchKanbanData(projectId));
    } else {
      // console.warn("KanbanPage: No projectId, cannot fetch data."); // Keep for debugging if needed
    }
  }, [dispatch, projectId]);

  const onDragEnd = (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    let taskBeingMovedApiData = null;
    if (type === "task") {
      const sourceCol = columns.find(
        (col) => String(col.id) === String(source.droppableId)
      );
      if (
        sourceCol &&
        sourceCol.tasks &&
        sourceCol.tasks[source.index] &&
        sourceCol.tasks[source.index].apiData
      ) {
        taskBeingMovedApiData = { ...sourceCol.tasks[source.index].apiData };
      } else {
        // console.warn(`KanbanPage (onDragEnd): Could not find task's apiData prior to sort. DraggableId: ${draggableId}`);
      }
    }

    dispatch(sort({ source, destination, draggableId, type }));

    if (
      type === "task" &&
      String(source.droppableId) !== String(destination.droppableId)
    ) {
      if (taskBeingMovedApiData && taskBeingMovedApiData.id) {
        let latestGlobalState;
        try {
          if (!store || typeof store.getState !== "function") {
            console.error(
              "KanbanPage (onDragEnd): CRITICAL - 'store' is undefined or not a valid store object. Check import path for 'store'."
            );
            toast.error(
              "Application error: Cannot access state. Please check console and refresh."
            );
            return;
          }
          latestGlobalState = store.getState();
        } catch (e) {
          console.error(
            "KanbanPage (onDragEnd): CRITICAL ERROR during store.getState() call.",
            e
          );
          toast.error(
            "Critical error: Could not access application state for update. Please refresh."
          );
          return;
        }

        const latestColumnsFromStore = latestGlobalState.kanban?.columns;
        if (!latestColumnsFromStore) {
          console.error(
            "KanbanPage (onDragEnd): Could not get latest columns from store. Full state:",
            latestGlobalState
          );
          toast.error("Error: Could not verify destination column for update.");
          return;
        }

        const destColumnDefinition = latestColumnsFromStore.find(
          (col) => String(col.id) === String(destination.droppableId)
        );
        if (destColumnDefinition && destColumnDefinition.name) {
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) =>
              STATUS_TO_COLUMN_MAP[key].name === destColumnDefinition.name
          );
          if (newStatusKey) {
            dispatch(
              updateTaskStatusInBackend({
                taskId: taskBeingMovedApiData.id, // Use the actual backend task ID
                taskData: taskBeingMovedApiData, // Pass the full task data if your thunk needs it
                newStatus: newStatusKey,
              })
            );
          } else {
            // console.warn(`KanbanPage: No status key found for column name '${destColumnDefinition.name}'`);
          }
        } else {
          // console.warn(`KanbanPage: Destination column definition not found or has no name. Dest ID: ${destination.droppableId}`);
        }
      } else {
        // console.warn(`KanbanPage: Task moved columns, but taskBeingMovedApiData (or its API ID) was not available. Backend update skipped. DraggableId: ${draggableId}`);
      }
    }
  };

  if (isLoading && (!columns || columns.length === 0)) {
    return <div className="text-center p-10">Loading Kanban board...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-500">
        Error loading Kanban board:{" "}
        {typeof error === "string" ? error : JSON.stringify(error)}
        <Button
          text="Retry"
          onClick={() => projectId && dispatch(fetchKanbanData(projectId))}
          className="ml-2 bg-slate-600 text-white hover:bg-slate-700"
        />
      </div>
    );
  }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 dark:text-slate-200 inline-block ltr:pr-4 rtl:pl-4">
          Kanban Board {projectId ? `(Project ${projectId})` : ""}
        </h4>
        <div className="flex space-x-4 justify-end items-center rtl:space-x-reverse">
          <Button
            icon="heroicons-outline:plus"
            text="Add Board" // This likely means "Add Column" in Kanban context
            className="bg-slate-800 dark:hover:bg-opacity-70 h-min text-sm font-medium text-slate-50 hover:ring-2 hover:ring-opacity-80 ring-slate-900 hover:ring-offset-1 dark:hover:ring-0 dark:hover:ring-offset-0 dark:bg-slate-700 dark:hover:bg-slate-600"
            iconclassName="text-lg"
            onClick={() => dispatch(toggleColumnModal(true))}
          />
        </div>
      </div>

      {(!columns || columns.length === 0) && !isLoading && !error && (
        <div className="text-center p-10 text-slate-500 dark:text-slate-400">
          No tasks or columns to display for this project. Try adding a
          board/column or check if tasks have matching statuses defined in
          `STATUS_TO_COLUMN_MAP`.
        </div>
      )}

      {columns && columns.length > 0 && (
        <div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-lists" // For dragging columns themselves
              direction="horizontal"
              type="list" // Type for columns
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex space-x-6 overflow-hidden overflow-x-auto pb-4 rtl:space-x-reverse"
                >
                  {columns.map((column, i) => {
                    if (!column || column.id === undefined) {
                      // console.warn("KanbanPage: Invalid column object at index", i, column);
                      return null;
                    }
                    return (
                      <Draggable
                        key={String(column.id)}
                        draggableId={String(column.id)} // ID for the column itself
                        index={i}
                      >
                        {(providedDraggable, snapshotDraggable) => (
                          <div
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            // Do not spread dragHandleProps here if the whole card is not the handle.
                            // The handle is applied below.
                          >
                            <div
                              className={`w-[320px] flex-none h-full rounded-md transition-all duration-100 ${
                                snapshotDraggable.isDragging
                                  ? "shadow-2xl bg-slate-300 dark:bg-slate-600/80 ring-2 ring-blue-500"
                                  : "shadow-md bg-slate-200 dark:bg-slate-700"
                              }`}
                            >
                              <div
                                className="relative flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-md shadow-sm px-6 py-5"
                                {...providedDraggable.dragHandleProps} // Column drag handle
                              >
                                <div
                                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full"
                                  style={{
                                    backgroundColor: column.color || "#A0AEC0", // Default color
                                  }}
                                ></div>
                                <div className="text-lg text-slate-900 dark:text-white font-medium capitalize truncate pr-2">
                                  {column.name || "Unnamed Column"} (
                                  {column.tasks?.length || 0})
                                </div>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Tooltip
                                    placement="top"
                                    theme="danger"
                                    content="Delete Column"
                                  >
                                    <button
                                      className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600 hover:bg-red-100 dark:hover:bg-red-600 dark:hover:text-white"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag
                                        dispatch(deleteColumnBoard(column.id));
                                      }}
                                    >
                                      <Icon icon="heroicons-outline:trash" />
                                    </button>
                                  </Tooltip>

                                  <Tooltip
                                    placement="top"
                                    content="Add Task to this Column"
                                  >
                                    <button
                                      className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600 hover:bg-blue-100 dark:hover:bg-blue-600 dark:hover:text-white"
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent drag
                                        dispatch(
                                          toggleTaskModal({
                                            open: true,
                                            columnId: column.id, // Pass columnId to pre-select in AddTaskModal
                                          })
                                        );
                                      }}
                                    >
                                      <Icon icon="heroicons-outline:plus-sm" />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                              <Droppable
                                droppableId={String(column.id)} // ID for tasks within this column
                                type="task" // Type for tasks
                                direction="vertical"
                              >
                                {(providedDroppable, snapshotDroppable) => (
                                  <div
                                    ref={providedDroppable.innerRef}
                                    {...providedDroppable.droppableProps}
                                    className={`px-2 py-4 h-full min-h-[100px] space-y-4 rounded-b-md ${
                                      snapshotDroppable.isDraggingOver
                                        ? "bg-slate-300/60 dark:bg-slate-700/60"
                                        : ""
                                    }`}
                                  >
                                    {column.tasks?.map((task, j) => {
                                      if (!task || task.id === undefined) {
                                        // console.warn("KanbanPage: Invalid task object in column", column.name, "at index", j, task);
                                        return null;
                                      }
                                      return (
                                        <Draggable
                                          key={String(task.id)}
                                          draggableId={String(task.id)} // ID for the task
                                          index={j}
                                        >
                                          {(providedTask) => (
                                            <div
                                              ref={providedTask.innerRef}
                                              {...providedTask.draggableProps}
                                              {...providedTask.dragHandleProps} // Task drag handle
                                            >
                                              <Task task={task} />
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
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
      )}
      <AddColumn />
      {taskModal && <AddTaskModal projectId={projectId} />}
     
    </div>
  );
};

export default KanbanPage;
