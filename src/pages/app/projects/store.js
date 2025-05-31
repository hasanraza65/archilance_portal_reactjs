import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

// Assuming avatar paths are correct if you re-enable them for default members
// import avatar1 from "@/assets/images/avatar/av-1.svg";
// import avatar2 from "@/assets/images/avatar/av-2.svg";

const API_BASE_URL = "https://demo.aentora.com/backend/public/api/admin/project";

// --- Helper Functions ---
const generateDefaultMembers = () => {
  return [
    // { image: avatar1, label: "Member 1" },
    // { image: avatar2, label: "Member 2" },
  ];
};

const calculateEndDateFromToday = (days = 30) => {
  const today = new Date();
  const dateToModify = new Date(today);
  dateToModify.setDate(dateToModify.getDate() + days);
  return dateToModify.toISOString().split('T')[0];
};

const formatProjectFromAPI = (project) => ({
  id: project.id,
  name: project.project_name || project.name || "Unnamed Project",
  des: project.project_description || project.description || "",
  startDate: project.start_date || new Date().toISOString().split('T')[0],
  endDate: project.due_date || calculateEndDateFromToday(),
  progress: typeof project.progress === 'number' ? project.progress : (project.project_progress || 0),
  customer_id: project.customer_id || null,
  status: project.status?.toLowerCase() || "ongoing",
  assignee: project.members && project.members.length > 0 ? project.members : generateDefaultMembers(),
  members: project.members && project.members.length > 0 ? project.members : generateDefaultMembers(), // Ensure 'members' is populated if ProjectGrid uses it
});

// --- Async Thunks ---

export const fetchProjectsAPI = createAsyncThunk(
  "approject/fetchProjects",
  async (_, { rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const response = await axios.get(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      const responseData = response.data.data || response.data.projects || response.data;
      if (!responseData) return rejectWithValue("Invalid project data structure from API.");
      
      const projectsApiData = Array.isArray(responseData) ? responseData : (responseData.data && Array.isArray(responseData.data) ? responseData.data : [responseData]);
      
      return projectsApiData.map(formatProjectFromAPI);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to load projects.";
      // toast.error(errorMessage); // Toasting here can be redundant if ProjectPostPage also shows an error.
      return rejectWithValue(errorMessage);
    }
  }
);

export const addProjectAPI = createAsyncThunk(
  "approject/addProject",
  async (projectData, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");
      
      const response = await axios.post(API_BASE_URL, projectData, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      if (response.data && (response.status === 201 || response.status === 200 || response.data.status === "success")) {
        toast.success("Project added successfully!");
        dispatch(fetchProjectsAPI());
        return formatProjectFromAPI(response.data.data || response.data.project || response.data);
      } else {
        const errorMsg = response.data?.message || "Failed to add project to server.";
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
  "approject/saveEditedProject",
  async (projectData, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found.");

      const response = await axios.put(`${API_BASE_URL}/${projectData.id}`, projectData, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      
      if (response.data && (response.status === 200 || response.data.status === "success")) {
        toast.success("Project updated successfully!");
        dispatch(fetchProjectsAPI());
        return formatProjectFromAPI(response.data.data || response.data.project || response.data);
      } else {
        const errorMsg = response.data?.message || "Failed to update project on server.";
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
  "approject/deleteProjectAPI",
  async (projectId, { dispatch, rejectWithValue }) => {
    try {
      const token = Cookies.get("token");
      if (!token) return rejectWithValue("Authentication token not found");

      const response = await axios.delete(`${API_BASE_URL}/${projectId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (response.status === 200 || response.status === 204 || response.data?.status === "success" || response.data?.message?.toLowerCase().includes("successfully")) {
        // Success alert is handled by SweetAlert in ProjectGrid.jsx
        dispatch(fetchProjectsAPI());
        return projectId;
      } else {
        const errorMsg = response.data?.message || "Failed to delete project from server.";
        // Error alert is handled by SweetAlert in ProjectGrid.jsx
        return rejectWithValue(errorMsg);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete project.";
      // Error alert is handled by SweetAlert in ProjectGrid.jsx
      return rejectWithValue(errorMessage);
    }
  }
);

export const appProjectSlice = createSlice({
  name: "project", // Changed name to 'project' to match selector: state.project
  initialState: {
    projects: [],
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
      // Fetch Projects
      .addCase(fetchProjectsAPI.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectsAPI.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload;
      })
      .addCase(fetchProjectsAPI.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.projects = [];
      })
      // Add Project
      .addCase(addProjectAPI.pending, (state) => {
        state.isAdding = true;
        state.error = null;
      })
      .addCase(addProjectAPI.fulfilled, (state) => {
        state.isAdding = false;
        state.openProjectModal = false;
      })
      .addCase(addProjectAPI.rejected, (state, action) => {
        state.isAdding = false;
        state.error = action.payload;
      })
      // Save Edited Project
      .addCase(saveEditedProjectAPI.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(saveEditedProjectAPI.fulfilled, (state) => {
        state.isUpdating = false;
        state.editModal = false;
      })
      .addCase(saveEditedProjectAPI.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })
      // Delete Project
      .addCase(deleteProjectAPI.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteProjectAPI.fulfilled, (state) => {
        state.isDeleting = false;
      })
      .addCase(deleteProjectAPI.rejected, (state, action) => {
        state.isDeleting = false;
        // Error for delete is primarily handled by SweetAlert in component
        // but we can store it if needed for other UI indication.
        state.error = action.payload;
      });
  },
});

export const {
  toggleAddModal,
  setEditModalAndItem,
} = appProjectSlice.actions;

export default appProjectSlice.reducer;