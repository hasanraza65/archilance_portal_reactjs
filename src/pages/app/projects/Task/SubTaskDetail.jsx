
import React, { useState } from "react";
import Cookies from "js-cookie";

const AddSubTaskModal = ({ isOpen, onClose, onSubTaskAdded, parentTaskId, projectId }) => {
  if (!isOpen) return null;

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = Cookies.get("token");
    if (!token) {
      console.error("No token found for adding sub-task");
      alert("Authentication error. Please log in again.");
      return;
    }

    if (!projectId || !parentTaskId) {
        alert("Project ID or Parent Task ID is missing. Cannot add sub-task.");
        return;
    }

    const newSubTaskPayload = {
      project_id: projectId,
      parent_task_id: parentTaskId,
      task_title: taskTitle,
      task_description: taskDescription,
      task_status: "To Do", 
    };

    try {
     
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/tasks`, { 
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(newSubTaskPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to add sub-task and could not parse error response." }));
        throw new Error(errorData.message || `Failed to add sub-task (status ${response.status})`);
      }

      console.log("Sub-task submitted successfully");
      onSubTaskAdded(); 
      onClose();
    } catch (error) {
      console.error("Error adding task:", error);
      alert(`Error adding task: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">

      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Add New Task</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subTaskTitleModal" className="block text-sm font-medium text-gray-700">Task Title</label>
            <input 
              type="text" 
              id="subTaskTitleModal" 
              name="taskTitle" 
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              required 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="subTaskDescriptionModal" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea
              id="subTaskDescriptionModal"
              name="taskDescription"
              rows="3"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            ></textarea>
          </div>
          {/* Add more fields if needed (due date, priority) */}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubTaskModal;