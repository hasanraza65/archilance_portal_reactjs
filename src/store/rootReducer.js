import layout from "./layout"; // Assuming this is another slice
import projectReducer from "../pages/app/projects/store"; // Path to your appProjectSlice.js

const rootReducer = {
  layout,
  project: projectReducer, // 'project' is the key for this slice in the Redux state
};
export default rootReducer;