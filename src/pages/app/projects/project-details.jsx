import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import AddTaskModal from "../projects/Task/PartialTask/AddSubTaskModal";

const mapApiAssigneeToLocal = (apiAssignee) => {
    if (!apiAssignee || typeof apiAssignee !== 'object') {
        return null;
    }
    
    const name = apiAssignee.name || (apiAssignee.user && apiAssignee.user.name) || "Unknown";
    const avatarChar = name.charAt(0).toUpperCase() || "U";
    let color = "bg-gray-500"; 
    if (name) {
        const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"];
        color = colors[name.length % colors.length];
    }
    return { name: name, avatar: avatarChar, color: apiAssignee.color || color };
};

const getStatusClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    switch (String(status).toLowerCase()) { 
      case "in progress": case "pending": return "bg-blue-100 text-blue-800 border-blue-200";
      case "todo": case "to do": case "open": return "bg-gray-100 text-gray-800 border-gray-200"; 
      case "completed": case "done": return "bg-green-100 text-green-800 border-green-200";
      default: return `bg-yellow-100 text-yellow-800 border-yellow-200`; 
    }
};

const getPriorityClass = (priority) => {
    if (!priority) return "text-gray-600";
    switch (String(priority).toLowerCase()) {
      case "high": return "text-red-600";
      case "normal": case "medium": return "text-blue-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
};

const ProjectDetailsPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [projectDetails, setProjectDetails] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectFound, setProjectFound] = useState(true);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

  const fetchProjectAndTasks = async () => {
    if (!id) {
      setError("Project ID is missing from URL.");
      setLoading(false);
      setProjectFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setProjectFound(true); 
    setProjectDetails(null);
    setTasks([]);

    const token = Cookies.get("token");

    if (!token) {
      setError("Authorization token not found. Please log in.");
      setLoading(false);
      setProjectFound(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project/${id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setProjectFound(false);
          setError(`Project with ID ${id} not found.`);
        } else {
          const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from server."}));
          setError(`Error ${response.status}: ${errorData.message || response.statusText}`);
          setProjectFound(false);
        }
        setLoading(false);
        return;
      }
      
      const fetchedProjectData = await response.json();
      console.log("Raw API Response Data (Project):", fetchedProjectData);

      if (fetchedProjectData && fetchedProjectData.project_name) { 
        setProjectDetails({
          project_title: fetchedProjectData.project_name,
          project_description: fetchedProjectData.project_description,
        });
        setTasks(fetchedProjectData.tasks || []); 
        setProjectFound(true);
      } else {
        console.warn("Fetched data is not a valid project object or 'project_name' is missing from the API response.");
        setProjectFound(false);
        setError("Invalid project data received from server. Expected a 'project_name' field.");
        setProjectDetails(null);
        setTasks([]);
      }

    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err.message || "An unknown error occurred while fetching project details.");
      setProjectFound(false);
      setProjectDetails(null);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id]);

  const handleOpenAddTaskModal = () => {
    setIsAddTaskModalOpen(true);
  };

  const handleCloseAddTaskModal = () => {
    setIsAddTaskModalOpen(false);
  };

  const handleTaskAdded = () => {
    console.log("Task added, re-fetching project and tasks...");
    fetchProjectAndTasks();
  };

  const handleKanbanBoard = () => {
    navigate(`/project/${id}/kanban`);
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading project details...</div>;
  }

  if (error && !projectDetails && !projectFound) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }
  
  if (!projectDetails && !loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-10 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Project Not Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            The project with ID: {id} could not be found, or the data received was invalid.
            {error && <span className="block mt-1">Details: {error}</span>}
          </p>
          <div className="mt-6">
            <button
                type="button"
                onClick={() => navigate('/projects')} 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Go to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {projectDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{projectDetails.project_title}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            <strong>Project Description:</strong> {projectDetails.project_description || "N/A"}
          </p>
        </div>
      )}

      {projectDetails && projectFound ? (
        tasks.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700">Tasks for this Project</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleKanbanBoard}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  Kanban Board
                </button>
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
            </div>

            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 sticky top-0 z-10">
              <div className="col-span-4 p-4">Name</div>
              <div className="col-span-2 p-4">Assignee</div>
              <div className="col-span-2 p-4">Status</div>
              <div className="col-span-2 p-4">Due date</div>
              <div className="col-span-1 p-4">Priority</div>
              <div className="col-span-1 p-4 text-center">Actions</div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {tasks.map((task, index) => {
              
                const assignee = task.assignees && task.assignees.length > 0 ? mapApiAssigneeToLocal(task.assignees[0]) : null;
                return (
                <div 
                  key={task.id || `task-${index}`}
                  className="grid grid-cols-12 border-b border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/task/${task.id}`)} 
                >
                  <div className="col-span-4 p-4 flex items-center">
                    <span className="text-gray-900">{task.task_title || "N/A"}</span>
                  </div>
                  <div className="col-span-2 p-4 flex items-center">
                    {assignee ? (
                      <div className="flex items-center">
                        <span className={`w-6 h-6 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs font-medium mr-2`}>
                          {assignee.avatar}
                        </span>
                        <span className="text-sm text-gray-700">{assignee.name}</span>
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
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click if an action button is clicked
                        console.log("Task action clicked for:", task.id);
                        
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" /></svg>
                    </button>
                  </div>
                </div>
                )}
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-10 bg-white rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
                No Tasks in this Project Yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
                Get started by adding the first task to "{projectDetails?.project_title || 'this project'}".
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                  type="button"
                  onClick={handleKanbanBoard}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  View Kanban Board
              </button>
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
      ) : null }
      
      <AddTaskModal 
        isOpen={isAddTaskModalOpen} 
        onClose={handleCloseAddTaskModal} 
        onTaskAdded={handleTaskAdded}
        projectId={id}
      />
    </div>
  );
};

export default ProjectDetailsPage;