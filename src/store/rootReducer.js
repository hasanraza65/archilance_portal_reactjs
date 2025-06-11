import layout from "./layout"; 
import projectReducer from "../pages/app/projects/store"; 
import kanbanReducer from "../pages/app/projects/kanban/store"; 
import chat from "../pages/app/chat/store";


const rootReducer = {
  layout,
  project: projectReducer, 
  kanban: kanbanReducer,
  chat,

  

};
export default rootReducer;