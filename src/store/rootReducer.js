import { combineReducers } from 'redux';
import layout from "./layout";
import projectReducer from "../pages/app/projects/store";
import kanbanReducer from "../pages/app/projects/kanban/store";
import chat from "../pages/app/chat/store";

// 1. IMPORT YOUR AUTH REDUCER
import authReducer from "@/store/api/auth/authSlice"; // Adjust path if necessary

const rootReducer = {
  // 2. ADD THE AUTH REDUCER WITH THE KEY 'auth'
  auth: authReducer,

  layout,
  project: projectReducer,
  kanban: kanbanReducer,
  chat,
};

export default rootReducer;