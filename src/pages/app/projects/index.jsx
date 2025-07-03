import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Button from "@/components/ui/Button";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import GridLoading from "@/components/skeleton/Grid";
import TableLoading from "@/components/skeleton/Table";
import Pagination from "@/components/ui/Pagination";
import {
  toggleAddModal,
  fetchProjectsAPI,
} from "./store";
import AddProject from "./AddProject";
import EditProject from "./EditProject";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiPrefix } from "@/pages/utility/apiHelper";

const ProjectPostPage = () => {
  const [filler, setFiller] = useState("grid");
  const { width, breakpoints } = useWidth();
  const [isViewLoading, setIsViewLoading] = useState(false);
  const userRole = getApiPrefix();

  const dispatch = useDispatch();
  const {
    projects,
    isLoading: projectsDataLoading,
    isDeleting,
    isAdding,
    isUpdating,
    error: projectsError,
    currentPage,
    totalPages,
  } = useSelector((state) => state.project);

  useEffect(() => {
    dispatch(fetchProjectsAPI(1));
  }, [dispatch]);

  const toggleView = (view) => {
    setFiller(view);
    setIsViewLoading(true);
    setTimeout(() => {
      setIsViewLoading(false);
    }, 300);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      dispatch(fetchProjectsAPI(page));
    }
  };

  const anyOperationPending = projectsDataLoading || isDeleting || isAdding || isUpdating;
  const showGridSkeleton = (projectsDataLoading || isViewLoading) && filler === "grid";
  const showListSkeleton = (projectsDataLoading || isViewLoading) && filler === "list";

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
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
            isLoading={isViewLoading && filler === "list"}
            disabled={anyOperationPending}
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
            isLoading={isViewLoading && filler === "grid"}
            disabled={anyOperationPending}
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
            text="On going"
            className="bg-white dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-900 hover:text-white btn-md h-min text-sm font-normal"
            iconClass="text-lg"
            disabled={anyOperationPending}
          />
          {userRole !== 'employee' && userRole !== 'customer' && (
            <Button
              icon="heroicons-outline:plus"
              text="Add Project"
              className="btn-dark dark:bg-slate-800 h-min text-sm font-normal"
              iconClass="text-lg"
              onClick={() => dispatch(toggleAddModal(true))}
              disabled={anyOperationPending || isAdding}
            />
          )}
        </div>
      </div>

      {projectsError && !projectsDataLoading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{typeof projectsError === 'string' ? projectsError : 'An unknown error occurred.'}</span>
        </div>
      )}

      {showGridSkeleton && <GridLoading count={6} />}
      {showListSkeleton && <TableLoading count={6} />}

      {!projectsDataLoading && !isViewLoading && filler === "grid" && (
        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <ProjectGrid project={project} key={project.id} />
            ))
          ) : (
            !projectsError && <div className="col-span-full text-center py-10 text-slate-500">No projects found.</div>
          )}
        </div>
      )}
      {!projectsDataLoading && !isViewLoading && filler === "list" && (
        <div>
          {projects && projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            !projectsError && <div className="text-center py-10 text-slate-500">No projects found.</div>
          )}
        </div>
      )}

      {!anyOperationPending && projects && projects.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            className="bg-slate-100 dark:bg-slate-500 w-fit py-2 px-3 rounded-md"
            totalPages={totalPages}
            currentPage={currentPage}
            handlePageChange={handlePageChange}
          />
        </div>
      )}

      <AddProject />
      <EditProject />
    </div>
  );
};

export default ProjectPostPage;