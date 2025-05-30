// src/pages/app/projects/kanban/appKanbanSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import Cookies from "js-cookie";

// ***** EXPORTING STATUS_TO_COLUMN_MAP directly from here *****
export const STATUS_TO_COLUMN_MAP = {
  Todo: { name: "To Do", color: "#4669FA", order: 1 },
  "In Progress": { name: "In Progress", color: "#FA916B", order: 2 },
  Completed: { name: "Completed", color: "#50C793", order: 3 },
  // Add other statuses if your backend uses more, e.g., 'Review', 'Blocked'
  // Ensure the keys here ('Todo', 'In Progress', 'Completed') EXACTLY match
  // the `task_status` values returned by your backend API for tasks.
};

// --- ASYNC THUNKS ---

export const fetchKanbanData = createAsyncThunk(
  "kanban/fetchKanbanData",
  async (projectId, { rejectWithValue }) => {
    const token = Cookies.get("token");
    if (!token) {
      console.error("fetchKanbanData: No token found");
      return rejectWithValue("No token found");
    }
    try {
      const response = await fetch(
        `https://demo.aentora.com/backend/public/api/admin/project-task?project_id=${projectId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Network response was not ok" }));
        console.error(
          "fetchKanbanData: API response not OK.",
          errorData,
          "Status:",
          response.status
        );
        throw new Error(
          errorData.message || `Failed to fetch Kanban data (${response.status})`
        );
      }
      const apiResponse = await response.json();

      const columnsMap = {};
      // Initialize columns based on STATUS_TO_COLUMN_MAP ensuring correct order
      Object.keys(STATUS_TO_COLUMN_MAP)
        .sort((a, b) => STATUS_TO_COLUMN_MAP[a].order - STATUS_TO_COLUMN_MAP[b].order)
        .forEach((statusKey) => {
          columnsMap[statusKey] = {
            id: uuidv4(), // Frontend unique ID for the column
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
        : [];

      if (Array.isArray(tasksToProcess) && tasksToProcess.length > 0) {
        tasksToProcess.forEach((task) => {
          const status = task.task_status; // This is the key like "Todo", "In Progress"
          if (columnsMap[status]) {
            columnsMap[status].tasks.push({
              id: String(task.id), // Frontend ID for dnd, using backend ID
              name: task.task_title,
              des: task.task_description,
              startDate:
                task.created_at || new Date().toISOString().split("T")[0],
              endDate: task.due_date,
              progress: task.progress || 0,
              assignee: task.assignees || [],
              category: task.categories || [],
              apiData: task, // Store the full backend task object
            });
          } else {
            console.warn(
              `fetchKanbanData: Status '${status}' for task ID: ${task.id}, Title: '${task.task_title}' DOES NOT MAP to any column. Expected keys in STATUS_TO_COLUMN_MAP: ${Object.keys(STATUS_TO_COLUMN_MAP).join(', ')}.`
            );
          }
        });
      }

      const sortedColumns = Object.values(columnsMap).sort(
        (a, b) => a.order - b.order
      );

      return sortedColumns;
    } catch (error) {
      console.error(
        "fetchKanbanData: Error in thunk execution:",
        error.message,
        error
      );
      return rejectWithValue(
        error.message || "Unknown error in fetchKanbanData thunk"
      );
    }
  }
);

export const updateTaskStatusInBackend = createAsyncThunk(
  "kanban/updateTaskStatusInBackend",
  async ({ taskId, taskData, newStatus }, { rejectWithValue, getState }) => { // Added getState
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      console.error("updateTaskStatusInBackend: No token found");
      return rejectWithValue("No token found");
    }

    // Ensure taskData has the most recent full structure, especially project_id
    // It might be safer to fetch the full taskData from state if only partial data is passed initially
    let fullTaskData = { ...taskData };
    if (!fullTaskData.project_id && taskId) {
        const state = getState();
        const projectColumns = state.kanban.columns; // Accessing columns from the current slice
        let foundTask = null;
        for (const column of projectColumns) {
            foundTask = column.tasks.find(t => t.apiData && String(t.apiData.id) === String(taskId));
            if (foundTask) break;
        }
        if (foundTask && foundTask.apiData && foundTask.apiData.project_id) {
            fullTaskData = { ...foundTask.apiData, ...taskData }; // Merge, prioritizing passed taskData for fields like title, desc
        } else {
            console.error("updateTaskStatusInBackend: Could not find task in state or project_id missing for task:", taskId);
            // toast.error("Critical data missing for task update. Cannot proceed.");
            // return rejectWithValue("Critical data (project_id) missing for task update.");
        }
    }


    const mapToIds = (items) => {
      if (!Array.isArray(items)) return [];
      return items
        .map((item) =>
          typeof item === "object" && item !== null && item.id !== undefined
            ? item.id
            : item
        )
        .filter((id) => id !== null && id !== undefined);
    };

    const putPayload = {
      task_title: fullTaskData.task_title,
      task_description: fullTaskData.task_description,
      due_date: fullTaskData.due_date,
      task_status: newStatus, // This is the crucial update
      project_id: fullTaskData.project_id,
      assignees: mapToIds(fullTaskData.assignees),
      categories: mapToIds(fullTaskData.categories),
      // Add progress if your API supports it:
      // progress: fullTaskData.progress,
    };

    if (putPayload.project_id === undefined || putPayload.project_id === null) {
      const errorMsg =
        "CRITICAL: project_id is missing in PUT payload for task update.";
      console.error(errorMsg, "Full TaskData used for update:", fullTaskData);
      toast.error("Error: Project ID missing for task update.", {
        autoClose: 3000,
      });
      return rejectWithValue(errorMsg);
    }

    try {
      const response = await fetch(
        `https://demo.aentora.com/backend/public/api/admin/project-task/${taskId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(putPayload),
        }
      );

      const responseBodyText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = responseBodyText
            ? JSON.parse(responseBodyText)
            : { message: `HTTP error ${response.status}: ${response.statusText}` };
        } catch (e) {
          errorData = {
            message: `HTTP error ${response.status}: ${response.statusText}. Non-JSON response: ${responseBodyText}`,
          };
        }
        console.error(
          "updateTaskStatusInBackend: API Error Data on task update:",
          errorData,
          "Status Code:",
          response.status
        );
        const displayError =
          errorData.message ||
          (errorData.errors && Object.values(errorData.errors).flat().join(", ")) ||
          `Server error ${response.status}`;
        toast.error(`Failed to update task: ${displayError}`);
        return rejectWithValue(displayError);
      }

      const updatedTaskFromApi = responseBodyText
        ? JSON.parse(responseBodyText)
        : null;

      if (
        !updatedTaskFromApi ||
        !updatedTaskFromApi.task ||
        typeof updatedTaskFromApi.task !== "object"
      ) {
        console.error(
          "updateTaskStatusInBackend: Successful API response, but 'task' field is missing, null, or not an object.",
          updatedTaskFromApi
        );
        toast.error("Task update response from server was incomplete or malformed.");
        return rejectWithValue(
          "Incomplete or malformed data from server after task update."
        );
      }

      toast.success(updatedTaskFromApi.message || "Task updated successfully!");
      // Return taskId (backendId), newStatus, and the fully updated task data from the API
      return { backendTaskId: taskId, newStatus, updatedTaskDataFromApi: updatedTaskFromApi.task };
    } catch (error) {
      console.error(
        "updateTaskStatusInBackend: Error during fetch/PUT operation:",
        error.message,
        error
      );
      toast.error(`Error updating task: ${error.message}`);
      return rejectWithValue(error.message);
    }
  }
);

