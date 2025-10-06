// store.js (FINAL AND FULLY UPDATED CODE)

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { getApiPrefix, getUserRole } from "@/pages/utility/apiHelper";

const API_ROOT = `${import.meta.env.VITE_BACKEND_BASE_URL}/api`;

const getProjectPath = () => {
  const role = getUserRole();
  switch (role) {
    case "admin":
      return "/admin/project";
    case "customer":
      return "/customer/project";
    case "member":
      return "/member/project";
    case "employee":
    case "manager":
    case "supervisor":
    default:
      return "/employee/project";
  }
};

const formatProjectFromAPI = (project) => ({
  id: project.id,
  name: project.project_name || "Unnamed Project",
  project_name: project.project_name || "Unnamed Project",
  project_description: project.project_description || "",
  start_date: project.start_date || new Date().toISOString().split("T")[0],
  due_date: project.due_date,
  progress:
    typeof project.progress === "number"
      ? project.progress
      : project.project_progress || 0,
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

      // --- YAHAN LOGIC UPDATE KIYA GAYA HAI ---
      // Ab yeh object { "Status": [...] } ko handle karega
      if (
        typeof responseData === "object" &&
        !Array.isArray(responseData) &&
        responseData !== null
      ) {
        const formattedProjectsByStatus = {};
        let totalProjects = 0;

        // Har status (key) ke liye loop chalayein
        for (const status in responseData) {
          if (Object.prototype.hasOwnProperty.call(responseData, status)) {
            const projectsForStatus = responseData[status];
            if (Array.isArray(projectsForStatus)) {
              // Har project ko format karein
              formattedProjectsByStatus[status] =
                projectsForStatus.map(formatProjectFromAPI);
              totalProjects += projectsForStatus.length;
            }
          }
        }

        // formatted object aur meta data return karein
        return {
          projects: formattedProjectsByStatus,
          meta: {
            totalProjects: totalProjects,
          },
        };
      } else {
        // Agar data object na ho to error dein
        return rejectWithValue("Invalid project data structure from API.");
      }
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
  async (projectData, { rejectWithValue }) => {
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

      if (
        response.data &&
        (response.status === 201 || response.status === 200)
      ) {
        toast.success("Job added successfully!");
        const newProjectData = response.data.project;
        return formatProjectFromAPI(newProjectData);
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
  async (projectData, { rejectWithValue }) => {
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
        if (
          response.data.project &&
          typeof response.data.project === "object"
        ) {
          return formatProjectFromAPI(response.data.project);
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
  async (projectId, { rejectWithValue }) => {
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
  async ({ project_id, employee_ids }, { rejectWithValue, dispatch }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const payload = { project_id, employee_ids };
      const role = getApiPrefix();
      if (!role) {
        return rejectWithValue("User role could not be determined.");
      }
      const updatePath = `/${role}/update-project-assignees`;

      await axios.post(`${API_ROOT}${updatePath}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      dispatch(fetchProjectsAPI());

      return {
        projectId: project_id,
        employeeIds: employee_ids,
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
        return formatProjectFromAPI(response.data.data || response.data);
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
    projects: {}, // --- INITIAL STATE IS NOW AN OBJECT ---
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
        state.totalProjects = action.payload.meta.totalProjects;
      })
      .addCase(fetchProjectsAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.projects = {};
      })
      .addCase(addProjectAPI.pending, (state) => {
        state.isAdding = true;
      })
      .addCase(addProjectAPI.fulfilled, (state, action) => {
        state.isAdding = false;
        state.openProjectModal = false;
        const newProject = action.payload;
        const status = newProject.status;
        if (!state.projects[status]) {
          state.projects[status] = [];
        }
        state.projects[status].unshift(newProject);
        state.totalProjects += 1;
      })
      .addCase(addProjectAPI.rejected, (state, action) => {
        state.isAdding = false;
        state.error = action.payload;
      })
      .addCase(saveEditedProjectAPI.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(saveEditedProjectAPI.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.editModal = false;
        const updatedProject = action.payload;
        for (const status in state.projects) {
          state.projects[status] = state.projects[status].filter(
            (p) => p.id !== updatedProject.id
          );
        }
        const newStatus = updatedProject.status;
        if (!state.projects[newStatus]) {
          state.projects[newStatus] = [];
        }
        state.projects[newStatus].unshift(updatedProject);
      })
      .addCase(saveEditedProjectAPI.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      .addCase(deleteProjectAPI.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteProjectAPI.fulfilled, (state, action) => {
        state.isDeleting = false;
        const deletedProjectId = action.payload;
        for (const status in state.projects) {
          state.projects[status] = state.projects[status].filter(
            (p) => p.id !== deletedProjectId
          );
        }
        state.totalProjects -= 1;
      })
      .addCase(deleteProjectAPI.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })
      .addCase(updateProjectAssigneesAPI.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateProjectAssigneesAPI.fulfilled, (state) => {
        state.isUpdating = false;
        state.updateAssigneesModal = false;
      })
      .addCase(updateProjectAssigneesAPI.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      .addCase(updateProjectFieldAPI.fulfilled, (state, action) => {
        const updatedProject = action.payload;
        for (const status in state.projects) {
          state.projects[status] = state.projects[status].filter(
            (p) => p.id !== updatedProject.id
          );
        }
        const newStatus = updatedProject.status;
        if (!state.projects[newStatus]) {
          state.projects[newStatus] = [];
        }
        state.projects[newStatus].unshift(updatedProject);
      });
  },
});

export const {
  toggleAddModal,
  setEditModalAndItem,
  toggleUpdateAssigneesModal,
} = appProjectSlice.actions;

export default appProjectSlice.reducer;
