import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const API_ROOT = `${import.meta.env.VITE_BACKEND_BASE_URL}/api`;

const getProjectPath = () => {
  const role = getApiPrefix();

  if (role === "employee") {
    return "/employee/project";
  }
  if (role === "customer") {
    return "/customer/project";
  }
  return "/admin/project";
};

const formatProjectFromAPI = (project) => ({
  id: project.id,
  name: project.project_name || "Unnamed Project",
  des: project.project_description || "",
  startDate: project.start_date || new Date().toISOString().split("T")[0],
  endDate: project.due_date,
  progress: typeof project.progress === "number" ? project.progress : project.project_progress || 0,
  customer_id: project.customer_id || null,
  status: project.status?.toLowerCase() || "ongoing",
  project_assignees: project.project_assignees || project.members || [],
  members: project.project_assignees || project.members || [],
});

export const fetchProjectsAPI = createAsyncThunk(
  "project/fetchProjects",
  async (page = 1, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      const response = await axios.get(`${API_ROOT}${path}?page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const responseData = response.data;
      if (!responseData || !Array.isArray(responseData.data)) {
        return rejectWithValue("Invalid project data structure from API.");
      }
      const formattedProjects = responseData.data.map(formatProjectFromAPI);
      return {
        projects: formattedProjects,
        meta: {
          currentPage: responseData.current_page,
          totalPages: responseData.last_page,
          totalProjects: responseData.total,
        },
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to load projects.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const addProjectAPI = createAsyncThunk(
  "project/addProject",
  async (projectData, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      const response = await axios.post(`${API_ROOT}${path}`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data && (response.status === 201 || response.status === 200)) {
        toast.success("Project added successfully!");
        dispatch(fetchProjectsAPI(1));
        if (response.data.data && typeof response.data.data === "object") {
          return formatProjectFromAPI(response.data.data);
        }
        return response.data;
      } else {
        const errorMsg = response.data?.message || "Failed to add project.";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Could not add project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const saveEditedProjectAPI = createAsyncThunk(
  "project/saveEditedProject",
  async (projectData, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      const response = await axios.put(`${API_ROOT}${path}/${projectData.id}`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.data && response.status === 200) {
        toast.success("Project updated successfully!");
        const { currentPage } = getState().project;
        dispatch(fetchProjectsAPI(currentPage));
        if (response.data.data && typeof response.data.data === "object") {
          return formatProjectFromAPI(response.data.data);
        }
        return { id: projectData.id, ...projectData };
      } else {
        const errorMsg = response.data?.message || "Failed to update project.";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Could not update project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteProjectAPI = createAsyncThunk(
  "project/deleteProjectAPI",
  async (projectId, { dispatch, getState, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found");

      const path = getProjectPath();
      const response = await axios.delete(`${API_ROOT}${path}/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.status === 200 || response.status === 204) {
        toast.success("Project deleted successfully!");
        const { currentPage, projects } = getState().project;
        if (projects.length === 1 && currentPage > 1) {
          dispatch(fetchProjectsAPI(currentPage - 1));
        } else {
          dispatch(fetchProjectsAPI(currentPage));
        }
        return projectId;
      } else {
        const errorMsg = response.data?.message || "Failed to delete project.";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const appProjectSlice = createSlice({
  name: "project",
  initialState: {
    projects: [],
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
    isLoading: false,
    isAdding: false,
    isUpdating: false,
    isDeleting: false,
    error: null,
    openProjectModal: false,
    editModal: false,
    editItem: {},
  },
  reducers: {
    toggleAddModal: (state, action) => {
      state.openProjectModal = action.payload;
      if (!action.payload) state.error = null;
    },
    setEditModalAndItem: (state, action) => {
      state.editModal = action.payload.open;
      if (action.payload.open && action.payload.project) {
        state.editItem = action.payload.project;
      } else {
        state.editItem = {};
      }
      if (!action.payload.open) state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectsAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.currentPage = action.payload.meta.currentPage;
        state.totalPages = action.payload.meta.totalPages;
        state.totalProjects = action.payload.meta.totalProjects;
      })
      .addCase(fetchProjectsAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.projects = [];
        state.currentPage = 1;
        state.totalPages = 1;
        state.totalProjects = 0;
      })
      .addCase(addProjectAPI.pending, (state) => {
        state.isAdding = true;
      })
      .addCase(addProjectAPI.fulfilled, (state) => {
        state.isAdding = false;
        state.openProjectModal = false;
      })
      .addCase(addProjectAPI.rejected, (state, action) => {
        state.isAdding = false;
        state.error = action.payload;
      })
      .addCase(saveEditedProjectAPI.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(saveEditedProjectAPI.fulfilled, (state) => {
        state.isUpdating = false;
        state.editModal = false;
      })
      .addCase(saveEditedProjectAPI.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      .addCase(deleteProjectAPI.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteProjectAPI.fulfilled, (state) => {
        state.isDeleting = false;
      })
      .addCase(deleteProjectAPI.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      });
  },
});

export const { toggleAddModal, setEditModalAndItem } = appProjectSlice.actions;

export default appProjectSlice.reducer;