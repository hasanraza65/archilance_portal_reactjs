// src/store/rootReducer.js

import layout from "./layout";
import projectReducer from "../pages/app/projects/store";
import kanbanReducer from "../pages/app/projects/kanban/store";
import authReducer from "@/store/api/auth/authSlice";

// 1. Import the new reducer from its correct file path
import appChatReducer from "../pages/app/chat/store";

const rootReducer = {
  auth: authReducer,
  layout,
  project: projectReducer,
  kanban: kanbanReducer,

  // 2. Use the new reducer and name the key 'appchat'
  // This key MUST match what your component is asking for: useSelector((state) => state.appchat)
  appchat: appChatReducer,
};

export default rootReducer;