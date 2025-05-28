// appKanbanSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import Cookies from "js-cookie";



const STATUS_TO_COLUMN_MAP = {
  Todo: { name: "To Do", color: "#4669FA", order: 1 },
  "In Progress": { name: "In Progress", color: "#FA916B", order: 2 },
  Completed: { name: "Completed", color: "#50C793", order: 3 },
  
};

export const fetchKanbanData = createAsyncThunk(
  "appkanban/fetchKanbanData",
  async (projectId, { rejectWithValue }) => {
    const token = Cookies.get("token");
    if (!token) {
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
        throw new Error(errorData.message || "Failed to fetch Kanban data");
      }
      const apiTasks = await response.json();
      // Critical Log 1: Check the exact structure and status strings from your API
      console.log("API Raw Tasks (slice):", JSON.stringify(apiTasks, null, 2));

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

      const tasksToProcess = Array.isArray(apiTasks)
        ? apiTasks
        : apiTasks.data || []; // Ensure this points to your array of tasks

      if (Array.isArray(tasksToProcess)) {
        tasksToProcess.forEach((task) => {
          const status = task.task_status; // This is the string from your API
          // Critical Log 2: Check what status is being processed and if it's found
          console.log(`Processing Task ID: ${task.id}, API Status: '${status}', Found in map: ${!!columnsMap[status]}`);

          if (columnsMap[status]) { // This is where the match happens
            columnsMap[status].tasks.push({
              id: task.id || uuidv4(),
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
            // Critical Log 3: This warning tells you about mismatches
            console.warn(
              `Unknown task status: '${status}' for task ID: ${task.id}, Title: '${task.task_title}'. This task will not be displayed in a mapped column.`
            );
          }
        });
      } else {
        console.error("Fetched data (tasksToProcess) is not an array:", tasksToProcess);
      }

      const sortedColumns = Object.values(columnsMap).sort(
        (a, b) => a.order - b.order
      );
      // Critical Log 4: Check the final structure before it goes to Redux
      console.log("Transformed and Sorted Columns (slice):", JSON.stringify(sortedColumns, null, 2));
      return sortedColumns;
    } catch (error) {
      console.error("Fetch error in thunk:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// ... rest of your appKanbanSlice.js code (reducers, extraReducers, etc.) remains the same ...
// (Scroll down to keep the rest of your slice code as it was)

export const appKanbanSlice = createSlice({
  name: "appkanban",
  initialState: {
    columModal: false,
    taskModal: false,
    isLoading: false,
    openTaskId: null,
    editModal: false,
    editItem: {},
    columns: [],
    error: null,
  },
  reducers: {
    sort: (state, action) => {
      const { source, destination, type } = action.payload;
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
          (column) => column.id === source.droppableId
        );
        const destColumn = state.columns.find(
          (column) => column.id === destination.droppableId
        );

        if (!sourceColumn || !destColumn) {
          console.error("Source or destination column not found in sort");
          return;
        }

        const sourceItems = [...sourceColumn.tasks];
        const destItems =
          source.droppableId === destination.droppableId
            ? sourceItems
            : [...destColumn.tasks];

        const [removed] = sourceItems.splice(source.index, 1);
        destItems.splice(destination.index, 0, removed);

        if (source.droppableId !== destination.droppableId) {
          const newStatus = Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === destColumn.name
          );
          if (newStatus && removed.apiData) { // Check if apiData exists
            removed.apiData = { ...removed.apiData, task_status: newStatus };
            console.log(
              `Task ${removed.name} moved to ${destColumn.name}, status should be ${newStatus}`
            );
          } else if (!removed.apiData) {
            console.warn(`Task ${removed.name} moved but has no apiData to update status.`);
          }
        }

        sourceColumn.tasks = sourceItems;
        if (source.droppableId !== destination.droppableId) {
          destColumn.tasks = destItems;
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
      if (predefinedStatusKey && STATUS_TO_COLUMN_MAP[predefinedStatusKey]) {
        color = STATUS_TO_COLUMN_MAP[predefinedStatusKey].color;
      }

      state.columns.push({
        id: uuidv4(),
        name: newColumnName,
        color: color,
        tasks: [],
        order:
          state.columns.length > 0
            ? Math.max(...state.columns.map((c) => c.order)) + 1
            : 1,
      });
      toast.success("Board Added Successfully", {
        position: "top-right",
        autoClose: 1500,
        theme: "light",
      });
    },
    deleteColumnBoard: (state, action) => {
      const index = state.columns.findIndex(
        (column) => column.id === action.payload
      );
      if (index !== -1) {
        state.columns.splice(index, 1);
        toast.warn("Board Deleted Successfully", {
          position: "top-right",
          autoClose: 1500,
          theme: "light",
        });
      }
    },
    toggleTaskModal: (state, action) => {
      const { columnId, open } = action.payload;
      state.taskModal = open;
      state.openTaskId = columnId;
    },
    addTask: (state, action) => {
      const column = state.columns.find((col) => col.id === state.openTaskId);
      if (column) {
        const taskStatus =
          Object.keys(STATUS_TO_COLUMN_MAP).find(
            (key) => STATUS_TO_COLUMN_MAP[key].name === column.name
          ) || "Todo";

        const newTask = {
          id: uuidv4(),
          ...action.payload,
          apiData: {
            task_title: action.payload.name,
            task_description: action.payload.des,
            due_date: action.payload.endDate,
            task_status: taskStatus,
          },
        };
        column.tasks.push(newTask);
        toast.success("Task Added Successfully", {
          position: "top-right",
          autoClose: 1500,
          theme: "light",
        });
      }
      state.taskModal = false;
      state.openTaskId = null;
    },
    deleteTask: (state, action) => {
      const taskIdToDelete = action.payload;
      let taskDeleted = false;
      state.columns = state.columns.map((column) => {
        const initialTaskCount = column.tasks.length;
        column.tasks = column.tasks.filter(
          (task) => task.id !== taskIdToDelete
        );
        if (column.tasks.length < initialTaskCount) {
          taskDeleted = true;
        }
        return column;
      });

      if (taskDeleted) {
        toast.warn("Task Deleted Successfully", {
          position: "top-right",
          autoClose: 1500,
          theme: "light",
        });
      }
    },
    toggleEditModal: (state, action) => {
      const { task, editModal } = action.payload;
      state.editModal = editModal;
      state.editItem = task || {};
    },
    updateTask: (state, action) => {
      const updatedTaskPayload = action.payload;
      let taskUpdated = false;
      state.columns = state.columns.map((column) => {
        const taskIndex = column.tasks.findIndex(
          (task) => task.id === updatedTaskPayload.id
        );
        if (taskIndex !== -1) {
          const existingTask = column.tasks[taskIndex];
          column.tasks[taskIndex] = {
            ...existingTask,
            name: updatedTaskPayload.name || existingTask.name,
            des: updatedTaskPayload.des || existingTask.des,
            startDate: updatedTaskPayload.startDate || existingTask.startDate,
            endDate: updatedTaskPayload.endDate || existingTask.endDate,
            progress:
              updatedTaskPayload.progress !== undefined
                ? updatedTaskPayload.progress
                : existingTask.progress,
            assignee: updatedTaskPayload.assignee || existingTask.assignee,
            category: updatedTaskPayload.category || existingTask.category,
            apiData: {
              ...(existingTask.apiData || {}), // Ensure apiData exists
              task_title:
                updatedTaskPayload.name || (existingTask.apiData ? existingTask.apiData.task_title : ''),
              task_description:
                updatedTaskPayload.des || (existingTask.apiData ? existingTask.apiData.task_description : ''),
              due_date:
                updatedTaskPayload.endDate || (existingTask.apiData ? existingTask.apiData.due_date : ''),
            },
          };
          taskUpdated = true;
        }
        return column;
      });
      if (taskUpdated) {
        toast.info("Task Updated Successfully", {
          position: "top-right",
          autoClose: 1500,
          theme: "dark",
        });
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
        // This log is already here and good:
        // console.log(
        //   "Updated Redux columns state:",
        //   JSON.parse(JSON.stringify(state.columns))
        // );
      })
      .addCase(fetchKanbanData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch data";
        toast.error(`Error: ${state.error}`, {
          position: "top-right",
          autoClose: 2500,
          theme: "light",
        });
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