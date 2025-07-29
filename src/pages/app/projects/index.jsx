import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import useWidth from "@/hooks/useWidth";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import GridLoading from "@/components/skeleton/Grid";
import TableLoading from "@/components/skeleton/Table";
import Pagination from "@/components/ui/Pagination";
import { toggleAddModal, fetchProjectsAPI } from "./store";
import AddProject from "./AddProject";
import EditProject from "./EditProject";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiPrefix } from "@/pages/utility/apiHelper";
import UpdateAssigneesModal from "./UpdateAssigneesModal";
import Icon from "@/components/ui/Icon";

// Helper function and statuses from your file
const STATUS_OPTIONS = [
  "In Progress",
  "Pending",
  "Completed",
  "Cancelled",
  "Backlog",
  "On Hold",
  "Archived",
  "Delayed",
];

const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();

  if (s === "completed" || s === "done")
    return "bg-green-100 text-green-800 border-green-200";

  if (s.includes("progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";

  if (s.includes("pending"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";

  if (s.includes("cancel"))
    return "bg-red-100 text-red-800 border-red-200";

  if (s.includes("backlog"))
    return "bg-purple-100 text-purple-800 border-purple-200";

  if (s.includes("on hold"))
    return "bg-orange-100 text-orange-800 border-orange-200";

  if (s.includes("archived"))
    return "bg-gray-100 text-gray-800 border-gray-200";

  if (s.includes("delayed"))
    return "bg-pink-100 text-pink-800 border-pink-200";

  return "bg-slate-100 text-slate-800 border-slate-200";
};

const ProjectPostPage = () => {
  const [filler, setFiller] = useState(
    () => sessionStorage.getItem("projectView") || "grid"
  );
  const [statusFilter, setStatusFilter] = useState("all");
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
    sessionStorage.setItem("projectView", view);
    setFiller(view);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      dispatch(fetchProjectsAPI(page));
    }
  };

  const filteredProjects = useMemo(() => {
    if (statusFilter === "all") {
      return projects;
    }
    return projects.filter(
      (project) => project.status?.toLowerCase() === statusFilter.toLowerCase()
    );
  }, [projects, statusFilter]);

  const statusFilterButtons = ["All", ...STATUS_OPTIONS];

  const anyOperationPending =
    projectsDataLoading || isDeleting || isAdding || isUpdating;

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

      <div className="flex justify-between items-center mb-6">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
          Projects
        </h4>
        {userRole !== "employee" && userRole !== "customer" && (
          <Button
            icon="heroicons-outline:plus"
            text="Add Project"
            className="btn-dark dark:bg-slate-800"
            onClick={() => dispatch(toggleAddModal(true))}
            disabled={anyOperationPending || isAdding}
          />
        )}
      </div>

      <Card className="mb-6">
        <div className="md:flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-2 md:mb-0 mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-300">
              Filter by:
            </span>
            {statusFilterButtons.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status.toLowerCase())}
                disabled={anyOperationPending}
                className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all duration-200 ${
                  statusFilter.toLowerCase() === status.toLowerCase()
                    ? `${getStatusClass(
                        status
                      )} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800`
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                style={{
                  ringColor: status.toLowerCase() === "all" ? "#64748b" : "",
                }}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              icon="heroicons:list-bullet"
              disabled={anyOperationPending}
              className={`p-2 transition-colors ${
                filler === "list"
                  ? "bg-slate-900 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100"
              }`}
              onClick={() => toggleView("list")}
            />
            <Button
              icon="heroicons-outline:view-grid"
              disabled={anyOperationPending}
              className={`p-2 transition-colors ${
                filler === "grid"
                  ? "bg-slate-900 text-white"
                  : "bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100"
              }`}
              onClick={() => toggleView("grid")}
            />
          </div>
        </div>
      </Card>

      {projectsDataLoading &&
        (filler === "grid" ? (
          <GridLoading count={6} />
        ) : (
          <TableLoading count={6} />
        ))}

      {!projectsDataLoading && projectsError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong>Error: </strong>
          <span>
            {typeof projectsError === "string"
              ? projectsError
              : "An unknown error occurred."}
          </span>
        </div>
      )}

      {!projectsDataLoading &&
        !projectsError &&
        filteredProjects.length === 0 && (
          <div className="text-center py-16 transition-opacity duration-300">
            <Icon
              icon="heroicons-outline:inbox"
              className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600"
            />
            <h4 className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-300">
              No Projects Found
            </h4>
            <p className="mt-1 text-sm text-slate-500">
              {statusFilter !== "all"
                ? `No projects found with the status "${statusFilter}".`
                : "There are no projects to display."}
            </p>
          </div>
        )}

      {!projectsDataLoading &&
        !projectsError &&
        filteredProjects.length > 0 && (
          <>
            {filler === "grid" && (
              <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                {filteredProjects.map((project) => (
                  <ProjectGrid
                    project={project}
                    key={project.id}
                    userRole={userRole}
                  />
                ))}
              </div>
            )}
            {filler === "list" && (
              <ProjectList projects={filteredProjects} userRole={userRole} />
            )}
          </>
        )}

      {!anyOperationPending && filteredProjects.length > 0 && (
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
      <UpdateAssigneesModal />
    </div>
  );
};

export default ProjectPostPage;
