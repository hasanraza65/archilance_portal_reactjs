import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ProjectGrid from "./ProjectGrid";
import ProjectList from "./ProjectList";
import TaskList from "./TaskList";
import GridLoading from "@/components/skeleton/Grid";
import TableLoading from "@/components/skeleton/Table";
import { toggleAddModal, fetchProjectsAPI } from "./store";
import AddProject from "./AddProject";
import EditProject from "./EditProject";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getUserRole, getEmployeeType } from "@/pages/utility/apiHelper";
import UpdateAssigneesModal from "./UpdateAssigneesModal";
import Icon from "@/components/ui/Icon";

// ++ BREADCRUMB HOOK KO IMPORT KIYA GAYA HAI ++
import { useBreadcrumbs } from "../../../components/ui/BreadcrumbsContext";

const STATUS_OPTIONS = [
  "To-Do",
  "Backlog",
  "Awaiting Info",
  "In Progress",
  "In-house review",
  "Client Review",
  "Completed",
];

export const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("todo") || s.includes("pending"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s === "completed" || s === "done")
    return "bg-green-100 text-green-800 border-green-200";
  if (s.includes("progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
  if (s.includes("backlog"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (s.includes("on hold"))
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (s.includes("archived"))
    return "bg-gray-100 text-gray-800 border-gray-200";
  if (s.includes("delayed")) return "bg-pink-100 text-pink-800 border-pink-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
};

export const StatusFilterBar = ({
  statuses,
  activeFilter,
  onFilterChange,
  disabled = false,
  className = "",
}) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`}>
    <span className="text-sm font-medium text-slate-500 dark:text-slate-300 mr-2">
      Filter by:
    </span>
    {["All", ...statuses].map((status) => (
      <button
        key={status}
        onClick={() => onFilterChange(status)}
        disabled={disabled}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-all duration-200 ${
          activeFilter.toLowerCase() === status.toLowerCase()
            ? `${getStatusClass(
                status
              )} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-800`
            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        }`}
        style={{ ringColor: status.toLowerCase() === "all" ? "#64748b" : "" }}
      >
        {status}
      </button>
    ))}
  </div>
);

