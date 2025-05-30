import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import Cookies from "js-cookie";
import useWidth from "@/hooks/useWidth";
import Button from "@/components/ui/Button";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import GridLoading from "@/components/skeleton/Grid";
import TableLoading from "@/components/skeleton/Table";
import { toggleAddModal, setProjectsStore, setProjectsLoading } from "./store";
import AddProject from "./AddProject"; // Ensure this component exists and handles adding projects
import EditProject from "./EditProject"; 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS

const ProjectPostPage = () => {
  const [filler, setFiller] = useState("grid");
  const { width, breakpoints } = useWidth();
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  
  const dispatch = useDispatch();
  const { projects, isLoading: projectsDataLoading, isDeleting } = useSelector((state) => state.project);

  const generateDefaultMembers = () => {
    return [
      { image: "/assets/images/avatar/av-1.svg", label: "Member 1" },
      { image: "/assets/images/avatar/av-2.svg", label: "Member 2" }
    ];
  };

  const calculateEndDateFromToday = (days = 30) => {
    const today = new Date();
    const dateToModify = new Date(today);
    dateToModify.setDate(dateToModify.getDate() + days);
    return dateToModify.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchProjects = async () => {
      dispatch(setProjectsLoading(true));
      setFetchError(null);
      
      try {
        const token = Cookies.get("token");
        if (!token) {
          throw new Error("Authentication token not found. Please login again.");
        }

        const response = await axios.get(
          "https://demo.Aentora.com/backend/public/api/admin/project", 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json'
            }
          }
        );

        if (!response?.data) {
          throw new Error("No data received from server.");
        }

        const responseData = response.data.data || response.data.projects || response.data;
        if (!responseData) {
          throw new Error("Invalid project data structure from API.");
        }

        const projectsApiData = Array.isArray(responseData) ? responseData : (responseData.data && Array.isArray(responseData.data) ? responseData.data : [responseData]);

        const formattedProjects = projectsApiData.map(project => ({
          id: project.id,
          name: project.project_name || project.name || "Unnamed Project",
          des: project.project_description || project.description || "",
          startDate: project.start_date || new Date().toISOString().split('T')[0],
          customer_id: project.customer_id || null,
          progress: typeof project.progress === 'number' ? project.progress : 0,
          status: project.status?.toLowerCase() || "ongoing",
          endDate: project.due_date || calculateEndDateFromToday(),
          members: project.members && project.members.length > 0 ? project.members : generateDefaultMembers()
        }));

        dispatch(setProjectsStore(formattedProjects));
      } catch (err) {
        console.error("Full error details during fetch:", err);
        const errorMessage = err.response?.data?.message || 
                           err.message || 
                           "Failed to load projects. Please try again later.";
        setFetchError(errorMessage);
        toast.error(errorMessage, { theme: "colored" });
        if (err.response?.status === 401) {
          // Handle unauthorized, e.g., redirect to login or dispatch logout action
          console.warn("Unauthorized - please login again");
        }
        dispatch(setProjectsStore([])); // Clear projects on error
      } finally {
        dispatch(setProjectsLoading(false));
      }
    };

    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]); // Only run on mount and dispatch change (which is stable)
  
  const toggleView = (view) => {
    setFiller(view);
    setIsViewLoading(true);
    setTimeout(() => {
      setIsViewLoading(false);
    }, 300); // Shorter delay
  };

  const showGridSkeleton = (projectsDataLoading || isViewLoading) && filler === "grid";
  const showListSkeleton = (projectsDataLoading || isViewLoading) && filler === "list";

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900 inline-block ltr:pr-4 rtl:pl-4">
          Project
        </h4>
        <div
          className={`${
            width < breakpoints.md ? "space-x-rb" : ""
          } md:flex md:space-x-4 md:justify-end items-center rtl:space-x-reverse`}
        >
          <Button
            icon="heroicons:list-bullet"
            text="List view"
            isLoading={isViewLoading && filler === 'list'}
            disabled={projectsDataLoading || isViewLoading || isDeleting}
            className={`${
              filler === "list"
                ? "bg-slate-900 dark:bg-slate-700  text-white"
                : " bg-white dark:bg-slate-800 dark:text-slate-300"
            } h-min text-sm font-normal`}
            iconClass="text-lg"
            onClick={() => toggleView("list")}
          />
          <Button
            icon="heroicons-outline:view-grid"
            text="Grid view"
            isLoading={isViewLoading && filler === 'grid'}
            disabled={projectsDataLoading || isViewLoading || isDeleting}
            className={`${
              filler === "grid"
                ? "bg-slate-900 dark:bg-slate-700 text-white"
                : " bg-white dark:bg-slate-800 dark:text-slate-300"
            } h-min text-sm font-normal`}
            iconClass="text-lg"
            onClick={() => toggleView("grid")}
          />
          <Button
            icon="heroicons-outline:filter"
            text="On going" // Placeholder
            className="bg-white dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-900 hover:text-white btn-md h-min text-sm font-normal"
            iconClass="text-lg"
            // onClick={() => { /* Implement filter logic */ }}
            disabled={isDeleting}
          />
          <Button
            icon="heroicons-outline:plus"
            text="Add Project"
            className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
            iconClass="text-lg"
            onClick={() => dispatch(toggleAddModal(true))}
            disabled={isDeleting || projectsDataLoading}
          />
        </div>
      </div>
      
      {fetchError && !projectsDataLoading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{fetchError}</span>
        </div>
      )}
      
      {showGridSkeleton && <GridLoading count={projects?.length > 0 ? projects.length : 6} />}
      {showListSkeleton && <TableLoading count={projects?.length > 0 ? projects.length : 6} />}

      {!projectsDataLoading && !isViewLoading && filler === "grid" && (
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <ProjectGrid project={project} key={project.id} />
            ))
          ) : (
            !fetchError && <div className="col-span-full text-center py-10 text-slate-500">No projects found.</div>
          )}
        </div>
      )}
      {!projectsDataLoading && !isViewLoading && filler === "list" && (
        <div>
          {projects && projects.length > 0 ? (
             <ProjectList projects={projects} />
          ) : (
            !fetchError && <div className="text-center py-10 text-slate-500">No projects found.</div>
          )}
        </div>
      )}
      <AddProject />
      <EditProject />
    </div>
  );
};

export default ProjectPostPage;