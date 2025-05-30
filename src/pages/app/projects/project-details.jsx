import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import AddTaskModal from "../projects/Task/PartialTask/AddSubTaskModal"; // Adjust path as needed
import Swal from "sweetalert2";

// OPTION 1: Import from your shared utils file (RECOMMENDED)
// Ensure the path to taskDetailsUtils.js is correct from ProjectDetailsPage.jsx
// For example, if ProjectDetailsPage.jsx is in src/pages/projects/
// and taskDetailsUtils.js is in src/components/TaskDetails/
// The path might be: import { mapApiUserToLocal } from '../../components/TaskDetails/taskDetailsUtils';
// For this example, I'll assume you want to keep a local version or adapt it.
// I'll use your existing mapApiAssigneeToLocal and modify it slightly for profile pics.

const mapApiAssigneeToLocal = (apiUser) => { // Modified to include profilePic and ID
  if (!apiUser || typeof apiUser !== 'object') {
    return { id: null, name: "Unknown", avatar: "U", color: "bg-gray-500", profilePic: null };
  }

  // The user object might be nested directly or under a 'user' property
  const user = apiUser.user || apiUser; 

  const id = user.id || null;
  const name = user.name || "Unknown User";
  
  const avatarChar = (name && name !== "Unknown User" && name.length > 0) 
    ? name.charAt(0).toUpperCase() 
    : "U";

  let defaultColor = "bg-gray-500";
  if (name !== "Unknown User" && name.length > 0) {
    const colors = [ /* ... your colors array ... */ 
        "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500", 
        "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500", 
        "bg-cyan-500", "bg-sky-500", "bg-blue-500", "bg-indigo-500", 
        "bg-violet-500", "bg-purple-500", "bg-fuchsia-500", "bg-pink-500", "bg-rose-500"
    ];
    const colorIndex = id ? ( (typeof id === 'string' ? id.charCodeAt(0) : id) % colors.length) : (name.length % colors.length);
    defaultColor = colors[colorIndex];
  }
  const color = user.color || defaultColor;

  let profilePic = null;
  // Assuming profile picture might be 'profile_picture_url' or 'profile_pic'
  if (user.profile_picture_url) { 
    profilePic = user.profile_picture_url;
  } else if (user.profile_pic) { 
    if (user.profile_pic.startsWith('http://') || user.profile_pic.startsWith('https://')) {
      profilePic = user.profile_pic;
    } else {
      const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL;
      if (backendBaseUrl) {
        const cleanBaseUrl = backendBaseUrl.replace(/\/$/, '');
        const cleanProfilePicPath = user.profile_pic.replace(/^\//, '');
        profilePic = `${cleanBaseUrl}/storage/${cleanProfilePicPath}`;
      } else {
        profilePic = `/storage/${user.profile_pic.replace(/^\//, '')}`; 
      }
    }
  }

  return {
    id,
    name,
    avatar: avatarChar,
    color,
    profilePic,
  };
};


const getStatusClass = (status) => {
  // ... (your existing getStatusClass function)
  if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
  switch (String(status).toLowerCase()) {
    case "in progress":
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "todo":
    case "to do":
    case "open":
      return "bg-gray-100 text-gray-800 border-gray-200"; // Consistent with Todo
    case "completed":
    case "done":
      return "bg-green-100 text-green-800 border-green-200";
    default: // For "Waiting" or other custom statuses
      return `bg-yellow-100 text-yellow-800 border-yellow-200`;
  }
};

const getPriorityClass = (priority) => {
  // ... (your existing getPriorityClass function)
  if (!priority) return "text-gray-600";
  switch (String(priority).toLowerCase()) {
    case "high":
      return "text-red-600";
    case "urgent": // Added for consistency if used
      return "text-orange-600 font-semibold";
    case "normal":
    case "medium":
      return "text-blue-600";
    case "low":
      return "text-green-600";
    default:
      return "text-gray-600";
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

  const MAX_DISPLAY_ASSIGNEES_IN_LIST = 2; // How many avatars to show before "+N"

  // ... (fetchProjectAndTasks, useEffect, handlers - keep them as they are)
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

    const token = Cookies.get("token");

    if (!token) {
      setError("Authorization token not found. Please log in.");
      setLoading(false);
      setProjectFound(false);
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Authorization token not found. Please log in.",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        navigate("/login");
      });
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_BASE_URL}/api/admin/project/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setProjectFound(false);
          setError(`Project with ID ${id} not found.`);
        } else {
          const errorData = await response
            .json()
            .catch(() => ({
              message: "Failed to parse error response from server.",
            }));
          setError(
            `Error ${response.status}: ${
              errorData.message || response.statusText
            }`
          );
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
        // Ensure tasks always have assignees as an array
        const processedTasks = (fetchedProjectData.tasks || []).map(task => ({
            ...task,
            assignees: task.assignees || [] 
        }));
        setTasks(processedTasks);
        setProjectFound(true);
      } else {
        console.warn(
          "Fetched data is not a valid project object or 'project_name' is missing from the API response."
        );
        setProjectFound(false);
        setError(
          "Invalid project data received from server. Expected a 'project_name' field."
        );
        setProjectDetails(null);
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(
        err.message ||
          "An unknown error occurred while fetching project details."
      );
      setProjectFound(false);
      setProjectDetails(null);
      setTasks([]);
      Swal.fire({
        icon: "error",
        title: "Fetch Error",
        text:
          err.message ||
          "An unknown error occurred while fetching project details.",
      });
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
    fetchProjectAndTasks(); // This will re-fetch and update tasks with new assignees
    Swal.fire({
      icon: "success",
      title: "Task Added!",
      text: "The new task has been successfully added to the project.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleKanbanBoard = () => {
    navigate(`/project/${id}/kanban`);
  };

  const handleDeleteTask = async (taskId) => {
    // ... your existing handleDeleteTask logic ...
    if (!taskId) {
      console.error("Task ID is missing, cannot delete.");
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Cannot delete task: Task ID is missing.",
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = Cookies.get("token");
        if (!token) {
          setError("Authorization token not found. Please log in.");
          Swal.fire({
            icon: "error",
            title: "Authentication Error",
            text: "Authorization token not found. Please log in.",
          }).then(() => {
            navigate("/login");
          });
          return;
        }

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_BACKEND_BASE_URL
            }/api/admin/project-task/${taskId}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Server error during deletion." }));
            const errorMessage =
              errorData.message ||
              `Failed to delete task (Status: ${response.status})`;
            console.error(`Error deleting task ${taskId}:`, errorMessage);
            Swal.fire({
              icon: "error",
              title: "Deletion Failed",
              text: errorMessage,
            });
            fetchProjectAndTasks(); 
            return;
          }

          console.log(`Task ${taskId} deleted successfully.`);
          Swal.fire(
            "Deleted!",
            "Your task has been deleted.",
            "success"
          );

          setTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== taskId)
          );
        } catch (err) {
          console.error("Network or other error during task deletion:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: err.message || "Could not connect to the server.",
          });
          fetchProjectAndTasks(); 
        }
      }
    });
  };
  
  // ... (loading, error, not found states - keep them as they are)
  if (loading && !projectDetails) {
    return ( <div className="container mx-auto p-4 text-center"> Loading project details... </div> );
  }
  if (error && !projectDetails && !projectFound) {
    return ( <div className="container mx-auto p-4 text-center text-red-500"> Error: {error} </div> );
  }
  if (!projectDetails && !loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center p-10 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true" >
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900"> Project Not Found </h3>
          <p className="mt-1 text-sm text-gray-500"> The project with ID: {id} could not be found, or the data received was invalid. {error && <span className="block mt-1">Details: {error}</span>} </p>
          <div className="mt-6">
            <button type="button" onClick={() => navigate("/projects")} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" > Go to Projects </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* ... Project Details Display ... */}
      {projectDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {projectDetails.project_title}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            <strong>Project Description:</strong>{" "}
            {projectDetails.project_description || "N/A"}
          </p>
        </div>
      )}
      {error && projectDetails && ( 
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded">
            Note: There was an issue fetching latest updates. Displaying last known data. Error: {error}
          </div>
        )}


      {projectDetails && projectFound ? (
        tasks.length > 0 ? (
          <div className="bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-white">
                Tasks for this Project
              </h2>
              <div className="flex gap-3">
                {/* ... Kanban and Add Task Buttons ... */}
                <button onClick={handleKanbanBoard} className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center" >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" > <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" /> </svg>
                  Kanban Board
                </button>
                <button onClick={handleOpenAddTaskModal} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center" >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" > <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /> </svg>
                  Add Task
                </button>
              </div>
            </div>

            {/* Table Headers */}
            <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-300 sticky top-0 z-10">
              <div className="col-span-12 sm:col-span-4 p-3 sm:p-4">Name</div>
              <div className="col-span-12 sm:col-span-2 p-3 sm:p-4">Assignees</div>
              <div className="col-span-6 sm:col-span-2 p-3 sm:p-4">Status</div>
              <div className="col-span-6 sm:col-span-2 p-3 sm:p-4">Due date</div>
              <div className="col-span-6 sm:col-span-1 p-3 sm:p-4">Priority</div>
              <div className="col-span-6 sm:col-span-1 p-3 sm:p-4 text-center">Actions</div>
            </div>

            {/* Task Rows */}
            <div className="max-h-[70vh] overflow-y-auto"> {/* Adjusted max-h for better scroll */}
              {tasks.map((task, index) => {
                // Ensure task.assignees is always an array before mapping
                const mappedTaskAssignees = (task.assignees || [])
                    .map(assigneeEntry => mapApiAssigneeToLocal(assigneeEntry.user || assigneeEntry)) // Handle if 'user' is nested or direct
                    .filter(Boolean); // Filter out any nulls

                return (
                  <div
                    key={task.id || `task-${index}`}
                    className="grid grid-cols-12 border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                  >
                    <div
                      className="col-span-12 sm:col-span-4 p-3 sm:p-4 flex items-center cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <span className="text-gray-900 dark:text-gray-100 truncate">
                        {task.task_title || "N/A"}
                      </span>
                    </div>
                    {/* ASSIGNEE DISPLAY MODIFIED HERE */}
                    <div
                      className="col-span-12 sm:col-span-2 p-3 sm:p-4 flex items-center"
                    onClick={() => navigate(`/task/${task.id}`)} // Click on assignee might open user profile or task
                    >
                      {mappedTaskAssignees.length > 0 ? (
                        <div className="flex -space-x-2 overflow-hidden items-center"
                        >
                          {mappedTaskAssignees.slice(0, MAX_DISPLAY_ASSIGNEES_IN_LIST).map((assignee) =>
                            assignee.profilePic ? (
                              <img
                                key={assignee.id}
                                src={assignee.profilePic}
                                alt={assignee.name}
                                title={assignee.name}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-white dark:ring-gray-700"
                              />
                            ) : (
                              <span
                                key={assignee.id}
                                title={assignee.name}
                                className={`w-7 h-7 sm:w-8 sm:h-8 ${assignee.color} text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ring-1 ring-white dark:ring-gray-700`}
                              >
                                {assignee.avatar}
                              </span>
                            )
                          )}
                          {mappedTaskAssignees.length > MAX_DISPLAY_ASSIGNEES_IN_LIST && (
                            <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-full ring-1 ring-white dark:ring-gray-700">
                              +{mappedTaskAssignees.length - MAX_DISPLAY_ASSIGNEES_IN_LIST}
                            </span>
                          )}
                           {/* Optionally show first assignee's name if only one or if space allows */}
                           {/* {mappedTaskAssignees.length === 1 && (
                               <span className="ml-2 text-gray-700 dark:text-gray-300 truncate text-xs sm:text-sm">
                                   {mappedTaskAssignees[0].name}
                               </span>
                           )} */}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                          Unassigned
                        </span>
                      )}
                    </div>
                    <div
                      className="col-span-6 sm:col-span-2 p-3 sm:p-4 flex items-center cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusClass(
                          task.task_status
                        )}`}
                      >
                        {String(task.task_status || "N/A").toUpperCase()}
                      </span>
                    </div>
                    <div
                      className="col-span-6 sm:col-span-2 p-3 sm:p-4 flex items-center cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div
                      className="col-span-6 sm:col-span-1 p-3 sm:p-4 flex items-center cursor-pointer"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <span
                        className={`font-medium ${getPriorityClass(
                          task.priority
                        )}`}
                      >
                        {task.priority || "N/A"}
                      </span>
                    </div>
                    <div className="col-span-6 sm:col-span-1 p-3 sm:p-4 flex items-center justify-center">
                      {/* ... Delete Button ... */}
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-600 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete Task" >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor" > <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /> </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ... No Tasks Display ...
          <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                No Tasks in this Project Yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding the first task to "{projectDetails?.project_title || "this project"}".
            </p>
            <div className="mt-6 flex justify-center gap-3">
                <button type="button" onClick={handleKanbanBoard} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/> </svg>
                    View Kanban Board
                </button>
                <button type="button" onClick={handleOpenAddTaskModal} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"> <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"/> </svg>
                    Add New Task
                </button>
            </div>
        </div>
        )
      ) : null}

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
