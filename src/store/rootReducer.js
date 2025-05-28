import layout from "./layout"; 
import projectReducer from "../pages/app/projects/store"; 
import kanbanReducer from "../pages/app/projects/kanban/store"; 

const rootReducer = {
  layout,
  project: projectReducer, 
  kanban: kanbanReducer,
};
export default rootReducer;