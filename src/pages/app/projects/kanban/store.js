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
};

export const fetchKanbanData = createAsyncThunk(
  "kanban/fetchKanbanData", // Slice name "kanban"
  async (projectId, { rejectWithValue }) => {
    // console.log(`fetchKanbanData: Thunk started for projectId: ${projectId}`); // Keep for debugging
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
        console.error("fetchKanbanData: API response not OK.", errorData, "Status:", response.status);
        throw new Error(errorData.message || `Failed to fetch Kanban data (${response.status})`);
      }
      const apiResponse = await response.json();
      // console.log("fetchKanbanData: Raw API Response:", JSON.stringify(apiResponse, null, 2));
     
      const columnsMap = {};
      Object.keys(STATUS_TO_COLUMN_MAP).forEach((statusKey) => {
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
        : (apiResponse && Array.isArray(apiResponse.data)) 
            ? apiResponse.data 
            : [];
      // console.log("fetchKanbanData: tasksToProcess (derived from API response):", JSON.stringify(tasksToProcess, null, 2));

      if (Array.isArray(tasksToProcess) && tasksToProcess.length > 0) {
        tasksToProcess.forEach((task) => { 
          const status = task.task_status; 
          if (columnsMap[status]) { 
            columnsMap[status].tasks.push({
              id: String(task.id) || uuidv4(), 
              name: task.task_title,
              des: task.task_description,
              startDate:
                task.created_at || new Date().toISOString().split("T")[0],
              endDate: task.due_date,
              progress: task.progress || 0,
              assignee: task.assignees || [], 
              category: task.categories || [], 
              apiData: task, 
            });
          } else {
            // console.warn( // Keep for debugging if tasks are not appearing
            //   `fetchKanbanData: Status '${status}' for task ID: ${task.id}, Title: '${task.task_title}' DOES NOT MAP to any column. Expected keys in STATUS_TO_COLUMN_MAP: ${Object.keys(STATUS_TO_COLUMN_MAP).join(', ')}.`
            // );
          }
        });
      } else if (Array.isArray(tasksToProcess) && tasksToProcess.length === 0) {
        // console.log("fetchKanbanData: tasksToProcess is an empty array."); // Keep for debugging
      } else {
        // console.error("fetchKanbanData: tasksToProcess is not an array or is undefined."); // Keep for debugging
      }

      const sortedColumns = Object.values(columnsMap).sort(
        (a, b) => a.order - b.order
      );
      // console.log("fetchKanbanData: Sorted columns being returned from thunk:", JSON.stringify(sortedColumns, null, 2));
    
      return sortedColumns;
    } catch (error) {
      console.error("fetchKanbanData: Error in thunk execution:", error.message, error);
      return rejectWithValue(error.message || "Unknown error in fetchKanbanData thunk");
    }
  }
);

export const updateTaskStatusInBackend = createAsyncThunk(
  "kanban/updateTaskStatusInBackend", // Slice name "kanban"
  async ({ taskId, taskData, newStatus }, { rejectWithValue }) => {
    // console.log(`updateTaskStatusInBackend: Thunk started for Task API ID: ${taskId}, New Status: ${newStatus}`); // Keep for debugging

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Authentication error. Please log in again.");
      console.error("updateTaskStatusInBackend: No token found");
      return rejectWithValue("No token found");
    }

    const mapToIds = (items) => {
      if (!Array.isArray(items)) return [];
      return items.map(item => 
        (typeof item === 'object' && item !== null && item.id !== undefined) ? item.id : item
      ).filter(id => id !== null && id !== undefined);
    };

    const putPayload = {
      task_title: taskData.task_title,
      task_description: taskData.task_description,
      due_date: taskData.due_date,
      task_status: newStatus, 
      project_id: taskData.project_id,
      assignees: mapToIds(taskData.assignees),
      categories: mapToIds(taskData.categories),
    };
    
    if (putPayload.project_id === undefined || putPayload.project_id === null) {
        const errorMsg = "CRITICAL: project_id is missing in PUT payload for task update.";
        console.error(errorMsg, "TaskData received for update:", taskData);
        toast.error("Error: Project ID missing for task update.", { autoClose: 3000 });
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
            errorData = responseBodyText ? JSON.parse(responseBodyText) : { message: `HTTP error ${response.status}: ${response.statusText}` };
        } catch (e) {
            errorData = { message: `HTTP error ${response.status}: ${response.statusText}. Non-JSON response: ${responseBodyText}` };
        }
        console.error("updateTaskStatusInBackend: API Error Data on task update:", errorData, "Status Code:", response.status);
        const displayError = errorData.message || (errorData.errors && Object.values(errorData.errors).flat().join(', ')) || `Server error ${response.status}`;
        toast.error(`Failed to update task: ${displayError}`);
        return rejectWithValue(displayError);
      }

      const updatedTaskFromApi = responseBodyText ? JSON.parse(responseBodyText) : null;
      // console.log("updateTaskStatusInBackend: Parsed successful API response:", JSON.stringify(updatedTaskFromApi, null, 2)); // Keep for debugging

      if (!updatedTaskFromApi || !updatedTaskFromApi.task || typeof updatedTaskFromApi.task !== 'object') {
        console.error("updateTaskStatusInBackend: Successful API response, but 'task' field is missing, null, or not an object.", updatedTaskFromApi);
        toast.error("Task update response from server was incomplete or malformed.");
        return rejectWithValue("Incomplete or malformed data from server after task update.");
      }

      toast.success(updatedTaskFromApi.message || "Task updated successfully!");
      return { taskId, newStatus, updatedTaskData: updatedTaskFromApi.task };
    } catch (error) {
      console.error("updateTaskStatusInBackend: Error during fetch/PUT operation:", error.message, error);
      toast.error(`Error updating task: ${error.message}`);
      return rejectWithValue(error.message);
    }
  }
);

