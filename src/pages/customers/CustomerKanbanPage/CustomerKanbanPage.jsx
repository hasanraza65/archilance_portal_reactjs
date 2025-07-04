import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Menu } from "@headlessui/react"; // For the dropdown menu
import { v4 as uuidv4 } from "uuid";
import DOMPurify from "dompurify"; // For safely rendering HTML descriptions
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Eye,
  Trello,
} from "lucide-react";

// --- Helper: Configuration for Columns ---
const STATUS_TO_COLUMN_MAP = {
  Todo: { name: "To Do", color: "#4A90E2", order: 1 },
  "In Progress": { name: "In Progress", color: "#F5A623", order: 2 },
  Completed: { name: "Completed", color: "#7ED321", order: 3 },
};

// --- Helper: NEW Task Card Component (Styled to match your employee Task.js) ---
const CustomerTaskCard = ({ task }) => {
  const navigate = useNavigate();
  const {
    task_title: name,
    task_description: des,
    due_date: endDate,
    id,
  } = task || {};

  const sanitizedDescription = DOMPurify.sanitize(des || "");
  const hasActualDescription =
    sanitizedDescription.replace(/<[^>]*>/g, "").trim().length > 0;

  const handleViewDetails = () => {
    // NOTE: You will need to create a TaskDetailsPage and a route like `/task/:taskId` for this to work.
    if (id) {
      // navigate(`/task/${id}`);
      console.log(`Navigate to details for task ID: ${id}`);
      alert(`This would navigate to the details page for task: "${name}"`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab group">
      <header className="flex justify-between items-start p-4">
        <div className="flex space-x-4 items-center rtl:space-x-reverse flex-1 min-w-0">
          <div className="flex-none">
            <div className="h-10 w-10 rounded-md text-lg bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-200 flex flex-col items-center justify-center font-normal capitalize">
              {name && name.length >= 2
                ? name.slice(0, 2)
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
              {name || "Untitled Task"}
            </div>
          </div>
        </div>
        <div>
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="text-xs inline-flex flex-col items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <MoreVertical size={16} />
              </Menu.Button>
            </div>
            <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-slate-100 dark:divide-slate-700 rounded-md bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none z-10">
              <div className="px-1 py-1 ">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleViewDetails}
                      className={`${
                        active ? "bg-slate-100 dark:bg-slate-700" : ""
                      } text-slate-700 dark:text-slate-300 group flex w-full items-center rounded-md px-2 py-2 text-sm space-x-2 rtl:space-x-reverse`}
                    >
                      <Eye className="h-5 w-5" />
                      <span>View Details</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </header>

      <div className="px-4 pb-4">
        {hasActualDescription ? (
          <div
            className="text-slate-600 dark:text-slate-400 text-sm pt-4 pb-2 prose prose-sm max-w-none dark:prose-invert line-clamp-3"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        ) : (
          <div className="text-slate-500 dark:text-slate-500 text-sm pt-4 pb-2 italic">
            No description provided.
          </div>
        )}

        <div className="flex justify-end items-end pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
          {endDate && (
            <div className="text-right">
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Due date
              </span>
              <span className="block text-sm text-slate-700 dark:text-slate-300 font-medium">
                {formatDate(endDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const CustomerKanbanPage = () => {
  const { projectId } = useParams();
  const token = Cookies.get("token");
  const API_BASE_URL = "https://demo.aentora.com/backend/public/api/customer";

  const [columns, setColumns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !projectId) {
      setError("Authentication token or Project ID is missing.");
      setIsLoading(false);
      return;
    }

    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/project-task?project_id=${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.message ||
              `Failed to fetch tasks. Status: ${response.status}`
          );
        }
        const tasksFromApi = await response.json();

        const columnsMap = {};
        Object.keys(STATUS_TO_COLUMN_MAP).forEach((key) => {
          columnsMap[key] = {
            id: uuidv4(),
            ...STATUS_TO_COLUMN_MAP[key],
            tasks: [],
          };
        });

        if (Array.isArray(tasksFromApi)) {
          tasksFromApi.forEach((task) => {
            if (columnsMap[task.task_status]) {
              task.id = String(task.id);
              columnsMap[task.task_status].tasks.push(task);
            } else {
              console.warn(`Unknown task status: "${task.task_status}"`);
            }
          });
        }
        const sortedColumns = Object.values(columnsMap).sort(
          (a, b) => a.order - b.order
        );
        setColumns(sortedColumns);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTasks();
  }, [projectId, token]);

  const onDragEnd = () => {};

  if (isLoading && columns.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700">
            Failed to load Kanban Board
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mt-2">{error}</p>
          <Link
            to="/projects"
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Order Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-slate-900 min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ArrowLeft size={18} />
            Back to Order Details
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-200 mb-6 flex items-center gap-3">
          <Trello className="w-8 h-8 text-blue-600" />
          Project Kanban Board
        </h1>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="flex space-x-6 overflow-x-auto pb-4"
              >
                {columns.length > 0 ? (
                  columns.map((column, index) => (
                    <Draggable
                      key={column.id}
                      draggableId={column.id}
                      index={index}
                    >
                      {(providedDraggable) => (
                        <div
                          ref={providedDraggable.innerRef}
                          {...providedDraggable.draggableProps}
                        >
                          <div className="w-[320px] flex-none h-full rounded-md bg-slate-200 dark:bg-slate-700 shadow-md">
                            <div
                              className="relative flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-md shadow-sm px-6 py-5"
                              {...providedDraggable.dragHandleProps}
                            >
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] rounded-r-full"
                                style={{ backgroundColor: column.color }}
                              ></div>
                              <div className="text-lg text-slate-900 dark:text-white font-medium capitalize truncate pr-2">
                                {column.name} ({column.tasks.length})
                              </div>
                            </div>
                            <Droppable droppableId={column.id} type="TASK">
                              {(providedTasks, snapshotTasks) => (
                                <div
                                  ref={providedTasks.innerRef}
                                  {...providedTasks.droppableProps}
                                  className={`px-2 py-4 h-full min-h-[100px] space-y-4 rounded-b-md transition-colors ${
                                    snapshotTasks.isDraggingOver
                                      ? "bg-slate-300/60 dark:bg-slate-700/60"
                                      : ""
                                  }`}
                                >
                                  {column.tasks.map((task, taskIndex) => (
                                    <Draggable
                                      key={task.id}
                                      draggableId={task.id}
                                      index={taskIndex}
                                    >
                                      {(providedTask) => (
                                        <div
                                          ref={providedTask.innerRef}
                                          {...providedTask.draggableProps}
                                          {...providedTask.dragHandleProps}
                                        >
                                          <CustomerTaskCard task={task} />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {providedTasks.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="text-center p-10 text-slate-500 dark:text-slate-400 w-full">
                    No tasks found for this project.
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default CustomerKanbanPage;
