import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import useWidth from "@/hooks/useWidth";
import Button from "@/components/ui/Button";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import GridLoading from "@/components/skeleton/Grid";
import TableLoading from "@/components/skeleton/Table";
import { toggleAddModal } from "./store";
import AddProject from "./AddProject";
import { ToastContainer } from "react-toastify";
import EditProject from "./EditProject";
import Cookies from "js-cookie";

const ProjectPostPage = () => {
  const [filler, setfiller] = useState("grid");
  const { width, breakpoints } = useWidth();
  const [isLoaded, setIsLoaded] = useState(true);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState(null);
  
  const dispatch = useDispatch();

  // Fetch projects from the API
useEffect(() => {
  const fetchProjects = async () => {
    try {
      setIsLoaded(true);
      setError(null);
      
      const token = Cookies.get("token");
      if (!token) {
        throw new Error("Authentication token not found");
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

      console.log("API Response:", response); // Debugging log

      // Check if response exists and has data
      if (!response?.data) {
        throw new Error("No data received from server");
      }

      // Handle different possible response structures
      const responseData = response.data.data || response.data.projects || response.data;
      
      if (!responseData) {
        throw new Error("Invalid project data structure");
      }

      // Ensure we're working with an array
      const projectsData = Array.isArray(responseData) ? responseData : [responseData];

      const formattedProjects = projectsData.map(project => ({
        id: project.id,
        name: project.project_name || project.name || "Unnamed Project",
        des: project.project_description || project.description || "",
        startDate: project.start_date || new Date().toISOString().split('T')[0],
        customer_id: project.customer_id || null,
        // progress: project.progress ?? calculateRandomProgress(),
        status: project.status?.toLowerCase() || "ongoing",
        endDate: project.due_date ,
        members: generateDefaultMembers()
      }));

      setProjects(formattedProjects);
    } catch (err) {
      console.error("Full error details:", err);
      console.error("Error response:", err.response);
      
      const errorMessage = err.response?.data?.message || 
                         err.message || 
                         "Failed to load projects. Please try again later.";
      setError(errorMessage);

      if (err.response?.status === 401) {
        
        console.warn("Unauthorized - please login again");
      }
    } finally {
      setIsLoaded(false);
    }
  };

  fetchProjects();
}, []);
  
const calculateEndDateFromToday = () => {
  const today = new Date();
  const dateToModify = new Date(today);
  dateToModify.setDate(dateToModify.getDate() + 30);
  return dateToModify.toISOString().split('T')[0];
};

 

  // Helper function to generate default members
  const generateDefaultMembers = () => {
    return [
      {
        image: "/assets/images/avatar/av-1.svg",
        label: "Member 1"
      },
      {
        image: "/assets/images/avatar/av-2.svg",
        label: "Member 2"
      }
    ];
  };

  // Toggle view and trigger loading animation
  const toggleView = (view) => {
    setfiller(view);
    setIsLoaded(true);
    setTimeout(() => {
      setIsLoaded(false);
    }, 1500);
  };

  return (
    <div>
      <ToastContainer />
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
            disabled={isLoaded}
            className={`${
              filler === "list"
                ? "bg-slate-900 dark:bg-slate-700  text-white"
                : " bg-white dark:bg-slate-800 dark:text-slate-300"
            }   h-min text-sm font-normal`}
            iconClass=" text-lg"
            onClick={() => toggleView("list")}
          />
          <Button
            icon="heroicons-outline:view-grid"
            text="Grid view"
            disabled={isLoaded}
            className={`${
              filler === "grid"
                ? "bg-slate-900 dark:bg-slate-700 text-white"
                : " bg-white dark:bg-slate-800 dark:text-slate-300"
            }   h-min text-sm font-normal`}
            iconClass=" text-lg"
            onClick={() => toggleView("grid")}
          />
          <Button
            icon="heroicons-outline:filter"
            text="On going"
            className="bg-white dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-900 hover:text-white btn-md  h-min text-sm font-normal"
            iconClass=" text-lg"
          />
          <Button
            icon="heroicons-outline:plus"
            text="Add Project"
            className="btn-dark dark:bg-slate-800  h-min text-sm font-normal"
            iconClass=" text-lg"
            onClick={() => dispatch(toggleAddModal(true))}
          />
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 bg-red-50 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {isLoaded && filler === "grid" && (
        <GridLoading count={projects?.length || 6} />
      )}
      {isLoaded && filler === "list" && (
        <TableLoading count={projects?.length || 6} />
      )}

      {filler === "grid" && !isLoaded && (
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
          {projects.map((project, projectIndex) => (
            <ProjectGrid project={project} key={projectIndex} />
          ))}
        </div>
      )}
      {filler === "list" && !isLoaded && (
        <div>
          <ProjectList projects={projects} />
        </div>
      )}
      <AddProject />
      <EditProject />
    </div>
  );
};

export default ProjectPostPage;