// NEW THUNK FOR DELETING TASK FROM BACKEND
export const deleteTaskFromBackend = createAsyncThunk(
  "kanban/deleteTaskFromBackend",
  async ({ backendTaskId, frontendTaskId }, { rejectWithValue }) => {
    // frontendTaskId is the 'id' used in the Redux state (e.g., task.id)
    // backendTaskId is the 'id' the API expects (e.g., task.apiData.id)
    // In your case, they seem to be the same (String(task.id))
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      console.error("deleteTaskFromBackend: No token found");
      return rejectWithValue("No token found");
    }

    try {
      const response = await fetch(
        `https://demo.aentora.com/backend/public/api/admin/project-task/${backendTaskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Optional for DELETE if no body
            Accept: "application/json",
          },
        }
      );
      
      const responseBodyText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
            errorData = responseBodyText ? JSON.parse(responseBodyText) : { message: `HTTP error ${response.status}` };
        } catch (e) {
            errorData = { message: `HTTP error ${response.status}. Non-JSON response: ${responseBodyText}` };
        }
        console.error("deleteTaskFromBackend: API Error:", errorData, "Status:", response.status);
        const displayError = errorData.message || (errorData.errors && Object.values(errorData.errors).flat().join(', ')) || `Failed to delete task (Server error ${response.status})`;
        toast.error(displayError);
        return rejectWithValue(displayError);
      }
      
      // Even if successful, check if there's a message in the body
      let successMessage = "Task deleted successfully!";
      if (responseBodyText) {
        try {
            const parsedBody = JSON.parse(responseBodyText);
            if (parsedBody && parsedBody.message) {
                successMessage = parsedBody.message;
            }
        } catch (e) {
            // Not JSON, or no message field, use default
        }
      }

      toast.success(successMessage);
      return { frontendTaskId }; // Pass the frontend ID for reducer
    } catch (error) {
      console.error("deleteTaskFromBackend: Network/Request Error:", error);
      toast.error(error.message || "An unexpected error occurred while deleting the task.");
      return rejectWithValue(error.message || "Network error");
    }
  }
);


export const appKanbanSlice = createSlice({
  name: "kanban",
  initialState: {
    columModal: false, // Note: typo in original, should be columnModal
    taskModal: false,
    isLoading: true,
    openTaskId: null, // Stores columnId when adding task
    editModal: false, // For task edit modal
    editItem: {}, // Task data for editing
    columns: [],
    error: null,
  },
  reducers: {
    sort: (state, action) => {
      const { source, destination, draggableId, type } = action.payload;
      if (!destination) return;

      if (type === "list") { // Column dragging
        const items = Array.from(state.columns);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        state.columns = items;
        return;
      }

      if (type === "task") { // Task dragging
        const sourceColumn = state.columns.find(
          (column) => String(column.id) === String(source.droppableId)
        );
        const destColumn = state.columns.find(
          (column) => String(column.id) === String(destination.droppableId)
        );

        if (!sourceColumn || !destColumn) {
          console.error("Sort Reducer: Source or destination column not found.");
          return;
        }

        const sourceItems = [...sourceColumn.tasks];
        const destItems =
          source.droppableId === destination.droppableId
            ? sourceItems // Modifying the same list
            : [...destColumn.tasks];

        const [removedTask] = sourceItems.splice(source.index, 1);
        if (!removedTask) {
          console.error("Sort Reducer: Could not remove task from source column.");
          return;
        }
        destItems.splice(destination.index, 0, removedTask);

        state.columns = state.columns.map((col) => {
          if (String(col.id) === String(source.droppableId)) {
            return { ...col, tasks: sourceItems };
          }
          if (
            String(col.id) === String(destination.droppableId) &&
            String(source.droppableId) !== String(destination.droppableId)
          ) {
            return { ...col, tasks: destItems };
          }
          // If moving within the same column, sourceItems already has the updated list
          if (
            String(col.id) === String(destination.droppableId) &&
            String(source.droppableId) === String(destination.droppableId)
          ) {
             return { ...col, tasks: destItems }; // or sourceItems
          }
          return col;
        });

        // Optimistically update task_status in apiData if task moved columns
        if (
          String(source.droppableId) !== String(destination.droppableId) &&
          removedTask.apiData
        ) {
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === destColumn.name
          );
          if (newStatusKey) {
            // Find the task in its new column and update its apiData.task_status
            const targetColIndex = state.columns.findIndex(c => String(c.id) === String(destination.droppableId));
            if (targetColIndex !== -1) {
                const taskInNewColIndex = state.columns[targetColIndex].tasks.findIndex(t => String(t.id) === String(removedTask.id));
                if (taskInNewColIndex !== -1 && state.columns[targetColIndex].tasks[taskInNewColIndex].apiData) {
                    state.columns[targetColIndex].tasks[taskInNewColIndex].apiData = {
                        ...state.columns[targetColIndex].tasks[taskInNewColIndex].apiData,
                        task_status: newStatusKey, // Optimistic update
                    };
                }
            }
          }
        }
      }
    },
    toggleColumnModal: (state, action) => {
      state.columModal = action.payload; // Keep original 'columModal' if used elsewhere, or fix to 'columnModal'
    },
    addColumnBoard: (state, action) => {
      // ... (your existing logic, seems okay for frontend only)
      // Consider a thunk for backend persistence if needed.
      const newColumnName = action.payload.title;
      const predefinedStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
        (key) =>
          STATUS_TO_COLUMN_MAP[key].name.toLowerCase() ===
          newColumnName.toLowerCase()
      );

      let color = action.payload.color;
      let order = state.columns.length > 0 ? Math.max(...state.columns.map((c) => c.order)) + 1 : 1;

      if (predefinedStatusKey && STATUS_TO_COLUMN_MAP[predefinedStatusKey]) {
        color = STATUS_TO_COLUMN_MAP[predefinedStatusKey].color;
        order = STATUS_TO_COLUMN_MAP[predefinedStatusKey].order;
        if (state.columns.some(col => col.name.toLowerCase() === STATUS_TO_COLUMN_MAP[predefinedStatusKey].name.toLowerCase())) {
            toast.error(`Column "${STATUS_TO_COLUMN_MAP[predefinedStatusKey].name}" already exists.`);
            return;
        }
      }

      state.columns.push({
        id: uuidv4(),
        name: newColumnName,
        color: color,
        tasks: [],
        order: order,
      });
      state.columns.sort((a,b) => a.order - b.order);
      toast.success("Board Added Successfully", { autoClose: 1500 });
    },
    deleteColumnBoard: (state, action) => {
      // ... (your existing logic, frontend only)
      state.columns = state.columns.filter(
        (column) => String(column.id) !== String(action.payload)
      );
      toast.warn("Board Deleted Successfully (Frontend Only)", { autoClose: 1500 });
    },
    toggleTaskModal: (state, action) => {
      // Updated to handle more complex payload if needed for edit/add modes
      if (typeof action.payload === 'object' && action.payload !== null) {
          state.taskModal = action.payload.open;
          state.openTaskId = action.payload.open ? action.payload.columnId : null; // Store columnId for adding
          if (action.payload.taskData && action.payload.mode === 'edit') {
              state.editModal = action.payload.open;
              state.editItem = action.payload.open ? action.payload.taskData : {};
          } else if (!action.payload.open) {
              state.editModal = false;
              state.editItem = {};
          }
      } else if (typeof action.payload === 'boolean') { // Original simple toggle
          state.taskModal = action.payload;
          state.openTaskId = action.payload ? state.openTaskId : null; // Clear columnId if closing
          if (!action.payload) {
              state.editModal = false;
              state.editItem = {};
          }
      }
    },
    addTask: (state, action) => {
      // ... (your existing logic, frontend only)
      // Consider a thunk for backend persistence.
      const column = state.columns.find((col) => String(col.id) === String(state.openTaskId));
      if (column) {
        const taskStatusKey =
          Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === column.name
          ) || "Todo";

        const currentProjectId = action.payload.projectId;
        if (!currentProjectId) {
            toast.error("Project ID is missing. Cannot add task.");
            console.error("addTask Reducer: projectId is missing in payload", action.payload);
            state.taskModal = false;
            state.openTaskId = null;
            return;
        }

        const newTask = {
          id: uuidv4(), // Temporary frontend ID for new tasks
          name: action.payload.name,
          des: action.payload.des,
          startDate: action.payload.startDate || new Date().toISOString().split("T")[0],
          endDate: action.payload.endDate,
          progress: action.payload.progress || 0,
          assignee: action.payload.assignee || [],
          category: action.payload.category || [],
          apiData: { // This structure is for a *potential* backend save
            task_title: action.payload.name,
            task_description: action.payload.des,
            due_date: action.payload.endDate,
            task_status: taskStatusKey,
            project_id: currentProjectId,
            assignees: (action.payload.assignee || []).map(a => typeof a === 'object' && a.id !== undefined ? a.id : a),
            categories: (action.payload.category || []).map(c => typeof c === 'object' && c.id !== undefined ? c.id : c),
            // Note: A newly added task won't have a backend ID in apiData.id yet
          },
        };
        column.tasks.push(newTask);
        toast.success("Task Added (Frontend Only - Implement Backend Save)", { autoClose: 1500 });
      }
      state.taskModal = false;
      state.openTaskId = null;
    },
    // deleteTask: (state, action) => { // OLD - This is frontend only. Call deleteTaskFromBackend thunk instead.
    //   const taskIdToDelete = action.payload;
    //   // ... (rest of your old logic)
    //   toast.warn("Task Deleted (Frontend Only - Call Backend Thunk for Persistent Delete)", { autoClose: 1500 });
    // },
    toggleEditModal: (state, action) => {
      // Payload: { task?: object, editModal: boolean }
      // `task` is the full task object from the card (including id, apiData etc.)
      const { task, editModal } = action.payload;
      state.editModal = editModal;
      state.editItem = editModal && task ? task : {};
    },
    updateTask: (state, action) => {
      // ... (your existing logic, frontend only)
      // Consider a thunk for backend persistence. This overlaps with updateTaskStatusInBackend if only status changes.
      const updatedTaskPayload = action.payload;
      let taskFoundAndUpdated = false;

      state.columns = state.columns.map((column) => {
        const taskIndex = column.tasks.findIndex(
          // If task.id is from backend, use that. If it's a new temp UUID, it might differ from payload ID.
          (task) => String(task.id) === String(updatedTaskPayload.id) || (task.apiData && String(task.apiData.id) === String(updatedTaskPayload.id))
        );
        if (taskIndex !== -1) {
          const existingTask = column.tasks[taskIndex];
          const newName = updatedTaskPayload.name !== undefined ? updatedTaskPayload.name : existingTask.name;
          const newDes = updatedTaskPayload.des !== undefined ? updatedTaskPayload.des : existingTask.des;
          const newEndDate = updatedTaskPayload.endDate !== undefined ? updatedTaskPayload.endDate : existingTask.endDate;

          column.tasks[taskIndex] = {
            ...existingTask,
            name: newName,
            des: newDes,
            startDate: updatedTaskPayload.startDate !== undefined ? updatedTaskPayload.startDate : existingTask.startDate,
            endDate: newEndDate,
            progress:
              updatedTaskPayload.progress !== undefined
                ? updatedTaskPayload.progress
                : existingTask.progress,
            assignee: updatedTaskPayload.assignee !== undefined ? updatedTaskPayload.assignee : existingTask.assignee,
            category: updatedTaskPayload.category !== undefined ? updatedTaskPayload.category : existingTask.category,
            apiData: {
              ...(existingTask.apiData || {}),
              id: existingTask.apiData?.id || updatedTaskPayload.id, // Preserve backend ID if it exists
              task_title: newName,
              task_description: newDes,
              due_date: newEndDate,
              assignees: (updatedTaskPayload.assignee !== undefined ? updatedTaskPayload.assignee : (existingTask.assignee || [])).map(a => typeof a === 'object' && a.id !== undefined ? a.id : a),
              categories: (updatedTaskPayload.category !== undefined ? updatedTaskPayload.category : (existingTask.category || [])).map(c => typeof c === 'object' && c.id !== undefined ? c.id : c),
              progress: updatedTaskPayload.progress !== undefined ? updatedTaskPayload.progress : existingTask.progress,
              // task_status would be updated by updateTaskStatusInBackend if changed via drag-drop
            },
          };
          taskFoundAndUpdated = true;
        }
        return column;
      });
      if (taskFoundAndUpdated) {
        toast.info("Task Updated (Frontend Only - Implement Backend Save)", { autoClose: 1500 });
      }
      state.editModal = false;
      state.editItem = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKanbanData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKanbanData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.columns = action.payload; // Payload is the array of columns
        state.error = null;
      })
      .addCase(fetchKanbanData.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch Kanban data";
        toast.error(`Error fetching board: ${state.error}`, {
          autoClose: 3000,
        });
      })
      .addCase(updateTaskStatusInBackend.pending, (state) => {
        // Optionally add task-specific loading indicator
        // For example: find the task and set a loading flag on it
      })
      .addCase(updateTaskStatusInBackend.fulfilled, (state, action) => {
        const { backendTaskId, updatedTaskDataFromApi } = action.payload;
        
        if (!updatedTaskDataFromApi || !updatedTaskDataFromApi.id) {
            console.warn("extraReducers: updateTaskStatusInBackend.fulfilled - updatedTaskDataFromApi is invalid or missing 'id'.");
            // Toast is already handled in thunk if error
            return;
        }
        
        let taskFoundAndUpdatedInRedux = false;
        state.columns = state.columns.map(column => {
            // Check if the task is in this column based on its apiData.id
            const taskIndex = column.tasks.findIndex(
                task => task.apiData && String(task.apiData.id) === String(backendTaskId) 
            );

            if (taskIndex !== -1) {
                const oldTask = column.tasks[taskIndex];
                let tasksCopy = [...column.tasks];

                // Update the task with data from the API response
                tasksCopy[taskIndex] = {
                    ...oldTask, 
                    id: String(updatedTaskDataFromApi.id) || oldTask.id, // Keep frontend ID consistent if different
                    name: updatedTaskDataFromApi.task_title,
                    des: updatedTaskDataFromApi.task_description,
                    startDate: updatedTaskDataFromApi.created_at || oldTask.startDate, 
                    endDate: updatedTaskDataFromApi.due_date,
                    progress: updatedTaskDataFromApi.progress !== undefined ? updatedTaskDataFromApi.progress : oldTask.progress,
                    assignee: updatedTaskDataFromApi.assignees !== undefined ? updatedTaskDataFromApi.assignees : oldTask.assignee,
                    category: updatedTaskDataFromApi.categories !== undefined ? updatedTaskDataFromApi.categories : oldTask.category, 
                    apiData: { ...oldTask.apiData, ...updatedTaskDataFromApi }, // Crucially merge with full API response
                };
                
                // Verify that the status in Redux (after optimistic update) matches the final server status.
                // If not, the server's status is the source of truth.
                // The `sort` reducer should have optimistically set `apiData.task_status`.
                // If `updatedTaskDataFromApi.task_status` differs, the optimistic update was correct or server changed it again.
                // The merge `...oldTask.apiData, ...updatedTaskDataFromApi` handles this.
                
                taskFoundAndUpdatedInRedux = true;
                return { ...column, tasks: tasksCopy };
            }
            return column; 
        });

        if (!taskFoundAndUpdatedInRedux) {
            console.warn(`extraReducers: Task ${backendTaskId} (API ID) updated in backend, but NOT FOUND in Redux store for final sync.`);
        }
      })
      .addCase(updateTaskStatusInBackend.rejected, (state, action) => {
        console.error(
          "extraReducers: updateTaskStatusInBackend.rejected - Payload:",
          action.payload,
          "Error:",
          action.error,
          `For Task API ID: ${action.meta.arg.taskId}`
        );
        // Toast is handled in the thunk.
        // You might want to revert the optimistic update here if it's causing issues.
        // This would involve finding the task and moving it back to its original column/status.
        // For now, logging is sufficient.
      })

      // EXTRA REDUCERS FOR deleteTaskFromBackend
      .addCase(deleteTaskFromBackend.pending, (state) => {
        // Optionally set a loading state for the task being deleted
      })
      .addCase(deleteTaskFromBackend.fulfilled, (state, action) => {
        const { frontendTaskId } = action.payload; // This is task.id from the component
        let taskActuallyDeleted = false;
        state.columns = state.columns.map((column) => {
          const initialTaskCount = column.tasks.length;
          const updatedTasks = column.tasks.filter(
            (task) => String(task.id) !== String(frontendTaskId)
          );
          if (updatedTasks.length < initialTaskCount) {
            taskActuallyDeleted = true;
          }
          return { ...column, tasks: updatedTasks };
        });
        if (!taskActuallyDeleted) {
          console.warn(`deleteTaskFromBackend.fulfilled: Task with frontendId ${frontendTaskId} was not found in any column for removal.`);
        }
      })
      .addCase(deleteTaskFromBackend.rejected, (state, action) => {
        // Error already toasted in thunk.
        console.error("deleteTaskFromBackend.rejected in extraReducers:", action.payload, `Frontend ID: ${action.meta.arg.frontendTaskId}`);
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
  // deleteTask, // Keep this commented out or remove. Use deleteTaskFromBackend thunk.
  toggleEditModal,
  updateTask,
} = appKanbanSlice.actions;

export default appKanbanSlice.reducer;