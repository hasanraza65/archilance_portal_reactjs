import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

const getApiPrefixByRole = () => {
  const role = Cookies.get("userRole");

  if (!role) {
    console.error("User role not found in cookies. Cannot determine API endpoint.");
    toast.error("Authentication error: User role is missing. Please log in again.");
    return null;
  }
  return `api/${role}`;
};

export const STATUS_TO_COLUMN_MAP = {
  Todo: { name: "To Do", color: "#4669FA", order: 1 },
  "In Progress": { name: "In Progress", color: "#FA916B", order: 2 },
  Completed: { name: "Completed", color: "#50C793", order: 3 },
};

export const fetchKanbanData = createAsyncThunk(
  "kanban/fetchKanbanData",
  async (projectId, { rejectWithValue }) => {
    const token = Cookies.get("token");
    if (!token) {
      return rejectWithValue("No token found");
    }

    const apiPrefix = getApiPrefixByRole();
    if (!apiPrefix) {
      return rejectWithValue("User role not found, cannot fetch data.");
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/${apiPrefix}/project-task?project_id=${projectId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch Kanban data (${response.status})`
        );
      }
      const apiResponse = await response.json();

      const columnsMap = {};
      Object.keys(STATUS_TO_COLUMN_MAP)
        .sort((a, b) => STATUS_TO_COLUMN_MAP[a].order - STATUS_TO_COLUMN_MAP[b].order)
        .forEach((statusKey) => {
          columnsMap[statusKey] = {
            id: uuidv4(),
            name: STATUS_TO_COLUMN_MAP[statusKey].name,
            color: STATUS_TO_COLUMN_MAP[statusKey].color,
            order: STATUS_TO_COLUMN_MAP[statusKey].order,
            tasks: [],
          };
        });

      const tasksToProcess = Array.isArray(apiResponse)
        ? apiResponse
        : apiResponse && Array.isArray(apiResponse.data)
        ? apiResponse.data
        : apiResponse && Array.isArray(apiResponse.tasks)
        ? apiResponse.tasks
        : [];

      if (Array.isArray(tasksToProcess) && tasksToProcess.length > 0) {
        tasksToProcess.forEach((task) => {
          const status = task.task_status;
          if (columnsMap[status]) {
            columnsMap[status].tasks.push({
              id: String(task.id),
              name: task.task_title,
              des: task.task_description,
              startDate: task.created_at || new Date().toISOString().split("T")[0],
              endDate: task.due_date,
              progress: task.progress || 0,
              assignee: task.assignees || [],
              category: task.categories || [],
              apiData: task,
            });
          } else {
            console.warn(
              `fetchKanbanData: Status '${status}' for task ID ${task.id} ('${task.task_title}') not in STATUS_TO_COLUMN_MAP. Task not added to any column.`
            );
          }
        });
      } else if (tasksToProcess === null || tasksToProcess.length === 0) {
        console.log("fetchKanbanData: No tasks returned from API for project", projectId);
      } else {
        console.warn("fetchKanbanData: tasksToProcess is not an array or is undefined.", apiResponse);
      }

      const sortedColumns = Object.values(columnsMap).sort(
        (a, b) => a.order - b.order
      );
      return sortedColumns;
    } catch (error) {
      console.error("fetchKanbanData: Error in thunk:", error);
      return rejectWithValue(error.message || "Unknown error fetching Kanban data");
    }
  }
);

export const updateTaskStatusInBackend = createAsyncThunk(
  "kanban/updateTaskStatusInBackend",
  async ({ taskId, taskData, newStatus }, { rejectWithValue, getState }) => {
    const token = Cookies.get("token");
    if (!token) return rejectWithValue("No token found");

    const apiPrefix = getApiPrefixByRole();
    if (!apiPrefix) {
      return rejectWithValue("User role not found, cannot update task.");
    }

    let fullTaskData = { ...taskData };
    if (!fullTaskData.project_id && taskId) {
      const state = getState();
      const projectColumns = state.kanban.columns;
      let foundTask = null;
      for (const column of projectColumns) {
        foundTask = column.tasks.find(t => t.apiData && String(t.apiData.id) === String(taskId));
        if (foundTask) break;
      }
      if (foundTask && foundTask.apiData && foundTask.apiData.project_id) {
        fullTaskData = { ...foundTask.apiData, ...taskData };
      }
    }

    const mapToIds = (items) => (Array.isArray(items) ? items.map(item => (typeof item === 'object' && item !== null && item.id !== undefined ? item.id : item)).filter(id => id != null) : []);

    const putPayload = {
      task_title: fullTaskData.task_title,
      task_description: fullTaskData.task_description,
      due_date: fullTaskData.due_date,
      task_status: newStatus,
      project_id: fullTaskData.project_id,
      assignees: mapToIds(fullTaskData.assignees),
      categories: mapToIds(fullTaskData.categories),
    };

    if (putPayload.project_id === undefined || putPayload.project_id === null) {
      const errorMsg = "CRITICAL: project_id is missing in PUT payload for task update.";
      console.error(errorMsg, "Full TaskData used for update:", fullTaskData);
      toast.error("Error: Project ID missing for task update.", { autoClose: 3000 });
      return rejectWithValue(errorMsg);
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/${apiPrefix}/project-task/${taskId}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(putPayload),
        }
      );
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorData;
        try {
          errorData = responseBodyText ? JSON.parse(responseBodyText) : { message: `HTTP error ${response.status}` };
        } catch (e) {
          errorData = { message: `HTTP error ${response.status}. Non-JSON: ${responseBodyText}` };
        }
        const displayError = errorData.message || (errorData.errors && Object.values(errorData.errors).flat().join(", ")) || `Server error ${response.status}`;
        toast.error(`Failed to update task status: ${displayError}`);
        return rejectWithValue(displayError);
      }
      const updatedTaskFromApi = responseBodyText ? JSON.parse(responseBodyText) : null;
      if (!updatedTaskFromApi || !updatedTaskFromApi.task || typeof updatedTaskFromApi.task !== "object") {
        toast.error("Task status update response from server was incomplete.");
        return rejectWithValue("Incomplete data from server after task status update.");
      }
      toast.success(updatedTaskFromApi.message || "Task status updated!");
      return { backendTaskId: taskId, newStatus, updatedTaskDataFromApi: updatedTaskFromApi.task };
    } catch (error) {
      toast.error(`Error updating task status: ${error.message}`);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTaskFromBackend = createAsyncThunk(
  "kanban/deleteTaskFromBackend",
  async ({ backendTaskId, frontendTaskId }, { rejectWithValue }) => {
    const token = Cookies.get("token");
    if (!token) return rejectWithValue("No token found");

    const apiPrefix = getApiPrefixByRole();
    if (!apiPrefix) {
      return rejectWithValue("User role not found, cannot delete task.");
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/${apiPrefix}/project-task/${backendTaskId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );
      const responseBodyText = await response.text();
      if (!response.ok) {
        let errorData;
        try {
          errorData = responseBodyText ? JSON.parse(responseBodyText) : { message: `HTTP error ${response.status}` };
        } catch (e) {
          errorData = { message: `HTTP error ${response.status}. Non-JSON: ${responseBodyText}` };
        }
        const displayError = errorData.message || (errorData.errors && Object.values(errorData.errors).flat().join(", ")) || `Failed to delete task (Server error ${response.status})`;
        toast.error(displayError);
        return rejectWithValue(displayError);
      }
      let successMessage = "Task deleted successfully!";
      if (responseBodyText) {
        try {
          const parsedBody = JSON.parse(responseBodyText);
          if (parsedBody && parsedBody.message) successMessage = parsedBody.message;
        } catch (e) { /*ignore*/ }
      }
      toast.success(successMessage);
      return { frontendTaskId };
    } catch (error) {
      toast.error(error.message || "Error deleting task.");
      return rejectWithValue(error.message || "Network error");
    }
  }
);

export const appKanbanSlice = createSlice({
  name: "kanban",
  initialState: {
    columModal: false,
    isLoading: true,
    openTaskId: null,
    columns: [],
    error: null,
  },
  reducers: {
    sort: (state, action) => {
      const { source, destination, draggableId, type } = action.payload;
      if (!destination) return;

      if (type === "list") {
        const items = Array.from(state.columns);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        state.columns = items;
        return;
      }

      if (type === "task") {
        const sourceColumn = state.columns.find(col => String(col.id) === String(source.droppableId));
        const destColumn = state.columns.find(col => String(col.id) === String(destination.droppableId));
        if (!sourceColumn || !destColumn) return;

        const sourceItems = [...sourceColumn.tasks];
        const destItems = source.droppableId === destination.droppableId ? sourceItems : [...destColumn.tasks];
        const [removedTask] = sourceItems.splice(source.index, 1);
        if (!removedTask) return;
        destItems.splice(destination.index, 0, removedTask);

        state.columns = state.columns.map((col) => {
          if (String(col.id) === String(source.droppableId)) return { ...col, tasks: sourceItems };
          if (String(col.id) === String(destination.droppableId) && String(source.droppableId) !== String(destination.droppableId)) return { ...col, tasks: destItems };
          if (String(col.id) === String(destination.droppableId) && String(source.droppableId) === String(destination.droppableId)) return { ...col, tasks: destItems };
          return col;
        });

        if (String(source.droppableId) !== String(destination.droppableId) && removedTask.apiData) {
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(key => STATUS_TO_COLUMN_MAP[key].name === destColumn.name);
          if (newStatusKey) {
            const targetColIndex = state.columns.findIndex(c => String(c.id) === String(destination.droppableId));
            if (targetColIndex !== -1) {
              const taskInNewColIndex = state.columns[targetColIndex].tasks.findIndex(t => String(t.id) === String(removedTask.id));
              if (taskInNewColIndex !== -1 && state.columns[targetColIndex].tasks[taskInNewColIndex].apiData) {
                state.columns[targetColIndex].tasks[taskInNewColIndex].apiData = {
                  ...state.columns[targetColIndex].tasks[taskInNewColIndex].apiData,
                  task_status: newStatusKey,
                };
              }
            }
          }
        }
      }
    },
    toggleColumnModal: (state, action) => {
      state.columModal = action.payload;
    },
    addColumnBoard: (state, action) => {
      const newColumnName = action.payload.title;
      const predefinedStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(key => STATUS_TO_COLUMN_MAP[key].name.toLowerCase() === newColumnName.toLowerCase());
      let color = action.payload.color;
      let order = state.columns.length > 0 ? Math.max(...state.columns.map(c => c.order)) + 1 : 1;
      if (predefinedStatusKey && STATUS_TO_COLUMN_MAP[predefinedStatusKey]) {
        color = STATUS_TO_COLUMN_MAP[predefinedStatusKey].color;
        order = STATUS_TO_COLUMN_MAP[predefinedStatusKey].order;
        if (state.columns.some(col => col.name.toLowerCase() === STATUS_TO_COLUMN_MAP[predefinedStatusKey].name.toLowerCase())) {
          toast.error(`Column "${STATUS_TO_COLUMN_MAP[predefinedStatusKey].name}" already exists.`);
          return;
        }
      }
      state.columns.push({ id: uuidv4(), name: newColumnName, color: color, tasks: [], order: order });
      state.columns.sort((a, b) => a.order - b.order);
      toast.success("Board Added Successfully (Frontend Only)", { autoClose: 1500 });
    },
    deleteColumnBoard: (state, action) => {
      state.columns = state.columns.filter(column => String(column.id) !== String(action.payload));
      toast.warn("Board Deleted Successfully (Frontend Only)", { autoClose: 1500 });
    },
    toggleTaskModal: (state, action) => {
      if (typeof action.payload === 'object' && action.payload !== null) {
        state.taskModal = action.payload.open;
        state.openTaskId = action.payload.open ? action.payload.columnId : null;
        if (action.payload.taskData && action.payload.mode === 'edit') {
          console.warn("toggleTaskModal with mode 'edit' called. External EditTaskModal should be used.");
        }
      } else if (typeof action.payload === 'boolean') {
        state.taskModal = action.payload;
        state.openTaskId = action.payload ? state.openTaskId : null;
      }
    },
    addTask: (state, action) => {
      const column = state.columns.find((col) => String(col.id) === String(state.openTaskId));
      if (column) {
        const taskStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(key => STATUS_TO_COLUMN_MAP[key].name === column.name) || "Todo";
        const currentProjectId = action.payload.projectId;
        if (!currentProjectId) {
          toast.error("Project ID is missing. Cannot add task.");
          return;
        }
        const newTask = {
          id: uuidv4(),
          name: action.payload.name,
          des: action.payload.des,
          apiData: {
            task_title: action.payload.name,
            task_description: action.payload.des,
            due_date: action.payload.endDate,
            task_status: taskStatusKey,
            project_id: currentProjectId,
            assignees: (action.payload.assignee || []).map(a => typeof a === 'object' && a.id !== undefined ? a.id : a),
            categories: (action.payload.category || []).map(c => typeof c === 'object' && c.id !== undefined ? c.id : c),
          },
        };
        column.tasks.push(newTask);
        toast.success("Task Added (Frontend Only - Implement Backend Save)", { autoClose: 1500 });
      }
      state.taskModal = false;
      state.openTaskId = null;
    },
    toggleEditModal: (state, action) => {
      console.warn("toggleEditModal reducer called. This may be deprecated if using external EditTaskModal exclusively.");
    },
    updateTask: (state, action) => {
      console.warn("updateTask reducer called. Ensure this is still needed with external EditTaskModal handling backend updates and KanbanPage re-fetching.");
      const updatedTaskPayload = action.payload;
      let taskFoundAndUpdated = false;
      state.columns = state.columns.map((column) => {
        const taskIndex = column.tasks.findIndex(task => String(task.id) === String(updatedTaskPayload.id) || (task.apiData && String(task.apiData.id) === String(updatedTaskPayload.id)));
        if (taskIndex !== -1) {
          const existingTask = column.tasks[taskIndex];
          const newName = updatedTaskPayload.name !== undefined ? updatedTaskPayload.name : existingTask.name;

          column.tasks[taskIndex] = {
            ...existingTask,
            name: newName,
            apiData: {
              ...(existingTask.apiData || {}),
              id: existingTask.apiData?.id || updatedTaskPayload.id,
              task_title: newName,
            },
          };
          taskFoundAndUpdated = true;
        }
        return column;
      });
      if (taskFoundAndUpdated) {
        toast.info("Task Updated (Frontend Only via updateTask reducer)", { autoClose: 1500 });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKanbanData.pending, (state) => {
        state.isLoading = true; state.error = null;
      })
      .addCase(fetchKanbanData.fulfilled, (state, action) => {
        state.isLoading = false; state.columns = action.payload; state.error = null;
      })
      .addCase(fetchKanbanData.rejected, (state, action) => {
        state.isLoading = false; state.error = action.payload || action.error?.message || "Failed to fetch";
        toast.error(`Error fetching board: ${state.error}`);
      })
      .addCase(updateTaskStatusInBackend.fulfilled, (state, action) => {
        const { backendTaskId, updatedTaskDataFromApi } = action.payload;
        if (!updatedTaskDataFromApi || !updatedTaskDataFromApi.id) return;
        let taskFoundAndUpdatedInRedux = false;
        state.columns = state.columns.map(column => {
          const taskIndex = column.tasks.findIndex(task => task.apiData && String(task.apiData.id) === String(backendTaskId));
          if (taskIndex !== -1) {
            const oldTask = column.tasks[taskIndex];
            let tasksCopy = [...column.tasks];
            tasksCopy[taskIndex] = {
              ...oldTask,
              id: String(updatedTaskDataFromApi.id) || oldTask.id,
              name: updatedTaskDataFromApi.task_title,
              des: updatedTaskDataFromApi.task_description,
              startDate: updatedTaskDataFromApi.created_at || oldTask.startDate,
              endDate: updatedTaskDataFromApi.due_date,
              progress: updatedTaskDataFromApi.progress !== undefined ? updatedTaskDataFromApi.progress : oldTask.progress,
              assignee: updatedTaskDataFromApi.assignees !== undefined ? updatedTaskDataFromApi.assignees : oldTask.assignee,
              category: updatedTaskDataFromApi.categories !== undefined ? updatedTaskDataFromApi.categories : oldTask.category,
              apiData: { ...oldTask.apiData, ...updatedTaskDataFromApi },
            };
            taskFoundAndUpdatedInRedux = true;
            return { ...column, tasks: tasksCopy };
          }
          return column;
        });
        if (!taskFoundAndUpdatedInRedux) {
          console.warn(`extraReducers: Task ${backendTaskId} updated in backend, but NOT FOUND in Redux for final sync.`);
        }
      })
      .addCase(updateTaskStatusInBackend.rejected, (state, action) => {
        console.error("updateTaskStatusInBackend.rejected:", action.payload, `For Task API ID: ${action.meta.arg.taskId}`);
      })
      .addCase(deleteTaskFromBackend.fulfilled, (state, action) => {
        const { frontendTaskId } = action.payload;
        state.columns = state.columns.map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => String(task.id) !== String(frontendTaskId)),
        }));
      })
      .addCase(deleteTaskFromBackend.rejected, (state, action) => {
        console.error("deleteTaskFromBackend.rejected:", action.payload, `Frontend ID: ${action.meta.arg.frontendTaskId}`);
      });
  },
});

export const {
  sort,
  toggleColumnModal,
  addColumnBoard,
  deleteColumnBoard,
  addTask,
  toggleTaskModal,
  toggleEditModal,
  updateTask,
} = appKanbanSlice.actions;

export default appKanbanSlice.reducer;