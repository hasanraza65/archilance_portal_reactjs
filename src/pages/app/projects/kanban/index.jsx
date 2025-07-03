import React, { useEffect, useState, useCallback } from "react";
import Button from "../../../../components/ui/Button";
import { useSelector, useDispatch } from "react-redux";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import {
  sort,
  fetchKanbanData,
  updateTaskStatusInBackend,
  STATUS_TO_COLUMN_MAP,
} from "./store";

import store from "@/store/index";

import Task from "./Task";

import EditTaskModal from "../Task/PartialTask/EditTaskModal";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams } from "react-router-dom";

const KanbanPage = () => {
  const {
    columns,

    isLoading,
    error,
  } = useSelector((state) => state.kanban);
  const dispatch = useDispatch();
  const { id: projectId } = useParams();

  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

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
      const sourceColFromState = columns.find(
        (col) => String(col.id) === String(source.droppableId)
      );
      if (
        sourceColFromState &&
        sourceColFromState.tasks &&
        sourceColFromState.tasks[source.index] &&
        sourceColFromState.tasks[source.index].apiData
      ) {
        taskBeingMovedApiData = {
          ...sourceColFromState.tasks[source.index].apiData,
        };
      } else {
        console.warn(
          `KanbanPage (onDragEnd): Could not find task's apiData prior to sort. DraggableId: ${draggableId}`
        );
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
              "KanbanPage (onDragEnd): CRITICAL - 'store' is undefined or not a valid store object."
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
            "KanbanPage (onDragEnd): Could not get latest columns from store after sort."
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
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) =>
              STATUS_TO_COLUMN_MAP[key].name === destColumnDefinition.name
          );

          if (newStatusKey) {
            dispatch(
              updateTaskStatusInBackend({
                taskId: taskBeingMovedApiData.id,
                taskData: taskBeingMovedApiData,
                newStatus: newStatusKey,
              })
            );
          } else {
            console.warn(
              `KanbanPage (onDragEnd): No status key found for column name '${destColumnDefinition.name}'.`
            );
            toast.warn(
              `Configuration issue: No status mapping for column '${destColumnDefinition.name}'.`
            );
          }
        } else {
          console.warn(
            `KanbanPage (onDragEnd): Destination column definition not found or has no name. Dest ID: ${destination.droppableId}`
          );
        }
      } else {
        console.warn(
          `KanbanPage (onDragEnd): Task moved columns, but taskBeingMovedApiData was not available. Backend update skipped. DraggableId: ${draggableId}`
        );
      }
    }
  };

  const handleOpenEditTaskModal = useCallback((taskFromCard) => {
    if (
      taskFromCard &&
      taskFromCard.apiData &&
      taskFromCard.apiData.id !== undefined
    ) {
      setTaskToEdit(taskFromCard.apiData);
    } else if (taskFromCard && taskFromCard.id !== undefined) {
      console.warn(
        "KanbanPage: taskFromCard.apiData is missing or invalid, passing the whole task object to EditTaskModal. Ensure EditTaskModal can handle this. Task:",
        taskFromCard
      );
      setTaskToEdit(taskFromCard);
    } else {
      console.error(
        "KanbanPage: Attempted to open edit modal with invalid task data.",
        taskFromCard
      );
      toast.error("Cannot edit task: essential data missing.");
      return;
    }
    setIsEditTaskModalOpen(true);
  }, []);

  const handleCloseEditTaskModal = useCallback(() => {
    setIsEditTaskModalOpen(false);
    setTaskToEdit(null);
  }, []);

  const handleTaskUpdatedInKanban = useCallback(async () => {
    setTaskToEdit(null);

    if (projectId) {
      dispatch(fetchKanbanData(projectId));
    }
    console.log(
      "KanbanPage: Task updated callback executed, board will refresh."
    );
  }, [dispatch, projectId]);

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
        theme="light"
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
          Try adding a column or ensure `fetchKanbanData` correctly populates.
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
                                {/* Column options (delete, etc.) can go here */}
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
                                              <Task
                                                task={task}
                                                onOpenEditModal={
                                                  handleOpenEditTaskModal
                                                }
                                              />
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

      {isEditTaskModalOpen && taskToEdit && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={handleCloseEditTaskModal}
          onTaskUpdated={handleTaskUpdatedInKanban}
          taskData={taskToEdit}
          projectId={projectId}
        />
      )}
    </div>
  );
};

export default KanbanPage;