const ProjectPostPage = () => {
  // ++ CONTEXT SE 'setBreadcrumbs' FUNCTION HASIL KIYA GAYA HAI ++
  const { setBreadcrumbs } = useBreadcrumbs();
  
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem("projectPageActiveTab") || "projects");
  const [filler, setFiller] = useState(() => sessionStorage.getItem("projectView") || "grid");
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [isTaskListLoading, setTaskListLoading] = useState(true);
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [taskAssignedToMeFilter, setTaskAssignedToMeFilter] = useState(false);
  const actualUserRole = getUserRole();
  const employeeType = getEmployeeType();
  const uiRole = actualUserRole === "member" ? "customer" : actualUserRole;

  const dispatch = useDispatch();
  const {
    projects,
    isLoading: projectsDataLoading,
    isDeleting,
    isAdding,
    isUpdating,
    error: projectsError,
  } = useSelector((state) => state.project);
  
  // ++ YEH useEffect BREADCRUMB KO SET KARNE KE LIYE ADD KIYA GAYA HAI ++
  useEffect(() => {
    // Jab yeh page load hoga, to breadcrumb ko set karein
    setBreadcrumbs([{ title: "Jobs", link: "/jobs" }]);
    
    // Jab component unmount hoga (user doosre page par chala jaye), to breadcrumb ko saaf karein
    return () => {
        setBreadcrumbs([]);
    }
  }, [setBreadcrumbs]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const statusFromUrl = searchParams.get("status");

    if (tabFromUrl === 'tasks' || tabFromUrl === 'projects') {
      setActiveTab(tabFromUrl);
    }

    if (statusFromUrl && STATUS_OPTIONS.includes(statusFromUrl)) {
      const targetTab = tabFromUrl || activeTab;
      if (targetTab === 'projects') {
        setProjectStatusFilter(statusFromUrl);
      } else if (targetTab === 'tasks') {
        setTaskStatusFilter(statusFromUrl);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const apiParams = {};
    if (assignedToMeFilter) {
      apiParams.assigned_me = 1;
    }
    dispatch(fetchProjectsAPI(apiParams));
  }, [dispatch, assignedToMeFilter]);

  useEffect(() => {
    sessionStorage.setItem("projectPageActiveTab", activeTab);
  }, [activeTab]);

  const toggleView = (view) => {
    sessionStorage.setItem("projectView", view);
    setFiller(view);
  };

  const filteredProjects = useMemo(() => {
    let projectsToFilter = projects;
    if (projectStatusFilter.toLowerCase() !== "all") {
      projectsToFilter = projectsToFilter.filter(
        (project) =>
          project.status?.toLowerCase() === projectStatusFilter.toLowerCase()
      );
    }
    if (projectSearchQuery.trim() !== "") {
      const lowerCaseQuery = projectSearchQuery.toLowerCase();
      projectsToFilter = projectsToFilter.filter(
        (project) =>
          project.name?.toLowerCase().includes(lowerCaseQuery) ||
          project.des?.toLowerCase().includes(lowerCaseQuery)
      );
    }
    return projectsToFilter;
  }, [projects, projectStatusFilter, projectSearchQuery]);

  const anyOperationPending =
    projectsDataLoading || isDeleting || isAdding || isUpdating;

  const getTabClassName = (tabName) =>
    `px-6 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
      activeTab === tabName
        ? "bg-slate-800 text-white shadow-md"
        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
    }`;

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

      <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800 space-x-1 mb-5 w-min">
        <button
          className={getTabClassName("projects")}
          onClick={() => setActiveTab("projects")}
        >
          Jobs
        </button>
        <button
          className={getTabClassName("tasks")}
          onClick={() => setActiveTab("tasks")}
        >
          Projects
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
          {activeTab === "projects" ? "Jobs" : "Projects"}
        </h4>
        
        {activeTab === "projects" &&
          (employeeType === "Manager" || (uiRole !== "employee" && uiRole !== "customer" && uiRole !== "outsource")) && (
            <Button
              icon="heroicons-outline:plus"
              text="Add Job"
              className="btn-dark dark:bg-slate-800"
              onClick={() => dispatch(toggleAddModal(true))}
              disabled={anyOperationPending || isAdding}
            />
          )}
      </div>

      {activeTab === "projects" && (
        <>
          <Card className="mb-6">
            <div className="md:flex justify-between items-center space-y-4 md:space-y-0">
              <div className="relative md:w-1/3">
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Search jobs by name or description..."
                  className="form-input py-2 pl-10 w-full dark:bg-slate-800 dark:border-slate-600"
                  disabled={anyOperationPending}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon
                    icon="heroicons-outline:search"
                    className="w-5 h-5 text-slate-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                {employeeType === "Manager" && (
                  <Button
                    text="Assigned to me"
                    disabled={anyOperationPending}
                    className={`py-2 px-4 text-sm font-medium transition-colors ${
                      assignedToMeFilter
                        ? "btn-dark"
                        : "btn-outline-dark"
                    }`}
                    onClick={() => setAssignedToMeFilter(prev => !prev)}
                  />
                )}
                
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
            <hr className="my-4 border-slate-200 dark:border-slate-700" />
            <StatusFilterBar
              statuses={STATUS_OPTIONS}
              activeFilter={projectStatusFilter}
              onFilterChange={setProjectStatusFilter}
              disabled={anyOperationPending}
            />
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
            (filteredProjects.length > 0 ? (
              <>
                {filler === "grid" && (
                  <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                    {filteredProjects.map((project) => (
                      <ProjectGrid
                        project={project}
                        key={project.id}
                        userRole={uiRole}
                         employeeType={employeeType}
                      />
                    ))}
                  </div>
                )}
                {filler === "list" && (
                  <ProjectList
                    projects={filteredProjects}
                    userRole={uiRole}
                    employeeType={employeeType}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16 transition-opacity duration-300">
                <Icon
                  icon="heroicons-outline:inbox"
                  className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600"
                />
                <h4 className="mt-4 text-xl font-semibold text-slate-600 dark:text-slate-300">
                  No Jobs Found
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {projectSearchQuery
                    ? `No jobs match your search for "${projectSearchQuery}".`
                    : projectStatusFilter.toLowerCase() !== "all"
                    ? `No jobs found with the status "${projectStatusFilter}".`
                    : "There are no Jobs to display."}
                </p>
              </div>
            ))}
        </>
      )}

      {activeTab === "tasks" && (
        <>
          <Card className="mb-6">
            <div className="md:flex justify-between items-center space-y-4 md:space-y-0">
              <div className="relative md:w-1/3">
                <input
                  type="text"
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  placeholder="Search projects by title..."
                  className="form-input py-2 pl-10 w-full dark:bg-slate-800 dark:border-slate-600"
                  disabled={isTaskListLoading}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Icon
                    icon="heroicons-outline:search"
                    className="w-5 h-5 text-slate-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end">
                {employeeType === "Manager" && (
                  <Button
                    text="Assigned to me"
                    disabled={isTaskListLoading}
                    className={`py-2 px-4 text-sm font-medium transition-colors ${
                      taskAssignedToMeFilter
                        ? "btn-dark"
                        : "btn-outline-dark"
                    }`}
                    onClick={() => setTaskAssignedToMeFilter(prev => !prev)}
                  />
                )}
              </div>
            </div>
            <hr className="my-4 border-slate-200 dark:border-slate-700" />
            <StatusFilterBar
              statuses={STATUS_OPTIONS}
              activeFilter={taskStatusFilter}
              onFilterChange={setTaskStatusFilter}
              disabled={isTaskListLoading}
            />
          </Card>

          <Card noBorder>
            <TaskList
              statusFilter={taskStatusFilter}
              searchQuery={taskSearchQuery}
              onLoadingChange={setTaskListLoading}
              assignedToMe={taskAssignedToMeFilter}
            />
          </Card>
        </>
      )}

      <AddProject />
      <EditProject />
      <UpdateAssigneesModal />
    </div>
  );
};

export default ProjectPostPage;