export const appKanbanSlice = createSlice({
  name: "kanban", // IMPORTANT: This should match the key in your rootReducer
  initialState: {
    columModal: false,
    taskModal: false,
    isLoading: true, 
    openTaskId: null, 
    editModal: false,
    editItem: {}, 
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
            ? sourceItems
            : [...destColumn.tasks];

        const [removedTask] = sourceItems.splice(source.index, 1);
        if (!removedTask) {
            console.error("Sort Reducer: Could not remove task from source column.");
            return;
        }
        destItems.splice(destination.index, 0, removedTask);

        state.columns = state.columns.map(col => {
          if (String(col.id) === String(source.droppableId)) {
            return { ...col, tasks: sourceItems };
          }
          if (String(col.id) === String(destination.droppableId) && String(source.droppableId) !== String(destination.droppableId)) {
            return { ...col, tasks: destItems };
          }
          if (String(col.id) === String(destination.droppableId) && String(source.droppableId) === String(destination.droppableId)) {
             return { ...col, tasks: destItems };
          }
          return col;
        });

        if (String(source.droppableId) !== String(destination.droppableId) && removedTask.apiData) {
          const newStatusKey = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === destColumn.name
          );
          if (newStatusKey) {
            const targetColIndex = state.columns.findIndex(c => String(c.id) === String(destination.droppableId));
            if(targetColIndex !== -1) {
                const taskInNewColIndex = state.columns[targetColIndex].tasks.findIndex(t => String(t.id) === String(removedTask.id));
                if(taskInNewColIndex !== -1 && state.columns[targetColIndex].tasks[taskInNewColIndex].apiData) { 
                    state.columns[targetColIndex].tasks[taskInNewColIndex].apiData = {
                        ...state.columns[targetColIndex].tasks[taskInNewColIndex].apiData,
                        task_status: newStatusKey,
                    };
                } else {
                     // console.warn(`Sort Reducer: Could not find task for optimistic update.`); // Keep for debugging
                }
            }
          } else {
            // console.warn(`Sort Reducer: Could not map column to status key.`); // Keep for debugging
          }
        }
      }
    },
    toggleColumnModal: (state, action) => {
      state.columModal = action.payload;
    },
    addColumnBoard: (state, action) => {
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
      state.columns = state.columns.filter(
        (column) => String(column.id) !== String(action.payload)
      );
      toast.warn("Board Deleted Successfully", { autoClose: 1500 });
    },
    toggleTaskModal: (state, action) => {
      const { columnId, open } = action.payload;
      state.taskModal = open;
      state.openTaskId = open ? columnId : null;
    },
    addTask: (state, action) => {
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
          id: uuidv4(), 
          name: action.payload.name,
          des: action.payload.des,
          startDate: action.payload.startDate || new Date().toISOString().split("T")[0],
          endDate: action.payload.endDate,
          progress: action.payload.progress || 0,
          assignee: action.payload.assignee || [],
          category: action.payload.category || [],
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
    deleteTask: (state, action) => {
      const taskIdToDelete = action.payload; 
      let taskDeleted = false;
      state.columns = state.columns.map((column) => {
        const initialTaskCount = column.tasks.length;
        // const taskToRemove = column.tasks.find(task => String(task.id) === String(taskIdToDelete)); // Not used currently
        column.tasks = column.tasks.filter(
          (task) => String(task.id) !== String(taskIdToDelete)
        );
        if (column.tasks.length < initialTaskCount) {
          taskDeleted = true;
        }
        return column;
      });

      if (taskDeleted) {
        toast.warn("Task Deleted (Frontend Only - Implement Backend Delete)", { autoClose: 1500 });
      }
    },
    toggleEditModal: (state, action) => {
      const { task, editModal } = action.payload; 
      state.editModal = editModal;
      state.editItem = editModal ? task : {};
    },
    updateTask: (state, action) => {
      const updatedTaskPayload = action.payload; 
      let taskFoundAndUpdated = false;

      state.columns = state.columns.map((column) => {
        const taskIndex = column.tasks.findIndex(
          (task) => String(task.id) === String(updatedTaskPayload.id)
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
              task_title: newName,
              task_description: newDes,
              due_date: newEndDate,
              assignees: (updatedTaskPayload.assignee !== undefined ? updatedTaskPayload.assignee : existingTask.assignee).map(a => typeof a === 'object' && a.id !== undefined ? a.id : a),
              categories: (updatedTaskPayload.category !== undefined ? updatedTaskPayload.category : existingTask.category).map(c => typeof c === 'object' && c.id !== undefined ? c.id : c),
              progress: updatedTaskPayload.progress !== undefined ? updatedTaskPayload.progress : existingTask.progress,
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
        state.columns = action.payload; 
        state.error = null;
      })
      .addCase(fetchKanbanData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || "Failed to fetch Kanban data";
        toast.error(`Error fetching board: ${state.error}`, { autoClose: 3000 });
      })
      .addCase(updateTaskStatusInBackend.pending, (state) => {
        // Optionally add task-specific loading indicator
      })
      .addCase(updateTaskStatusInBackend.fulfilled, (state, action) => {
        const { taskId, updatedTaskData } = action.payload; 
        // console.log(`extraReducers: updateTaskStatusInBackend.fulfilled (slice: kanban) for API ID: ${taskId}. Received updatedTaskData:`, JSON.stringify(updatedTaskData, null, 2)); // Keep for debugging
        
        if (!updatedTaskData || !updatedTaskData.id) {
            console.warn("extraReducers: updateTaskStatusInBackend.fulfilled (slice: kanban) - updatedTaskData is invalid or missing 'id'.");
            toast.error("Failed to sync task update from server (data structure issue).", {autoClose: 3000});
            return;
        }
        
        let taskFoundAndUpdatedInRedux = false;
        state.columns = state.columns.map(column => {
            const taskIndex = column.tasks.findIndex(
                task => task.apiData && String(task.apiData.id) === String(taskId) 
            );

            if (taskIndex !== -1) {
                const oldTask = column.tasks[taskIndex];
                let tasksCopy = [...column.tasks];
                tasksCopy[taskIndex] = {
                    ...oldTask, 
                    id: String(updatedTaskData.id) || oldTask.id, 
                    name: updatedTaskData.task_title,
                    des: updatedTaskData.task_description,
                    startDate: updatedTaskData.created_at || oldTask.startDate, 
                    endDate: updatedTaskData.due_date,
                    progress: updatedTaskData.progress !== undefined ? updatedTaskData.progress : oldTask.progress,
                    assignee: updatedTaskData.assignees !== undefined ? updatedTaskData.assignees : oldTask.assignee,
                    category: updatedTaskData.categories !== undefined ? updatedTaskData.categories : oldTask.category, 
                    apiData: { ...oldTask.apiData, ...updatedTaskData }, 
                };
                
                if (tasksCopy[taskIndex].apiData.task_status !== updatedTaskData.task_status) {
                    // console.warn(`extraReducers: Task ${taskId} (slice: kanban) status discrepancy. Optimistic: ${tasksCopy[taskIndex].apiData.task_status}, API: ${updatedTaskData.task_status}.`); // Keep for debugging
                }
                taskFoundAndUpdatedInRedux = true;
                return { ...column, tasks: tasksCopy };
            }
            return column; 
        });

        if (!taskFoundAndUpdatedInRedux) {
            // console.warn(`extraReducers: Task ${taskId} (API ID) updated in backend, but NOT FOUND in Redux store (slice: kanban).`); // Keep for debugging
        }
      })
      .addCase(updateTaskStatusInBackend.rejected, (state, action) => {
        console.error("extraReducers: updateTaskStatusInBackend.rejected (slice: kanban) - Payload:", action.payload, "Error:", action.error, `For Task API ID: ${action.meta.arg.taskId}`);
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
  deleteTask,
  toggleEditModal,
  updateTask,
} = appKanbanSlice.actions;

export default appKanbanSlice.reducer;