import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

// Placeholder for AddTaskModal - you'll need to create this component
const AddTaskModal = ({ isOpen, onClose, onTaskAdded }) => {
  if (!isOpen) return null;

  // Basic modal structure - replace with your actual modal implementation
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add task logic here, then call onTaskAdded() and onClose()
    console.log("Task submitted");
    onTaskAdded(); // Simulate task added
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Add New Task</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Add your form fields here */}
          <div className="mb-4">
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Task Title</label>
            <input type="text" id="taskTitle" name="taskTitle" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
          </div>
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


const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projectDetails, setProjectDetails] = useState({
    project_title: "Website Redesign Project",
    project_description: "Redesign the company website with modern UI/UX principles and improved mobile responsiveness."
  });

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskFound, setTaskFound] = useState(true); // New state to track if task was found
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const API_BASE_URL = "https://demo.aentora.com/backend/public/api/admin/project-task/";

  const fetchTaskDetails = async () => { // Made fetchTaskDetails accessible for re-fetching
    if (!id) {
      setError("Task ID is missing from URL.");
      setLoading(false);
      setTaskFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setTaskFound(true); // Assume task will be found initially

    console.log(`Attempting to fetch task details for ID: ${id}...`);
    const token = Cookies.get("token");
    console.log("Token from cookie:", token);

    if (!token) {
      const errorMessage = "Authorization token not found. Please log in.";
      setError(errorMessage);
      setLoading(false);
      setTaskFound(false); // Task not found due to auth error
      console.error(errorMessage);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      console.log("API Response Status:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`API returned 404 for task ID: ${id}`);
          setTaskFound(false);
        } else {
          let errorData;
          try { errorData = await response.json(); }
          catch (e) { errorData = { message: "Failed to parse error response from server." }; }
          const errorMessage = `Error ${response.status}: ${errorData.message || response.statusText}`;
          setError(errorMessage); // Set general error
          setTaskFound(false); // Also mark task as not found if error occurs
        }
        setTasks([]); // Clear tasks if not found or error
        setLoading(false);
        return;
      }

      const responseData = await response.json();
      console.log("Raw API Response Data:", responseData);

      let fetchedTaskData = null;
      if (responseData && responseData.data && typeof responseData.data === 'object' && Object.keys(responseData.data).length > 0) {
        fetchedTaskData = responseData.data;
      } else if (responseData && typeof responseData === 'object' && responseData.task_title) {
        fetchedTaskData = responseData;
      } else if (responseData && (Object.keys(responseData).length === 0 || responseData.data === null)) {
        console.warn("API returned an empty object or null data for task ID:", id);
        setTaskFound(false);
      }

      if (!fetchedTaskData || !fetchedTaskData.task_title) {
        if (taskFound) { // Only set to false if it was previously true and data is invalid
            console.warn("Fetched data is not a valid task object or task_title is missing, despite a successful API response.");
            setTaskFound(false);
        }
        setTasks([]);
      } else {
        console.log("Successfully fetched Task Data:", fetchedTaskData);
        const taskForTable = {
          ...fetchedTaskData,
          id: fetchedTaskData.id || fetchedTaskData.task_id || parseInt(id, 10),
          assignee: fetchedTaskData.assignee ? mapApiAssigneeToLocal(fetchedTaskData.assignee) : null,
        };
        setTasks([taskForTable]);
        setTaskFound(true); // Explicitly set task found
      }

    } catch (err) {
      console.error("Error fetching task details:", err);
      setError(err.message || "An unknown error occurred.");
      setTasks([]);
      setTaskFound(false);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchTaskDetails();
  }, [id]); // Only id as dependency for fetching

  const mapApiAssigneeToLocal = (apiAssignee) => {
    if (!apiAssignee || typeof apiAssignee !== 'object') return null;
    const name = apiAssignee.name || (apiAssignee.user && apiAssignee.user.name) || "Unknown";
    return { name: name, avatar: name.charAt(0).toUpperCase() || "U", color: apiAssignee.color || "bg-gray-500" };
  };

  const getStatusClass = (status) => {
    switch (String(status).toUpperCase()) {
      case "IN PROGRESS": case "PENDING": return "bg-blue-100 text-blue-800 border-blue-200";
      case "TO DO": case "OPEN": return "bg-gray-100 text-gray-800 border-gray-200";
      case "COMPLETED": case "DONE": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const getPriorityClass = (priority) => {
    switch (String(priority).toLowerCase()) {
      case "high": return "text-red-600";
      case "normal": case "medium": return "text-blue-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const handleOpenAddTaskModal = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleCloseAddTaskModal = () => {
    setIsAddTaskModalOpen(false);
  };

  const handleTaskAdded = () => {
    // After a task is successfully added via the modal,
    // you might want to re-fetch the task list or update it.
    // For this specific page showing a single task by ID,
    // if a new task is added, you might navigate to its details page
    // or refresh the current view if the added task matches the current 'id'.
    // For now, we'll just re-fetch.
    console.log("Task added, re-fetching details...");
    fetchTaskDetails(); // Re-fetch to see if the current ID now has data (if it was just created)
  };


  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading task details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Project Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-800">{projectDetails.project_title}</h1>
        <p className="mt-2 text-gray-600">{projectDetails.project_description}</p>
        {tasks.length > 0 && tasks[0].task_description && taskFound && (
            <p className="mt-2 text-sm text-gray-500">
                <strong>Task Description:</strong> {tasks[0].task_description}
            </p>
        )}
      </div>

      {/* Conditional Rendering: Task Table or "Not Found" Message */}
      {!loading && !error && taskFound && tasks.length > 0 ? (
        // -------- DISPLAY TASK TABLE --------
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Table Title and Add Task Button */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-700">Task Details</h2>
            <button
              onClick={handleOpenAddTaskModal}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Task
            </button>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500">
            <div className="col-span-4 p-4 flex items-center">Name</div>
            <div className="col-span-2 p-4 flex items-center">Assignee</div>
            <div className="col-span-2 p-4 flex items-center">Status</div>
            <div className="col-span-2 p-4 flex items-center">Due date</div>
            <div className="col-span-1 p-4 flex items-center">Priority</div>
            <div className="col-span-1 p-4 flex items-center justify-center">Actions</div>
          </div>
          
          {/* Table Body */}
          <div className="max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div 
                key={task.id || task.task_title}
                className="grid grid-cols-12 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="col-span-4 p-4 flex items-center">
                  <span className="text-gray-900">{task.task_title || "N/A"}</span>
                </div>
                <div className="col-span-2 p-4 flex items-center">
                  {task.assignee ? (
                    <div className="flex items-center">
                      <span className={`w-6 h-6 ${task.assignee.color} text-white rounded-full flex items-center justify-center text-xs font-medium mr-2`}>
                        {task.assignee.avatar}
                      </span>
                      <span className="text-sm text-gray-700">{task.assignee.name}</span>
                    </div>
                  ) : ( <span className="text-sm text-gray-500">Unassigned</span> )}
                </div>
                <div className="col-span-2 p-4 flex items-center">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(task.task_status)}`}>
                    {String(task.task_status || "N/A").toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2 p-4 flex items-center">
                  <span className="text-sm text-gray-700">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="col-span-1 p-4 flex items-center">
                  <span className={`text-sm font-medium ${getPriorityClass(task.priority)}`}>
                    {task.priority || "N/A"}
                  </span>
                </div>
                <div className="col-span-1 p-4 flex items-center justify-center">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // -------- DISPLAY "NO TASK FOUND" MESSAGE --------
        !loading && !error && (!taskFound || tasks.length === 0) && (
            <div className="text-center p-10 bg-white rounded-lg shadow">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No Task Found for ID: {id}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    This task might not exist or you may not have permission to view it.
                </p>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={handleOpenAddTaskModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add New Task
                    </button>
                </div>
            </div>
        )
      )}
      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={handleCloseAddTaskModal} 
        onTaskAdded={handleTaskAdded} 
      />
    </div>
  );
};

export default ProjectDetailsPage;