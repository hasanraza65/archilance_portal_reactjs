import layout from "./layout"; // Assuming this is another slice
import projectReducer from "../pages/app/projects/store"; // Path to your appProjectSlice.js
import kanbanReducer from "../pages/app/projects/kanban/store"; // Path to your kanbanSlice.js

const rootReducer = {
  layout,
  project: projectReducer, 
  kanban: kanbanReducer,
};
export default rootReducer;