// src/pages/app/projects/index.js (FINAL CODE)

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { useBreadcrumbs } from "../../../components/ui/BreadcrumbsContext";
import MembersView from "./MembersView/MembersView";

const STATUS_OPTIONS = [
  "On Hold",
  "Backlog",
  "Awaiting Info",
  "In Progress",
  "In-house review",
  "Client Review",
  "Completed",
];

export const getStatusClass = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "done")
    return "bg-green-100 text-green-800 border-green-200";
  if (s.includes("progress"))
    return "bg-blue-100 text-blue-800 border-blue-200";
  if (s.includes("cancel")) return "bg-red-100 text-red-800 border-red-200";
  if (s.includes("backlog"))
    return "bg-purple-100 text-purple-800 border-purple-200";
  if (s.includes("on hold"))
    return "bg-orange-100 text-orange-800 border-orange-200";
  if (s.includes("review"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
};

const getStatusGradient = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("completed") || s.includes("done"))
    return "from-green-50 to-green-100 dark:from-green-800 dark:to-green-900";
  if (s.includes("progress"))
    return "from-blue-50 to-blue-100 dark:from-blue-800 dark:to-blue-900";
  if (s.includes("backlog") || s.includes("hold"))
    return "from-purple-50 to-purple-100 dark:from-purple-800 dark:to-purple-900";
  if (s.includes("review"))
    return "from-yellow-50 to-yellow-100 dark:from-yellow-800 dark:to-yellow-900";
  return "from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800";
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
  const { setBreadcrumbs } = useBreadcrumbs();
  const TASK_FILTER_STORAGE_KEY = "projectPostPage_taskFilter";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem("projectPageActiveTab") || "projects"
  );
  const [projectStatusFilter, setProjectStatusFilter] = useState("All");
  const [taskStatusFilter, setTaskStatusFilter] = useState(
    () => localStorage.getItem(TASK_FILTER_STORAGE_KEY) || "All"
  );
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [isTaskListLoading, setTaskListLoading] = useState(true);
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [taskAssignedToMeFilter, setTaskAssignedToMeFilter] = useState(false);
  const actualUserRole = getUserRole();
  const employeeType = getEmployeeType();
  const uiRole = actualUserRole === "member" ? "customer" : actualUserRole;

  const [filler, setFiller] = useState(
    () => sessionStorage.getItem("projectView") || "grid"
  );
  const [expandedSections, setExpandedSections] = useState({});

  const dispatch = useDispatch();
  const {
    projects,
    isLoading: projectsDataLoading,
    isDeleting,
    isAdding,
    isUpdating,
    error: projectsError,
  } = useSelector((state) => state.project);

  useEffect(() => {
    setBreadcrumbs([{ title: "Jobs", link: "/jobs" }]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    localStorage.setItem(TASK_FILTER_STORAGE_KEY, taskStatusFilter);
  }, [taskStatusFilter]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    const statusFromUrl = searchParams.get("status");
    if (["tasks", "projects", "members"].includes(tabFromUrl))
      setActiveTab(tabFromUrl);
    if (statusFromUrl && STATUS_OPTIONS.includes(statusFromUrl)) {
      const targetTab = tabFromUrl || activeTab;
      if (targetTab === "projects") setProjectStatusFilter(statusFromUrl);
      else if (targetTab === "tasks") setTaskStatusFilter(statusFromUrl);
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    const apiParams = {};
    if (assignedToMeFilter) apiParams.assigned_me = 1;
    dispatch(fetchProjectsAPI(apiParams));
  }, [dispatch, assignedToMeFilter]);

  useEffect(() => {
    sessionStorage.setItem("projectPageActiveTab", activeTab);
  }, [activeTab]);

  const toggleView = (view) => {
    sessionStorage.setItem("projectView", view);
    setFiller(view);
  };

  useEffect(() => {
    if (
      projects &&
      typeof projects === "object" &&
      Object.keys(projects).length > 0
    ) {
      const initialExpandedState = {};
      Object.keys(projects).forEach((status) => {
        initialExpandedState[status] = true;
      });
      setExpandedSections(initialExpandedState);
    }
  }, [projects]);

  const anyOperationPending =
    projectsDataLoading || isDeleting || isAdding || isUpdating;

  const getTabClassName = (tabName) =>
    `px-6 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
      activeTab === tabName
        ? "bg-slate-800 text-white shadow-md"
        : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
    }`;

  const pageTitle = useMemo(() => {
    if (activeTab === "projects") return "Jobs";
    if (activeTab === "tasks") return "Projects";
    if (activeTab === "members") return "Members View";
    return "Jobs";
  }, [activeTab]);

  const toggleSection = useCallback((status) => {
    setExpandedSections((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const hasVisibleProjects = useMemo(() => {
    if (
      !projects ||
      typeof projects !== "object" ||
      Object.keys(projects).length === 0
    )
      return false;
    const statusesToRender =
      projectStatusFilter.toLowerCase() === "all"
        ? Object.keys(projects)
        : [projectStatusFilter];
    for (const status of statusesToRender) {
      if (projects[status]) {
        const projectsForStatus = projects[status].filter((p) =>
          (p.project_name?.toLowerCase() || "").includes(
            projectSearchQuery.toLowerCase()
          )
        );
        if (projectsForStatus.length > 0) return true;
      }
    }
    return false;
  }, [projects, projectStatusFilter, projectSearchQuery]);

  return (
    <div>
      {/* ... ToastContainer, Tabs, Page Title ... */}
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-medium lg:text-2xl text-xl capitalize text-slate-900">
          {pageTitle}
        </h4>
        {activeTab === "projects" &&
          (employeeType === "Manager" ||
            employeeType === "Supervisor" ||
            (uiRole !== "employee" &&
              uiRole !== "customer" &&
              uiRole !== "outsource")) && (
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
              <div className="relative md:w-1/3 w-full">
                <input
                  type="text"
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  placeholder="Search jobs..."
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
                {(employeeType === "Manager" ||
                  employeeType === "Supervisor") && (
                  <Button
                    text="Assigned to me"
                    disabled={anyOperationPending}
                    className={`py-2 px-4 text-sm font-medium transition-colors ${
                      assignedToMeFilter ? "btn-dark" : "btn-outline-dark"
                    }`}
                    onClick={() => setAssignedToMeFilter((prev) => !prev)}
                  />
                )}
                <div className="flex items-center space-x-2">
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
                </div>
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
              <TableLoading count={5} />
            ))}
          {!projectsDataLoading && projectsError && (
            <div className="...error_div...">{projectsError}</div>
          )}

          {!projectsDataLoading &&
            !projectsError &&
            (hasVisibleProjects ? (
              <>
                {filler === "grid" ? (
                  <div className="space-y-6">
                    {(projectStatusFilter.toLowerCase() === "all"
                      ? Object.keys(projects)
                      : [projectStatusFilter]
                    ).map((status) => {
                      if (!projects[status]) return null;
                      const projectsForStatus = projects[status].filter((p) =>
                        (p.project_name?.toLowerCase() || "").includes(
                          projectSearchQuery.toLowerCase()
                        )
                      );
                      if (projectsForStatus.length === 0) return null;
                      return (
                        <div
                          key={status}
                          className="rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700"
                        >
                          <div
                            className={`flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r ${getStatusGradient(
                              status
                            )}`}
                            onClick={() => toggleSection(status)}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon
                                icon={
                                  expandedSections[status]
                                    ? "heroicons:chevron-down"
                                    : "heroicons:chevron-right"
                                }
                                className="w-5 h-5 text-slate-600 dark:text-slate-300"
                              />
                              <h3 className="text-lg font-semibold capitalize text-slate-800 dark:text-slate-200">
                                {status}
                              </h3>
                              <span className="px-2 py-1 bg-white/70 dark:bg-slate-900/50 rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
                                {projectsForStatus.length}
                              </span>
                            </div>
                          </div>
                          {expandedSections[status] && (
                            <div className="p-5 bg-slate-50 dark:bg-slate-900/50">
                              <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
                                {projectsForStatus.map((project) => (
                                  <ProjectGrid
                                    project={project}
                                    key={project.id}
                                    userRole={uiRole}
                                    employeeType={employeeType}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <ProjectList
                    projectsByStatus={projects}
                    userRole={uiRole}
                    employeeType={employeeType}
                    searchQuery={projectSearchQuery}
                    statusFilter={projectStatusFilter}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-16">
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
                    : "No jobs to display."}
                </p>
              </div>
            ))}
        </>
      )}

      {/* ... TaskList and MembersView tabs ... */}
      {activeTab === "tasks" && (
        <TaskList
          statusFilter={taskStatusFilter}
          searchQuery={taskSearchQuery}
          onLoadingChange={setTaskListLoading}
          assignedToMe={taskAssignedToMeFilter}
        />
      )}
      {activeTab === "members" && <MembersView />}
      <AddProject />
      <EditProject />
      <UpdateAssigneesModal />
    </div>
  );
};

export default ProjectPostPage;
