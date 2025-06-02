import React, { useEffect } from "react";
import Button from "../../../../components/ui/Button";
import Tooltip from "../../../../components/ui/Tooltip";
import Icon from "../../../../components/ui/Icon";

import { useSelector, useDispatch } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  sort,
  toggleColumnModal,
  deleteColumnBoard, // This is frontend only delete
  toggleTaskModal,
  fetchKanbanData,
  updateTaskStatusInBackend,
  STATUS_TO_COLUMN_MAP, // Make sure this is exported from your store or defined here
} from "./store";

// ***** VERIFY THIS PATH TO YOUR REDUX STORE *****
// This import is for accessing store.getState() directly.
// It's generally better to get data via selectors after dispatch if possible,
// but for immediate state after a synchronous Redux update (like sort), this can be used.
// Ensure this path is correct for your project structure.
import store from "@/store/index";

import Task from "./Task";
import AddColumn from "./AddColumn"; // Modal for adding new columns
import AddTaskModal from "./AddTaskModal"; // Modal for adding/editing tasks
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Ensure CSS is imported for toasts
import { useParams } from "react-router-dom";

const KanbanPage = () => {
  const {
    columns,
    taskModal, // This state now likely just controls visibility of AddTaskModal
    isLoading,
    error,
  } = useSelector((state) => state.kanban);
  const dispatch = useDispatch();
  const { id: projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      dispatch(fetchKanbanData(projectId));
    } else {
      console.warn("KanbanPage: No projectId, cannot fetch data.");
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
      // Get the task's apiData *before* the sort action mutates the state structure
      // This requires accessing the state directly or ensuring `sort` doesn't modify too deeply before this.
      // The current `sort` in the store modifies state directly, so getting it from current `columns` selector should work.
      const sourceColFromState = columns.find(
        (col) => String(col.id) === String(source.droppableId)
      );
      if (
        sourceColFromState &&
        sourceColFromState.tasks &&
        sourceColFromState.tasks[source.index] &&
        sourceColFromState.tasks[source.index].apiData
      ) {
        taskBeingMovedApiData = { ...sourceColFromState.tasks[source.index].apiData };
      } else {
        console.warn(
          `KanbanPage (onDragEnd): Could not find task's apiData prior to sort. DraggableId: ${draggableId}`
        );
      }
    }

    // Dispatch sort first to update UI optimistically
    dispatch(sort({ source, destination, draggableId, type }));

    // If a task moved to a different column, update its status in the backend
    if (
      type === "task" &&
      String(source.droppableId) !== String(destination.droppableId)
    ) {
      if (taskBeingMovedApiData && taskBeingMovedApiData.id) {
        // Get the latest state *after* the `sort` action has completed
        // This is important because the `sort` action updates the Redux state synchronously.
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
            "KanbanPage (onDragEnd): Could not get latest columns from store after sort. Full state:",
            latestGlobalState
          );
          toast.error(
            "Error: Could not verify destination column for update after sort."
          );
          return;
        }

        const destColumnDefinition = latestColumnsFromStore.find(
          (col) => String(col.id) === String(destination.droppableId)
        );

        if (destColumnDefinition && destColumnDefinition.name) {
          // Find the status key (e.g., "TODO", "IN_PROGRESS") corresponding to the destination column's name
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) =>
              STATUS_TO_COLUMN_MAP[key].name === destColumnDefinition.name
          );

          if (newStatusKey) {
            dispatch(
              updateTaskStatusInBackend({
                taskId: taskBeingMovedApiData.id, // This must be the backend ID of the task
                taskData: taskBeingMovedApiData, // Pass the full task data (or relevant parts)
                newStatus: newStatusKey,
              })
            );
          } else {
            console.warn(
              `KanbanPage (onDragEnd): No status key found in STATUS_TO_COLUMN_MAP for column name '${destColumnDefinition.name}'. Backend update for status skipped.`
            );
            toast.warn(`Configuration issue: No status mapping for column '${destColumnDefinition.name}'.`);
          }
        } else {
          console.warn(
            `KanbanPage (onDragEnd): Destination column definition not found or has no name after sort. Dest ID: ${destination.droppableId}`
          );
        }
      } else {
        console.warn(
          `KanbanPage (onDragEnd): Task moved columns, but taskBeingMovedApiData (or its API ID) was not available. Backend update skipped. DraggableId: ${draggableId}`
        );
      }
    }
  };

  if (isLoading && (!columns || columns.length === 0)) {
    return <div className="text-center p-10">Loading Kanban board...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-10 text-red-500 dark:text-red-400">
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
        theme="light" // Consider using "colored" or "dark" based on your app's theme
      />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 dark:text-slate-200 inline-block ltr:pr-4 rtl:pl-4">
          Kanban Board {projectId ? `(Project ${projectId})` : ""}
        </h4>
      
      </div>

      {(!columns || columns.length === 0) && !isLoading && !error && (
        <div className="text-center p-10 text-slate-500 dark:text-slate-400">
          No columns to display for this project.
          <br />
          Try adding a column or ensure `fetchKanbanData` correctly populates
          columns based on your API and `STATUS_TO_COLUMN_MAP`.
        </div>
      )}

      {columns && columns.length > 0 && (
        <div>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-lists"
              direction="horizontal"
              type="list"
            >
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex space-x-6 overflow-hidden overflow-x-auto pb-4 rtl:space-x-reverse"
                >
                  {columns.map((column, i) => {
                    if (!column || column.id === undefined) {
                      console.warn(
                        "KanbanPage: Invalid column object at index",
                        i,
                        column
                      );
                      return null;
                    }
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
                              className={`w-[320px] flex-none h-full rounded-md transition-all duration-100 ${
                                snapshotDraggable.isDragging
                                  ? "shadow-2xl bg-slate-300 dark:bg-slate-600/80 ring-2 ring-blue-500"
                                  : "shadow-md bg-slate-200 dark:bg-slate-700"
                              }`}
                            >
                              <div
                                className="relative flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-md shadow-sm px-6 py-5"
                                {...providedDraggable.dragHandleProps}
                              >
                                <div
                                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full"
                                  style={{
                                    backgroundColor: column.color || "#A0AEC0",
                                  }}
                                ></div>
                                <div className="text-lg text-slate-900 dark:text-white font-medium capitalize truncate pr-2">
                                  {column.name || "Unnamed Column"} (
                                  {column.tasks?.length || 0})
                                </div>
                                
                              </div>
                              <Droppable
                                droppableId={String(column.id)}
                                type="task"
                                direction="vertical"
                              >
                                {(
                                  providedDroppableTasks,
                                  snapshotDroppableTasks
                                ) => (
                                  <div
                                    ref={providedDroppableTasks.innerRef}
                                    {...providedDroppableTasks.droppableProps}
                                    className={`px-2 py-4 h-full min-h-[100px] space-y-4 rounded-b-md ${
                                      snapshotDroppableTasks.isDraggingOver
                                        ? "bg-slate-300/60 dark:bg-slate-700/60"
                                        : ""
                                    }`}
                                  >
                                    {column.tasks?.map((task, j) => {
                                      if (!task || task.id === undefined) {
                                        console.warn(
                                          "KanbanPage: Invalid task object in column",
                                          column.name,
                                          "at index",
                                          j,
                                          task
                                        );
                                        return null;
                                      }
                                      return (
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
                                              <Task task={task} />
                                            </div>
                                          )}
                                        </Draggable>
                                      );
                                    })}
                                    {providedDroppableTasks.placeholder}
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