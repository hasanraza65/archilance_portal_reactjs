import axiosInstance from "@/store/api/app/axiosInstance";
import Cookies from "js-cookie";
import { getApiPrefix } from "@/pages/utility/apiHelper";

// Helper to get headers with token
const getConfig = () => {
  const token = Cookies.get("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Helper to get dynamic base URL
const getBaseUrl = () => {
  const prefix = getApiPrefix();
  return `/${prefix}/notes`;
};

export const notesApi = {
  createNote: async (projectId, noteText, type) => {
    const payload = {
      project_id: projectId,
      note_text: noteText,
      type: type,
    };
    const response = await axiosInstance.post(getBaseUrl(), payload, getConfig());
    return response.data;
  },

  updateNote: async (noteId, data) => {
    // data can be { status: ... } or { note_text: ... } or both
    const response = await axiosInstance.put(
      `${getBaseUrl()}/${noteId}`,
      data,
      getConfig()
    );
    return response.data;
  },

  deleteNote: async (noteId) => {
    const response = await axiosInstance.delete(
      `${getBaseUrl()}/${noteId}`,
      getConfig()
    );
    return response.data;
  },
};
