import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const API_ROOT = `${import.meta.env.VITE_BACKEND_BASE_URL}/api`;

const getProjectPath = () => {
  const role = getApiPrefix();

  switch (role) {
    case "employee":
      return "/employee/project";
    case "customer":
      return "/customer/project";
    case "member":
      return "/member/project";
    case "admin":
    default:
      return "/admin/project";
  }
};

const formatProjectFromAPI = (project) => ({
  id: project.id,
  name: project.project_name || "Unnamed Project",
  project_name: project.project_name || "Unnamed Project",
  project_description: project.project_description || "",
  start_date: project.start_date || new Date().toISOString().split("T")[0],
  due_date: project.due_date,
  progress: typeof project.progress === "number" ? project.progress : project.project_progress || 0,
  customer_id: project.customer_id || null,
  status: project.status || "ongoing",
  project_assignees: project.project_assignees || [],
  customer: project.customer || null,
});

// Async Thunks
export const fetchProjectsAPI = createAsyncThunk(
  "project/fetchProjects",
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      let url = `${API_ROOT}${path}`;
      const queryString = new URLSearchParams(params).toString();
      if (queryString) url += `?${queryString}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const responseData = response.data;
      let projectsArray;

      if (Array.isArray(responseData)) {
        projectsArray = responseData;
      } else if (responseData && Array.isArray(responseData.data)) {
        projectsArray = responseData.data;
      } else {
        return rejectWithValue("Invalid project data structure from API.");
      }

      const formattedProjects = projectsArray.map(formatProjectFromAPI);

      return {
        projects: formattedProjects,
        meta: {
          currentPage: 1,
          totalPages: 1,
          totalProjects: formattedProjects.length,
        },
      };
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load projects.";
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
        toast.success("Job added successfully!");
        dispatch(fetchProjectsAPI());
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
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Could not add project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const saveEditedProjectAPI = createAsyncThunk(
  "project/saveEditedProject",
  async (projectData, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      const response = await axios.put(
        `${API_ROOT}${path}/${projectData.id}`,
        projectData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.status === 200) {
        toast.success("Job updated successfully!");
        dispatch(fetchProjectsAPI());
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
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Could not update project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteProjectAPI = createAsyncThunk(
  "project/deleteProjectAPI",
  async (projectId, { dispatch, rejectWithValue }) => {
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
        dispatch(fetchProjectsAPI());
        return projectId;
      } else {
        const errorMsg = response.data?.message || "Failed to delete project.";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete project.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProjectAssigneesAPI = createAsyncThunk(
  "project/updateAssignees",
  async ({ project_id, employee_ids }, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const payload = { project_id, employee_ids };

      const role = getApiPrefix();
      if (!role) {
        return rejectWithValue("User role could not be determined.");
      }

      const updatePath = `/${role}/update-project-assignees`;

      const response = await axios.post(`${API_ROOT}${updatePath}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      return {
        projectId: project_id,
        updatedProject: formatProjectFromAPI(response.data.data || response.data),
        employeeIds: employee_ids
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Could not update assignees.";
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateProjectFieldAPI = createAsyncThunk(
  "project/updateField",
  async ({ projectId, field, value }, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const path = getProjectPath();
      const payload = { [field]: value };

      const response = await axios.patch(
        `${API_ROOT}${path}/${projectId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.data && response.status === 200) {
        toast.success("Job updated successfully!");
        return { 
          projectId, 
          field, 
          value,
          updatedProject: formatProjectFromAPI(response.data.data || response.data)
        };
      } else {
        const errorMsg = response.data?.message || "Failed to update field.";
        toast.error(errorMsg);
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred.";
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Slice
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
    updateAssigneesModal: false,
    projectToUpdateAssignees: null,
  },
  reducers: {
    toggleAddModal: (state, action) => {
      state.openProjectModal = action.payload;
    },
    setEditModalAndItem: (state, action) => {
      state.editModal = action.payload.open;
      state.editItem = action.payload.open ? action.payload.project : {};
    },
    toggleUpdateAssigneesModal: (state, action) => {
      state.updateAssigneesModal = action.payload.open;
      state.projectToUpdateAssignees = action.payload.open
        ? action.payload.project
        : null;
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
      })
      .addCase(updateProjectAssigneesAPI.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateProjectAssigneesAPI.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateAssigneesModal = false;
        
        // Update the specific project in the projects array
        const { projectId, updatedProject } = action.payload;
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          state.projects[projectIndex] = updatedProject;
        }
        
        // Also update the projectToUpdateAssignees if it's the same project
        if (state.projectToUpdateAssignees && state.projectToUpdateAssignees.id === projectId) {
          state.projectToUpdateAssignees = updatedProject;
        }
      })
      .addCase(updateProjectAssigneesAPI.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      .addCase(updateProjectFieldAPI.fulfilled, (state, action) => {
        const { projectId, updatedProject } = action.payload;
        
        // Update projects array
        const projectIndex = state.projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
          state.projects[projectIndex] = updatedProject;
        }
        
        // Update projectToUpdateAssignees if it exists
        if (state.projectToUpdateAssignees && state.projectToUpdateAssignees.id === projectId) {
          state.projectToUpdateAssignees = updatedProject;
        }
      });
  },
});

export const {
  toggleAddModal,
  setEditModalAndItem,
  toggleUpdateAssigneesModal,
} = appProjectSlice.actions;

export default appProjectSlice.reducer;