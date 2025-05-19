import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid"; // Keep for initial static data if needed

// Avatar imports (assuming paths are correct relative to this file or project root)
import avatar1 from "@/assets/images/avatar/av-1.svg";
import avatar2 from "@/assets/images/avatar/av-2.svg";
import avatar3 from "@/assets/images/avatar/av-3.svg";
// import avatar4 from "@/assets/images/avatar/av-4.svg"; // Not used in initial data

// Async thunk for deleting a project via API
export const deleteProjectAPI = createAsyncThunk(
  "approject/deleteProjectAPI",
  async (projectId, thunkAPI) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        toast.error("Authentication token not found");
        return thunkAPI.rejectWithValue("Authentication token not found");
      }

      const response = await axios.delete(
        `https://demo.aentora.com/backend/public/api/admin/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      // Assuming API returns success status (e.g., 200, 204) on successful delete
      // and might return the deleted project's ID or a success message in response.data
      if (response.status === 200 || response.status === 204 || response.data.status === "success") {
         return projectId; // Return projectId to identify which project to remove from state
      } else {
        const errorMsg = response.data?.message || "Failed to delete project from server.";
        toast.error(errorMsg);
        return thunkAPI.rejectWithValue(errorMsg);
      }

    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete project.";
      console.error("Error deleting project:", error.response || error);
      toast.error(errorMessage);
      return thunkAPI.rejectWithValue(errorMessage);
    }
  }
);

export const appProjectSlice = createSlice({
  name: "approject",
  initialState: {
    openProjectModal: false,
    isLoading: false, // General loading state for the slice
    isDeleting: false, // Specific loading state for delete operation
    editItem: {},
    editModal: false,
    projects: [
      // Initial static data (will be overwritten by API fetch on ProjectPostPage)
      // Consider removing if always fetching, or keep for fallback/testing
      {
        id: uuidv4(),
        assignee: [
          { image: avatar1, label: "Mahedi Amin" },
          { image: avatar2, label: "Sovo Haldar" },
          { image: avatar3, label: "Rakibul Islam" },
        ],
        name: "Management Dashboard (Static)",
        des: "Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.",
        startDate: "2022-10-03",
        endDate: "2022-10-06",
        progress: 75,
        category: [{ value: "team", label: "team" }, { value: "low", label: "low" }],
      },
    ],
  },
  reducers: {
    toggleAddModal: (state, action) => {
      state.openProjectModal = action.payload;
    },
    toggleEditModal: (state, action) => {
      state.editModal = action.payload;
      if (action.payload) { // If opening modal, set editItem
        state.editItem = state.projects.find(p => p.id === action.payload.id) || {};
      } else {
        state.editItem = {};
      }
    },
    // For adding a project (currently local, would need an API thunk for backend)
    pushProject: (state, action) => {
      state.projects.unshift(action.payload);
      toast.success("Project Added Successfully (Locally)", {
        position: "top-right", autoClose: 1500, hideProgressBar: false, closeOnClick: true,
        pauseOnHover: true, draggable: true, progress: undefined, theme: "light",
      });
    },
    // For updating a project (currently local, handles setting edit item and modal)
    // The actual API update would typically be a separate thunk dispatched from EditProject form
    updateProject: (state, action) => {
      state.editItem = action.payload;
      state.editModal = true; // Always open modal when updateProject is called with payload
      // The actual update of state.projects from edit form would be another action/thunk.
      // This action seems more for "begin_edit_project"
    },
    // New reducer to set projects from API fetch
    setProjectsStore: (state, action) => {
      state.projects = action.payload;
      state.isLoading = false; // Assuming fetch is complete
    },
    setProjectsLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(deleteProjectAPI.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteProjectAPI.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.projects = state.projects.filter(
          (project) => project.id !== action.payload // action.payload is projectId
        );
        toast.success("Project Deleted Successfully!", {
          position: "top-right", autoClose: 1500, hideProgressBar: false, closeOnClick: true,
          pauseOnHover: true, draggable: true, progress: undefined, theme: "light",
        });
      })
      .addCase(deleteProjectAPI.rejected, (state, action) => {
        state.isDeleting = false;
        // Toast is already shown in the thunk, but you can add more logic here if needed
        console.error("Delete project rejected:", action.payload);
      });
  },
});

export const {
  toggleAddModal,
  toggleEditModal,
  pushProject,
  updateProject, // This action is for opening the edit modal
  setProjectsStore,
  setProjectsLoading
} = appProjectSlice.actions;

export default appProjectSlice.reducer;