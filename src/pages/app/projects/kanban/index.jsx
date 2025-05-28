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
  toggleTaskModal,
  fetchKanbanData,
  updateTaskStatusInBackend,
  STATUS_TO_COLUMN_MAP,
}  from "./store";

// ***** YOU MUST VERIFY AND CORRECT THIS PATH *****
import store from "@/store/index"; 

import Task from "./Task";
import AddColumn from "./AddColumn";
import AddTaskModal from "./AddTaskModal";
import { toast, ToastContainer } from "react-toastify"; // IMPORTED toast HERE
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
      // console.log( // Temporarily comment out for cleaner console during path debugging
      //   `KanbanPage (useEffect): Dispatching fetchKanbanData for project ID: ${projectId}`
      // );
      dispatch(fetchKanbanData(projectId));
    } else {
      // console.warn( // Temporarily comment out
      //   "KanbanPage (useEffect): No projectId found in URL params. Cannot fetch data."
      // );
    }
  }, [dispatch, projectId]);

  const onDragEnd = (result) => {
    // console.log( // Temporarily comment out for cleaner console
    //   "KanbanPage (onDragEnd): Drag ended. Result:",
    //   JSON.stringify(result, null, 2)
    // );
    const { destination, source, draggableId, type } = result;

    if (!destination) {
      // console.log("KanbanPage (onDragEnd): No destination. Drag aborted.");
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      // console.log("KanbanPage (onDragEnd): Dropped in the same place. No action.");
      return;
    }

    let taskBeingMovedApiData = null;
    if (type === "task") {
      const currentColumnsBeforeSort = columns;
      const sourceCol = currentColumnsBeforeSort.find(
        (col) => String(col.id) === String(source.droppableId)
      );
      if (
        sourceCol &&
        sourceCol.tasks &&
        sourceCol.tasks[source.index] &&
        sourceCol.tasks[source.index].apiData
      ) {
        taskBeingMovedApiData = { ...sourceCol.tasks[source.index].apiData };
        // console.log( // Temporarily comment out
        //   "KanbanPage (onDragEnd): Captured taskBeingMovedApiData:",
        //   JSON.stringify(taskBeingMovedApiData, null, 2)
        // );
      } else {
        // console.warn( // Temporarily comment out
        //   `KanbanPage (onDragEnd): Could not find task (draggableId: ${draggableId}) or its apiData in source column (ID: ${source.droppableId}, Index: ${source.index}) prior to sort dispatch. Source Col Tasks:`,
        //   sourceCol?.tasks
        // );
      }
    }

    // console.log("KanbanPage (onDragEnd): Dispatching 'sort' action.");
    dispatch(sort({ source, destination, draggableId, type }));

    if (
      type === "task" &&
      String(source.droppableId) !== String(destination.droppableId)
    ) {
      // console.log("KanbanPage (onDragEnd): Task moved to a different column. Preparing backend update.");
      if (taskBeingMovedApiData && taskBeingMovedApiData.id) {
        let latestGlobalState;
        try {
          // console.log("KanbanPage (onDragEnd): 'store' object before calling getState():", store); 
          if (!store || typeof store.getState !== 'function') {
            console.error("KanbanPage (onDragEnd): CRITICAL - 'store' is undefined or not a valid store object. getState will fail. Check import path for 'store'."); // KEEP THIS LOG
            toast.error("Application error: Cannot access state. Please check console and refresh.");
            return;
          }
          latestGlobalState = store.getState(); 
        } catch (e) {
          console.error(
            "KanbanPage (onDragEnd): CRITICAL ERROR during store.getState() call.", e // KEEP THIS LOG
          );
          toast.error(
            "Critical error: Could not access application state for update. Please refresh."
          );
          return;
        }

        const latestColumnsFromStore = latestGlobalState.kanban?.columns;

        if (!latestColumnsFromStore) {
          console.error(
            "KanbanPage (onDragEnd): Could not get latest columns from store. 'latestGlobalState.kanban.columns' is undefined. Full state:", latestGlobalState // KEEP THIS LOG
          );
          toast.error("Error: Could not verify destination column for update.");
          return;
        }

        const destColumnDefinition = latestColumnsFromStore.find(
          (col) => String(col.id) === String(destination.droppableId)
        );

        if (destColumnDefinition && destColumnDefinition.name) {
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === destColumnDefinition.name
          );

          if (newStatusKey) {
            // console.log( // Temporarily comment out
            //   `KanbanPage (onDragEnd): Task (API ID: ${taskBeingMovedApiData.id}) moved to column '${destColumnDefinition.name}'. New backend status key: '${newStatusKey}'. Dispatching updateTaskStatusInBackend.`
            // );
            dispatch(
              updateTaskStatusInBackend({
                taskId: taskBeingMovedApiData.id,
                taskData: taskBeingMovedApiData,
                newStatus: newStatusKey,
              })
            );
          } else {
            // console.warn( // Temporarily comment out
            //   `KanbanPage (onDragEnd): Could not map destination column name '${destColumnDefinition.name}' to a backend status key. Task API ID: ${taskBeingMovedApiData.id}`
            // );
          }
        } else {
          // console.warn( // Temporarily comment out
          //   `KanbanPage (onDragEnd): Could not find destination column definition for ID '${
          //     destination.droppableId
          //   }' or it has no name. Task API ID: ${
          //     taskBeingMovedApiData.id || "N/A"
          //   }. Latest columns from store:`, latestColumnsFromStore
          // );
        }
      } else {
        // console.warn( // Temporarily comment out
        //   `KanbanPage (onDragEnd): Task moved columns, but taskBeingMovedApiData (or its API ID) was not available. Backend update skipped. DraggableId: ${draggableId}`
        // );
      }
    } else if (type === "task") {
      // console.log("KanbanPage (onDragEnd): Task reordered within the same column. No backend status update needed.");
    }
  };

  // ... (rest of JSX - no changes needed here from the previous full version) ...
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
          className="ml-2"
        />
      </div>
    );
  }
  
  // No need to log this on every render once initial loading is debugged
  // if (!isLoading && !error && columns && columns.length === 0 && projectId) {
  //   console.log("KanbanPage: Render - Columns array is empty after fetch attempt (not loading, no error). Project ID:", projectId);
  // }

  return (
    <div>
      <ToastContainer />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Kanban Board {projectId ? `(Project ${projectId})` : ""}
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

      {(!columns || columns.length === 0) && !isLoading && !error && (
         <div className="text-center p-10 text-slate-500">
            No tasks or columns to display for this project. Try adding a board or
            check if tasks have matching statuses.
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
                      // console.warn( // Temporarily comment out
                      //   "KanbanPage: Rendering columns, but found an invalid column object:",
                      //   column,
                      //   "at index",
                      //   i
                      // );
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
                              className={`w-[320px] flex-none h-full rounded transition-all duration-100 ${
                                snapshotDraggable.isDragging
                                  ? "shadow-xl bg-slate-300 dark:bg-slate-600"
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
                                    backgroundColor: column.color || "#ccc",
                                  }}
                                ></div>
                                <div className="text-lg text-slate-900 dark:text-white font-medium capitalize">
                                  {column.name || "Unnamed Column"} (
                                  {column.tasks?.length || 0})
                                </div>
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Tooltip
                                    placement="top"
                                    theme="danger"
                                    content="Delete Board"
                                  >
                                    <button
                                      className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600 hover:bg-red-100 dark:hover:bg-red-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(deleteColumnBoard(column.id));
                                      }}
                                    >
                                      <Icon icon="heroicons-outline:trash" />
                                    </button>
                                  </Tooltip>

                                  <Tooltip placement="top" content="Add Card">
                                    <button
                                      className="border border-slate-200 dark:border-slate-700 dark:text-slate-400 rounded h-6 w-6 flex flex-col items-center justify-center text-base text-slate-600 hover:bg-blue-100 dark:hover:bg-blue-700"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(
                                          toggleTaskModal({
                                            open: true,
                                            columnId: column.id,
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
                                        ? "bg-slate-300/50 dark:bg-slate-700/50"
                                        : ""
                                    }`}
                                  >
                                    {column.tasks?.map((task, j) => {
                                      if (!task || task.id === undefined) {
                                        // console.warn( // Temporarily comment out
                                        //   "KanbanPage: Rendering tasks, but found an invalid task object:",
                                        //   task,
                                        //   "in column",
                                        //   column.name,
                                        //   "at index",
                                        //   j
                                        // );
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
      <EditTaskModal />
    </div>
  );
};

export default KanbanPage;