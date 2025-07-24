// src/store/rootReducer.js

import layout from "./layout";
import projectReducer from "../pages/app/projects/store";
import kanbanReducer from "../pages/app/projects/kanban/store";
import authReducer from "@/store/api/auth/authSlice";

import appChatReducer from "../pages/app/chat/store";

const rootReducer = {
  auth: authReducer,
  layout,
  project: projectReducer,
  kanban: kanbanReducer,
  appchat: appChatReducer,
};

export default rootReducer;